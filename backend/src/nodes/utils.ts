import { Node as WorkflowNode } from "./Node";
import { Edge, Indegree } from "../lib/types";
import { z } from "zod";

/**
 * Helper to validate input data against schema (used by nodes)
 */
export function validateData(
  schema: z.ZodTypeAny,
  data: any,
  context: string
): any {
  try {
    const validated = schema.parse(data);
    console.log(`✓ Validation passed for ${context}`);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error(`✗ Validation failed for ${context}:`, error.issues);
      throw new Error(
        `Validation failed for ${context}: ${JSON.stringify(error.issues)}`
      );
    }
    throw error;
  }
}

/**
 * Parse schema definition from JSON to Zod schema
 */
export function parseSchemaDefinition(schemaDef: any): z.ZodTypeAny {
  if (!schemaDef || typeof schemaDef !== "object") {
    return z.any();
  }

  // Handle Zod schema objects (already parsed)
  if (schemaDef._def) {
    return schemaDef;
  }

  // Parse from JSON definition
  const schemaObj: Record<string, z.ZodTypeAny> = {};

  for (const [key, value] of Object.entries(schemaDef)) {
    if (typeof value === "string") {
      // Simple type definitions: "string", "number", "boolean"
      switch (value) {
        case "string":
          schemaObj[key] = z.string();
          break;
        case "number":
          schemaObj[key] = z.number();
          break;
        case "boolean":
          schemaObj[key] = z.boolean();
          break;
        case "any":
          schemaObj[key] = z.any();
          break;
        default:
          schemaObj[key] = z.any();
      }
    } else if (value && typeof value === "object" && "type" in value) {
      // More complex definitions: { type: "string", optional: true }
      const valueObj = value as { type: string; optional?: boolean };
      let fieldSchema: z.ZodTypeAny;

      switch (valueObj.type) {
        case "string":
          fieldSchema = z.string();
          break;
        case "number":
          fieldSchema = z.number();
          break;
        case "boolean":
          fieldSchema = z.boolean();
          break;
        case "array":
          fieldSchema = z.array(z.any());
          break;
        case "object":
          fieldSchema = z.object({}).passthrough();
          break;
        default:
          fieldSchema = z.any();
      }

      if (valueObj.optional) {
        fieldSchema = fieldSchema.optional();
      }

      schemaObj[key] = fieldSchema;
    }
  }

  return z.object(schemaObj);
}

export function buildIndegree(
  nodes: Map<string, WorkflowNode>,
  edges: Edge[]
): Indegree {
  const indegree: Indegree = new Map();

  nodes.forEach((node) => {
    indegree.set(node.id, 0);
  });

  edges.forEach((edge) => {
    const currentIndegree = indegree.get(edge.target) || 0;
    indegree.set(edge.target, currentIndegree + 1);
  });

  return indegree;
}

export function hasCycle(
  nodes: Map<string, WorkflowNode>,
  edges: Edge[]
): boolean {
  const indegree = buildIndegree(nodes, edges);
  const queue: string[] = [];
  const processed: string[] = [];

  indegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    processed.push(nodeId);

    const outgoingEdges = edges.filter((edge) => edge.source === nodeId);
    outgoingEdges.forEach((edge) => {
      const targetId = edge.target;
      const newIndegree = indegree.get(targetId)! - 1;
      indegree.set(targetId, newIndegree);

      if (newIndegree === 0) {
        queue.push(targetId);
      }
    });
  }

  return processed.length !== nodes.size;
}
