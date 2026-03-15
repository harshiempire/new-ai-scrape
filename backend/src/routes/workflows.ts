import express from "express";
import { z } from "zod";
import { WorkflowExecutor } from "../workflow/WorkflowExecutor";
import { WorkflowDefinition } from "../lib/types";
import { prisma } from "../prisma";
import { successResponse } from "../lib/response";
import { NotFoundError, ValidationError, ExecutionError } from "../lib/errors";

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
  const validation = workflowSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid workflow data", validation.error.issues);
  }

  const { name, nodes, edges } = validation.data;
  const workflow = await prisma.workflow.create({
    data: { name, nodes, edges },
  });

  return successResponse(res, workflow, 201);
});

// GET /api/workflows
workflowRouter.get("/", async (req, res) => {
  const workflows = await prisma.workflow.findMany({
    select: {
      createdAt: true,
      name: true,
      updatedAt: true,
      id: true,
    },
  });
  return successResponse(res, workflows);
});

// GET /api/workflows/:id
workflowRouter.get("/:id", async (req, res) => {
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
    throw new NotFoundError("Workflow", req.params.id);
  }

  return successResponse(res, workflow);
});

// GET /api/workflows/:id/executions
workflowRouter.get("/:id/executions", async (req, res) => {
  const executions = await prisma.execution.findMany({
    where: { workflowId: req.params.id },
  });

  return successResponse(res, executions);
});

// PATCH /api/workflows/:id
workflowRouter.patch("/:id", async (req, res) => {
  const patchWorkflowSchema = workflowSchema.partial();
  const validation = patchWorkflowSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError("Invalid workflow data", validation.error.issues);
  }

  const { name, nodes, edges } = validation.data;
  const workflow = await prisma.workflow.update({
    where: { id: req.params.id },
    data: {
      ...(name && { name }),
      ...(nodes && { nodes }),
      ...(edges && { edges }),
    },
  });

  return successResponse(res, workflow);
});

// DELETE /api/workflows/:id
workflowRouter.delete("/:id", async (req, res) => {
  await prisma.workflow.delete({
    where: { id: req.params.id },
  });

  return successResponse(res, { deleted: true });
});

// POST /api/workflows/:id/run
workflowRouter.post("/:id/run", async (req, res) => {
  const startTime = Date.now();

  const validation = runWorkflowSchema.safeParse(req.body);
  if (!validation.success) {
    throw new ValidationError(
      "Invalid run parameters",
      validation.error.issues,
    );
  }

  const { id } = req.params;
  const { initialInputs } = validation.data;

  const workflow = await prisma.workflow.findUnique({ where: { id } });
  if (!workflow) {
    throw new NotFoundError("Workflow", id);
  }

  const nextRunNumber = await getNextRunNumber(id);

  const execution = await prisma.execution.create({
    data: {
      workflowId: id,
      status: "Started",
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

  if (!execution.executionData || execution.executionData.id === null) {
    throw new ExecutionError("Execution data not found for the execution");
  }

  try {
    const executor = new WorkflowExecutor(
      workflow as unknown as WorkflowDefinition,
      initialInputs,
      execution.executionData.id,
    );

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

    return successResponse(res, {
      message: "Workflow executed successfully",
      executionId: execution.id,
      executionDataId: execution.executionData.id,
      result,
    });
  } catch (error: any) {
    if (error.nodeId !== undefined) {
      const executionData = await prisma.executionData.findFirst({
        where: { id: error.executionDataId },
        include: { execution: true },
      });

      if (executionData) {
        const newVariablePool = {
          ...(executionData.variablePool as Record<string, any>),
          [error.nodeId]: {
            message: error.message,
            stack: error.stack,
          },
        };

        await prisma.executionData.update({
          where: { id: error.executionDataId },
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
    }

    throw new ExecutionError("Failed to execute workflow", {
      originalError: error.message,
      nodeId: error.nodeId,
    });
  }
});

export default workflowRouter;
