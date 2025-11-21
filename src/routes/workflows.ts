import express from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { WorkflowExecutor } from "../WorkflowExecutor";
import { WorkflowDefinition } from "../types";

const workflowRouter = express.Router();

// Schema validation
const workflowSchema = z.object({
  name: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

const runWorkflowSchema = z.object({
  initialInputs: z.record(z.any(), z.any()),
});

// Helper function to get the next run number for a workflow
async function getNextRunNumber(workflowId: string): Promise<number> {
  const lastExecution = await prisma.execution.findFirst({
    where: { workflowId },
    orderBy: { startedAt: "desc" },
  });

  if (!lastExecution) return 1;

  const lastRunMatch = lastExecution.runNumber;
  if (!lastRunMatch) return 1;

  return lastRunMatch + 1;
}

// POST /api/workflows
workflowRouter.post("/", async (req, res) => {
  try {
    const validation = workflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { name, nodes, edges } = req.body;
    const workflow = await prisma.workflow.create({
      data: {
        name,
        nodes,
        edges,
      },
    });

    res.status(201).json(workflow);
  } catch (error) {
    console.error("Error creating workflow:", error);
    res.status(500).json({ error: "Failed to create workflow" });
  }
});

// GET /api/workflows
workflowRouter.get("/", async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany({
      select: {
        createdAt: true,
        name: true,
        updatedAt: true,
        id: true,
      },
    });
    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// GET /api/workflows/:id
workflowRouter.get("/:id", async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      select: {
        nodes: true,
        edges: true,
        createdAt: true,
        name: true,
        updatedAt: true,
        id: true,
      },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    res.json(workflow);
  } catch (error) {
    console.error("Error fetching workflow:", error);
    res.status(500).json({ error: "Failed to fetch workflow" });
  }
});

workflowRouter.get("/:id/executions", async (req, res) => {
  try {
    const executions = await prisma.execution.findMany({
      where: { workflowId: req.params.id },
    });

    return res.json(executions);
  } catch (error) {
    console.error("Error fetching executions for workflow:", error);
    res.status(500).json({ error: "Failed to fetch executions for workflow" });
  }
});

// PATCH /api/workflows/:id
workflowRouter.patch("/:id", async (req, res) => {
  try {
    const { name, nodes, edges } = req.body;
    const workflow = await prisma.workflow.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(nodes && { nodes }),
        ...(edges && { edges }),
      },
    });

    res.json(workflow);
  } catch (error) {
    console.error("Error updating workflow:", error);
    res.status(500).json({ error: "Failed to update workflow" });
  }
});

// DELETE /api/workflows/:id
workflowRouter.delete("/:id", async (req, res) => {
  try {
    await prisma.workflow.delete({
      where: { id: req.params.id },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting workflow:", error);
    res.status(500).json({ error: "Failed to delete workflow" });
  }
});

// POST /api/workflows/:id/run
workflowRouter.post("/:id/run", async (req, res) => {
  try {
    const startTime = Date.now();

    const validation = runWorkflowSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { id } = req.params;
    const { initialInputs } = req.body;

    // Get workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id },
    });

    if (workflow === null) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    // Get next run number
    const nextRunNumber = await getNextRunNumber(id);

    // Create new execution
    const execution = await prisma.execution.create({
      data: {
        workflowId: id,
        status: `Started`,
        runNumber: nextRunNumber,
        executionData: {
          create: {
            initialInputs: initialInputs,
            variablePool: {},
          },
        },
      },
      include: {
        executionData: true,
      },
    });

    console.log(
      `\n=== Starting Workflow Execution: ${workflow.name} (Run #${nextRunNumber}) ===`
    );
    console.log(`\n Execution ID: ${execution.id}`);
    console.log(
      `\n Execution which is created ${JSON.stringify(execution, null, 2)}`
    );

    // Initialize workflow executor
    if (execution.executionData && execution.executionData.id !== null) {
      const executor = new WorkflowExecutor(
        workflow as unknown as WorkflowDefinition,
        initialInputs,
        execution.executionData.id
      );

      // Execute workflow
      const result = await executor.execute();
      const endTime = Date.now();
      await prisma.execution.update({
        where: { id: execution.id },
        data: {
          status: "Completed",
          completedAt: new Date(),
          executionTime: endTime - startTime,
        },
      });

      return res.json({
        message: "Workflow executed successfully",
        executionId: execution.id,
        executionDataId: execution.executionData.id,
        result,
      });
    } else {
      throw new Error("Execution data not found for the execution");
    }
  } catch (error) {
    console.error("Error running workflow:", error);
    if (error.nodeId !== undefined) {
      const executionData = await prisma.executionData.findFirst({
        where: { id: error.executionDataId },
        include: {
          execution: true,
        },
      });
      console.log("\nerror execution", executionData);

      const newVariablePool = {
        ...(executionData.variablePool as Record<string, any>),
        [error.nodeId]: {
          message: error.message,
          stack: error.stack,
        },
      };
      // await prisma.execution.update({
      //   where: {
      //     id: executionData.execution.id,
      //   },
      //   data: {
      //     status: "Failed",
      //     completedAt: new Date(),
      //   },
      // });
      await prisma.executionData.update({
        where: {
          id: error.executionDataId,
        },
        data: {
          variablePool: newVariablePool,
          execution: {
            update: {
              status: "Failed",
              completedAt: new Date(),
            },
          },
        },
      });
    }
    res.status(500).json({ error: "Failed to execute workflow \n" + error });
  }
});

// Options for CORS
workflowRouter.options("/", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

workflowRouter.options("/:id", (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, DELETE, OPTIONS"
  );
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.sendStatus(204);
});

export default workflowRouter;
