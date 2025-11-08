import express from "express";

const app = express();

app.use(express.json());
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { getNodeInputs } from "./utils";
import z from "zod";
import Mustache from "mustache";

/**
 * APINode - Makes HTTP requests with full configurability
 *
 * Features:
 * - Supports all HTTP methods (GET, POST, PUT, PATCH, DELETE)
 * - Dynamic URL templating using Mustache with edge-scoped variables
 * - Headers support (static from props, dynamic from inputs)
 * - Body support for POST/PUT/PATCH
 * - Automatic JSON serialization
 * - Error handling with detailed logging
 *
 * Props configuration:
 * - method: HTTP method (default: "GET")
 * - url: URL template with Mustache syntax (e.g., "https://api.com?city={{e1.city}}")
 * - headers: Static headers object
 * - body: Static request body (for POST/PUT/PATCH)
 *
 * Input expectations:
 * - url: Direct URL string (if props.url not provided)
 * - headers: Additional headers to merge
 * - body: Request body data
 */
export class APINode extends Node {
  name = "APINode";

  constructor({
    id,
    label,
    props,
  }: {
    id: string;
    label: string;
    props?: Record<string, any>;
  }) {
    super({ id, label, type: "api", props });
    this.description = "Makes HTTP API calls";

    // Default output schema for API responses
    this.outputSchema = z
      .object({
        status: z.number().optional(),
        data: z.any(),
      })
      .passthrough(); // Allow additional fields
  }

  async execute(context: ExecutionContext): Promise<void> {
    console.log(`\n[APINode ${this.label}] Starting execution`);

    const inputs = getNodeInputs(context, this.id); // Now validates automatically!

    const templateModel: Record<string, any> = {};
    inputs.forEach((data, edgeId) => {
      templateModel[edgeId] = data;
    });

    const method = (this.props.method || "GET").toUpperCase();
    let url: string | undefined = this.props.url;

    if (url) {
      url = Mustache.render(url, templateModel);
    } else if (inputs.size === 1) {
      const singleInput = inputs.values().next().value;
      url = singleInput?.url;
    }

    if (!url) {
      throw new Error(`APINode [${this.label}] requires a URL`);
    }

    let headers: Record<string, string> = { ...(this.props.headers || {}) };
    inputs.forEach((data) => {
      if (data.headers) {
        headers = { ...headers, ...data.headers };
      }
    });

    let body: any = null;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      body = this.props.body || null;
      if (!body) {
        for (const data of inputs.values()) {
          if (data.body) {
            body = data.body;
            break;
          }
        }
      }
      if (body && typeof body === "object") {
        if (!headers["Content-Type"]) {
          headers["Content-Type"] = "application/json";
        }
        body = JSON.stringify(body);
      }
    }

    let responseData: any;
    try {
      console.log(`[APINode ${this.label}] Calling ${method} ${url}`);
      const response = await fetch(url, {
        method,
        headers,
        body: body || undefined,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get("Content-Type") || "";
      const rawData = contentType.includes("application/json")
        ? await response.json()
        : await response.text();

      // Wrap response in standard format
      responseData = {
        status: response.status,
        data: rawData,
      };

      console.log(`[APINode ${this.label}] Response received`);
    } catch (error) {
      console.error(`[APINode ${this.label}] Error:`, error);
      throw error;
    }

    this.sendOutput(responseData, context); // Validates before sending!
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      props: this.props,
    };
  }
}
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { getNodeInputs } from "./utils";

export class EndNode extends Node {
  name = "EndNode";

  constructor({ id, label }: { id: string; label: string }) {
    super({ id, label, type: "end" });
    this.description = "Marks the end of workflow execution";
  }

