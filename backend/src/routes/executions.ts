import express from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";
import { successResponse } from "../lib/response";
import { NotFoundError } from "../lib/errors";

const executionRouter = express.Router();

// Schema validation
const executionSchema = z.object({
  workflowId: z.string(),
  status: z.string(),
});

// async function hello() {
//   try {
//     throw new Error("Hello");
//   } catch (error) {
//     throw error;
//   }
// }

// POST /api/executions
executionRouter.post("/", async (req, res) => {
  // await hello();
  // return res.status(200).json({ message: "Hello" });
  const validation = executionSchema.parse(req.body);

  const { workflowId, status } = validation;

  // Check if workflow exists
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId },
  });

  if (!workflow) {
    throw new NotFoundError("Workflow", workflowId);
  }

  const execution = await prisma.execution.create({
    data: { workflowId, status },
  });

  return successResponse(res, execution, 201);
});

// GET /api/executions
executionRouter.get("/", async (req, res) => {
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

  return successResponse(res, executions);
});

// PUT /api/executions/:id
executionRouter.put("/:id", async (req, res) => {
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
              create: {
                initialInputs: {},
                variablePool,
              },
              update: { variablePool },
            },
          }
        : undefined,
    },
    include: {
      executionData: true,
    },
  });

  return successResponse(res, execution);
});

// GET /api/executions/data/:id
executionRouter.get("/data/:id", async (req, res) => {
  const executionId = req.params.id;

  const execution = await prisma.execution.findFirst({
    where: { id: executionId },
    select: { executionData: true },
  });

  if (!execution) {
    throw new NotFoundError("Execution", executionId);
  }

  return successResponse(res, execution);
});

export default executionRouter;
