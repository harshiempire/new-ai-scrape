import express from "express";
import { prisma } from "../lib/prisma";
import { z } from "zod";

const router = express.Router();

// Schema validation
const workflowSchema = z.object({
  name: z.string(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
});

// POST /api/workflows
router.post("/", async (req, res) => {
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
router.get("/", async (req, res) => {
  try {
    const workflows = await prisma.workflow.findMany();
    res.json(workflows);
  } catch (error) {
    console.error("Error fetching workflows:", error);
    res.status(500).json({ error: "Failed to fetch workflows" });
  }
});

// GET /api/workflows/:id
router.get("/:id", async (req, res) => {
  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: req.params.id },
      include: { executions: true },
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

export default router;
