import { z } from "zod";

export interface Edge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface NodeDefinition {
  id: string;
  type: string;
  label: string;
  props?: Record<string, any>;
  // Schema definitions stored in workflow JSON
  inputSchema?: Record<string, any>; // Map<edgeId, schema>
  outputSchema?: Record<string, any>; // Schema for this node's output
}

export interface WorkflowDefinition {
  nodes: NodeDefinition[];
  edges: Edge[];
}

export type Indegree = Map<string, number>;

// Schema types
export type ZodSchemaDefinition = z.ZodTypeAny;
export type SchemaMap = Map<string, ZodSchemaDefinition>;
