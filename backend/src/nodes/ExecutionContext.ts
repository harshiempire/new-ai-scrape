import { Node } from "./Node";
import { Edge } from "../lib/types";

/**
 * ExecutionContext - Central state container for workflow execution
 *
 * This class maintains all runtime state during workflow execution:
 *
 * 1. variablePool (in-memory, mirrors DB)
 *    - Used for fast local lookups during execution
 *    - The canonical store is in ExecutionData.variablePool in the DB,
 *      written by each node via sendOutput()
 *
 * 2. edges: Complete list of workflow edges
 *    - Used by nodes to find their incoming/outgoing connections
 *
 * 3. initialInputs: Starting data provided by workflow runner
 *    - Injected by StartNode into the variable pool
 *
 * 4. currentNodeId: ID of the currently executing node
 *
 * 5. activeEdges: Set of edge IDs to activate (for conditional nodes)
 *    - Empty for normal nodes (activate all outgoing edges)
 *    - Populated by IF-ELSE/SWITCH nodes to select specific branches
 */
export class ExecutionContext {
  variablePool: Map<string, any>;
  edges: Edge[];
  initialInputs: any;
  currentNodeId: string;
  activeEdges: Set<string>;
  nodes?: Map<string, Node>;
  executionDataId?: string;

  constructor(
    edges: Edge[],
    initialInputs: any,
    nodes: Map<string, Node>,
    executionDataId: string,
  ) {
    this.variablePool = new Map();
    this.edges = edges;
    this.initialInputs = initialInputs;
    this.currentNodeId = "";
    this.activeEdges = new Set();
    this.nodes = nodes;
    this.executionDataId = executionDataId;
  }
}