  execute(context: ExecutionContext): void {
    const inputs = getNodeInputs(context, this.id);
    console.log(
      `[EndNode ${this.label}] Workflow completed with inputs:`,
      Object.fromEntries(inputs)
    );
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      props: this.props,
    };
  }
}
import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
  nodes: [
    {
      id: "start-1",
      type: "start",
      label: "Start",
      outputSchema: {
        latitude: "number",
        longitude: "number",
        city: "string",
      },
    },
    {
      id: "api-2",
      type: "api",
      label: "Fetch Weather",
      props: {
        method: "GET",
        url: "https://api.open-meteo.com/v1/forecast?latitude={{e1.latitude}}&longitude={{e1.longitude}}&current_weather=true",
      },
      outputSchema: {
        status: "number",
        data: "any",
      },
    },
    {
      id: "end-3",
      type: "end",
      label: "End",
    },
  ],
  edges: [
    { id: "e1", source: "start-1", target: "api-2" },
    { id: "e2", source: "api-2", target: "end-3" },
  ],
};

const initialInputs = {
  latitude: 52.52,
  longitude: 13.41,
  city: "Berlin",
};

const executor = new WorkflowExecutor();
executor.execute(workflow, initialInputs).catch(console.error);
import { Node } from "./Node";
import { Edge } from "./types";

/**
 * ExecutionContext - Central state container for workflow execution
 *
 * This class maintains all runtime state during workflow execution:
 *
 * 1. variablePool: Map<edgeId, data>
 *    - THE CORE DATA STORAGE for inter-node communication
 *    - Key: Edge ID (e.g., "e1", "e2")
 *    - Value: Data flowing through that edge
 *    - Why edge-based? Allows multiple outputs per node without conflicts
 *    - Example: After StartNode executes:
 *      variablePool.set("e1", {city: "Berlin", temp: 25})
 *      variablePool.set("e2", {city: "Berlin", temp: 25})
 *
 * 2. edges: Complete list of workflow edges
 *    - Used by nodes to find their incoming/outgoing connections
 *    - Used by sendOutput to write data to correct edges
 *
 * 3. initialInputs: Starting data provided by workflow runner
 *    - Injected by StartNode into variablePool
 *
 * 4. currentNodeId: ID of currently executing node
 *    - Used for debugging and logging
 *
 * 5. activeEdges: Set of edge IDs to activate (for conditional nodes)
 *    - Empty for normal nodes (activate all outgoing edges)
 *    - Populated by IF-ELSE/SWITCH nodes to select specific branches
 */
export class ExecutionContext {
  // ===== THE VARIABLE POOL - Where all data lives =====
  // This is keyed by EDGE ID, not node ID!
  // Example state after StartNode → APINode execution:
  // variablePool = Map {
  //   "e1" => { city: "Berlin", latitude: 52.52 },
  //   "e2" => { temperature: 25, weather: "sunny" }
  // }
  variablePool: Map<string, any>;

  // All edges in the workflow
  edges: Edge[];

  // Initial inputs injected by StartNode
  initialInputs: any;

  // Currently executing node (for debugging)
  currentNodeId: string;

  // For conditional routing (IF-ELSE, SWITCH)
  activeEdges: Set<string>;

  nodes?: Map<string, Node>; // Add reference to nodes for validation

  constructor(edges: Edge[], initialInputs: any, nodes: Map<string, Node>) {
    this.variablePool = new Map(); // EMPTY at start, populated during execution
    this.edges = edges;
    this.initialInputs = initialInputs;
    this.currentNodeId = "";
    this.activeEdges = new Set();
    this.nodes = nodes;
  }

  /**
   * Debug helper: Print current variablePool state
   */
  printVariablePool(): void {
    console.log("\n=== VariablePool State ===");
    this.variablePool.forEach((data, edgeId) => {
      console.log(`Edge ${edgeId}:`, data);
    });
    console.log("========================\n");
  }
}
import { ExecutionContext } from "./ExecutionContext";
import { Edge } from "./types";
import { z } from "zod";

export abstract class Node {
  id: string;
  label: string;
  type: string;
  description: string;
  props: Record<string, any>;
  inputSchema: Map<string, z.ZodTypeAny>;
  outputSchema: z.ZodTypeAny;

  constructor({
    id,
    label,
    type,
    props,
  }: {
    id: string;
    label: string;
    type: string;
    props?: Record<string, any>;
  }) {
    this.id = id;
    this.label = label;
    this.type = type;
    this.description = "";
    this.props = props || {};
    this.inputSchema = new Map();
    this.outputSchema = z.any();
  }

  abstract execute(context: ExecutionContext): Promise<void> | void;

