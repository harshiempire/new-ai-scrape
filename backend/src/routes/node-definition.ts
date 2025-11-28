import express from "express";
import { NODE_DEFINITIONS } from "../nodes/definitions";

const NodeDefinitionRouter = express.Router();

// GET /api/node-definitions
NodeDefinitionRouter.get("/", async (req, res) => {
  try {
    const definitions = NODE_DEFINITIONS;
    res.json(definitions);
  } catch (error) {
    console.error("Error fetching node definitions:", error);
    res.status(500).json({ error: "Failed to fetch node definitions" });
  }
});

export default NodeDefinitionRouter;
