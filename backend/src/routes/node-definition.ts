import express from "express";
import { NODE_DEFINITIONS } from "../nodes/definitions";
import { successResponse } from "../lib/response";
import { NotFoundError } from "../lib/errors";

const NodeDefinitionRouter = express.Router();

// GET /api/node-definitions - Returns all node definitions with metadata
NodeDefinitionRouter.get("/", async (req, res) => {
  return successResponse(res, Object.values(NODE_DEFINITIONS));
});

// GET /api/node-definitions/:type - Returns single node definition
NodeDefinitionRouter.get("/:type", async (req, res) => {
  const { type } = req.params;
  const definition = NODE_DEFINITIONS[type as keyof typeof NODE_DEFINITIONS];
  
  if (!definition) {
    throw new NotFoundError("Node type", type);
  }
  
  return successResponse(res, definition);
});

export default NodeDefinitionRouter;
