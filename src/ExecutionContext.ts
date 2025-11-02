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
