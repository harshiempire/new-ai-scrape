import express from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = express.Router();

// Schema validation
const executionSchema = z.object({
  workflowId: z.string(),
  status: z.string(),
});

// POST /api/executions
router.post("/", async (req, res) => {
  try {
    const validation = executionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: validation.error });
    }

    const { workflowId, status } = req.body;

    // Check if workflow exists
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return res.status(404).json({ error: "Workflow not found" });
    }

    const execution = await prisma.execution.create({
      data: {
        workflowId,
        status,
      },
    });

    res.status(201).json(execution);
  } catch (error) {
    console.error("Error creating execution:", error);
    res.status(500).json({ error: "Failed to create execution" });
  }
});

// GET /api/executions
router.get("/", async (req, res) => {
  try {
    const { workflowId, status } = req.query;

    const where: any = {};
    if (workflowId) where.workflowId = workflowId;
    if (status) where.status = status;

    const executions = await prisma.execution.findMany({
      where,
      include: {
        workflow: true,
        executionData: true,
      },
    });

    res.json(executions);
  } catch (error) {
    console.error("Error fetching executions:", error);
    res.status(500).json({ error: "Failed to fetch executions" });
  }
});

// PUT /api/executions/:id
router.put("/:id", async (req, res) => {
  try {
    const { status, completedAt, executionTime, variablePool } = req.body;

    const execution = await prisma.execution.update({
      where: { id: req.params.id },
      data: {
        status,
        completedAt: completedAt ? new Date(completedAt) : undefined,
        executionTime,
        executionData: variablePool
          ? {
              upsert: {
                create: { variablePool },
                update: { variablePool },
              },
            }
          : undefined,
      },
      include: {
        executionData: true,
      },
    });

    res.json(execution);
  } catch (error) {
    console.error("Error updating execution:", error);
    res.status(500).json({ error: "Failed to update execution" });
  }
});

export default router;