  abstract toJSON(): Record<string, any>;

  // protected sendOutput(
  //   output: any,
  //   context: ExecutionContext,
  //   edgeFilter?: (edge: Edge) => boolean
  // ): void {
  //   const outgoingEdges = context.edges.filter(
  //     (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
  //   );

  //   outgoingEdges.forEach((edge) => {
  //     context.variablePool.set(edge.id, output);
  //     console.log(`Node [${this.label}] pushed data to edge ${edge.id}`);
  //   });
  // }

  /**
   * Validate input data against the schema for a specific edge
   * Made public so utils can call it
   */
  public validateInput(edgeId: string, data: any): any {
    const schema = this.inputSchema.get(edgeId);

    if (!schema) {
      // No schema defined, skip validation
      return data;
    }

    try {
      const validated = schema.parse(data);
      console.log(
        `[${this.label}] ✓ Input validation passed for edge ${edgeId}`
      );
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Input validation failed for edge ${edgeId}:`,
          error.issues
        );
        throw new Error(
          `Input validation failed for ${
            this.label
          } on edge ${edgeId}: ${JSON.stringify(error.issues)}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate output data before writing to VariablePool
   */
  protected validateOutput(data: any): any {
    // If no specific schema, return as-is
    if (this.outputSchema === z.any() || !this.outputSchema) {
      return data;
    }

    try {
      const validated = this.outputSchema.parse(data);
      console.log(`[${this.label}] ✓ Output validation passed`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Output validation failed:`,
          error.issues
        );
        throw new Error(
          `Output validation failed for ${this.label}: ${JSON.stringify(
            error.issues
          )}`
        );
      }
      throw error;
    }
  }

  protected sendOutput(
    output: any,
    context: ExecutionContext,
    edgeFilter?: (edge: Edge) => boolean
  ): void {
    // Validate output before sending
    const validatedOutput = this.validateOutput(output);

    const outgoingEdges = context.edges.filter(
      (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
    );

    outgoingEdges.forEach((edge) => {
      context.variablePool.set(edge.id, validatedOutput);
      console.log(
        `Node [${this.label}] pushed validated data to edge ${edge.id}`
      );
    });
  }

  /**
   * Set input schema for a specific edge
   */
  setInputSchemaForEdge(edgeId: string, schema: z.ZodTypeAny): void {
    this.inputSchema.set(edgeId, schema);
    console.log(`[${this.label}] Registered input schema for edge ${edgeId}`);
  }

  /**
   * Set output schema
   */
  setOutputSchema(schema: z.ZodTypeAny): void {
    this.outputSchema = schema;
    console.log(`[${this.label}] Registered output schema`);
  }
}
import { Node } from "./Node";
import { StartNode } from "./StartNode";
import { APINode } from "./APINode";
import { EndNode } from "./EndNode";
import { NodeDefinition } from "./types";

export class NodeFactory {
  static createNode(nodeDef: NodeDefinition): Node {
    switch (nodeDef.type) {
      case "start":
        return new StartNode({ id: nodeDef.id, label: nodeDef.label });

      case "api":
        return new APINode({
          id: nodeDef.id,
          label: nodeDef.label,
          props: nodeDef.props,
        });

      case "end":
        return new EndNode({ id: nodeDef.id, label: nodeDef.label });

      default:
        throw new Error(`Unknown node type: ${nodeDef.type}`);
    }
  }
}
import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";

export class StartNode extends Node {
  name = "StartNode";

  constructor({ id, label }: { id: string; label: string }) {
    super({ id, label, type: "start" });
    this.description = "Starts workflow execution by injecting initial inputs";

    // StartNode accepts any input, outputs whatever it receives
    this.outputSchema = z.any();
  }

  execute(context: ExecutionContext): void {
    console.log(
      `[StartNode ${this.label}] Injecting initial inputs:`,
      context.initialInputs
    );
    this.sendOutput(context.initialInputs, context);
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      props: this.props,
    };
  }
}
import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
  nodes: [
    {
      id: "start-1",
      type: "start",
      label: "Start",
      outputSchema: {
        userId: "number", // Expects number
      },
    },
    {
      id: "api-2",
      type: "api",
      label: "Get User",
      props: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/users/{{e1.userId}}",
      },
    },
    { id: "end-3", type: "end", label: "End" },
  ],
  edges: [
    { id: "e1", source: "start-1", target: "api-2" },
    { id: "e2", source: "api-2", target: "end-3" },
  ],
};

// INVALID: passing string instead of number
const initialInputs = {
  userId: "not-a-number", // ❌ Should fail validation
};

const executor = new WorkflowExecutor();
executor.execute(workflow, initialInputs).catch((error) => {
  console.error("Expected validation error:", error.message);
});
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
import { ExecutionContext } from "./ExecutionContext";
import { Node as WorkflowNode } from "./Node";
import { Edge, Indegree } from "./types";
import { z } from "zod";

/**
 * Get inputs for a node from the VariablePool WITHOUT direct validation
 * (validation happens inside node.execute when it processes inputs)
 */
export function getNodeInputs(
  context: ExecutionContext,
  nodeId: string
): Map<string, any> {
  const incomingEdges = context.edges.filter((edge) => edge.target === nodeId);
  const inputs = new Map<string, any>();

  incomingEdges.forEach((edge) => {
    const data = context.variablePool.get(edge.id);
    if (data !== undefined) {
      inputs.set(edge.id, data);
    }
  });

  return inputs;
}

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
import { ExecutionContext } from "./ExecutionContext";
import { Node } from "./Node";
import { NodeFactory } from "./NodeFactory";
import { WorkflowDefinition } from "./types";
import { buildIndegree, hasCycle, parseSchemaDefinition } from "./utils";

export class WorkflowExecutor {
  async execute(
    workflow: WorkflowDefinition,
    initialInputs: any
  ): Promise<void> {
    console.log("=== Workflow Execution Started ===");
    console.log("Initial Inputs:", initialInputs);

    // Initialize nodes
    const nodes = new Map<string, Node>();
    workflow.nodes.forEach((nodeDef) => {
      const node = NodeFactory.createNode(nodeDef);

      // Set output schema if provided in workflow definition
      if (nodeDef.outputSchema) {
        const schema = parseSchemaDefinition(nodeDef.outputSchema);
        node.setOutputSchema(schema);
      }

      nodes.set(node.id, node);
    });

    // Populate input schemas from connected source nodes
    workflow.edges.forEach((edge) => {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (sourceNode && targetNode) {
        // Target node's input schema for this edge = source node's output schema
        targetNode.setInputSchemaForEdge(edge.id, sourceNode.outputSchema);
      }
    });

    // Check for cycles
    if (hasCycle(nodes, workflow.edges)) {
      throw new Error("Workflow contains cycles! DAG validation failed.");
    }

    const indegree = buildIndegree(nodes, workflow.edges);
    const context = new ExecutionContext(workflow.edges, initialInputs, nodes);

    const queue: string[] = [];
    indegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    if (queue.length === 0) {
      throw new Error("No starting nodes found");
    }

    // Execute workflow
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodes.get(nodeId)!;

      console.log(`\n--- Executing Node: ${node.label} (${node.type}) ---`);
      context.currentNodeId = nodeId;

      try {
        await node.execute(context);
      } catch (error) {
        console.error(`Error executing node ${node.label}:`, error);
        throw error;
      }

      const outgoingEdges = workflow.edges.filter(
        (edge) => edge.source === nodeId
      );

      if (context.activeEdges.size > 0) {
        context.activeEdges.forEach((edgeId) => {
          const edge = outgoingEdges.find((e) => e.id === edgeId);
          if (edge) {
            const targetId = edge.target;
            const newIndegree = indegree.get(targetId)! - 1;
            indegree.set(targetId, newIndegree);
            if (newIndegree === 0) {
              queue.push(targetId);
            }
          }
        });
        context.activeEdges.clear();
      } else {
        outgoingEdges.forEach((edge) => {
          const targetId = edge.target;
          const newIndegree = indegree.get(targetId)! - 1;
          indegree.set(targetId, newIndegree);
          if (newIndegree === 0) {
            queue.push(targetId);
          }
        });
      }
    }

    console.log("\n=== Workflow Execution Completed ===");
    context.printVariablePool();
  }
}
