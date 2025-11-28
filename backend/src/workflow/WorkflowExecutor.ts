import { WorkflowDefinition } from "../lib/types";
import { ExecutionContext } from "../nodes/ExecutionContext";
import { NodeFactory } from "../nodes/NodeFactory";
import { Node } from "../nodes/Node";
import { parseSchemaDefinition, hasCycle, buildIndegree } from "../nodes/utils";

export class WorkflowExecutor {
  workflow: WorkflowDefinition;
  initialInputs: any;
  executionDataId: string;

  constructor(
    workflow: WorkflowDefinition,
    initialInputs: any,
    executionDataId: string
  ) {
    this.workflow = workflow;
    this.initialInputs = initialInputs;
    this.executionDataId = executionDataId;
  }

  async execute(): Promise<void> {
    console.log("\n📋 ========= WORKFLOW EXECUTION STARTED =========");
    console.log(
      "\n📥 Initial Inputs:",
      JSON.stringify(this.initialInputs, null, 2)
    );

    // Initialize nodes
    const nodes = new Map<string, Node>();
    this.workflow.nodes.forEach((nodeDef) => {
      // Parse schema from this.workflow and pass into factory so node can initialize with it
      let schema;
      if (nodeDef.outputSchema) {
        schema = parseSchemaDefinition(nodeDef.outputSchema);
      }

      const node = NodeFactory.createNode(nodeDef, schema);
      nodes.set(node.id, node);
    });

    // Populate input schemas from connected source nodes
    this.workflow.edges.forEach((edge) => {
      const sourceNode = nodes.get(edge.source);
      const targetNode = nodes.get(edge.target);

      if (sourceNode && targetNode) {
        // Target node's input schema for this edge = source node's output schema
        targetNode.setInputSchemaForEdge(edge.id, sourceNode.outputSchema);
      }
    });

    // Check for cycles
    if (hasCycle(nodes, this.workflow.edges)) {
      throw new Error("Workflow contains cycles! DAG validation failed.");
    }

    const indegree = buildIndegree(nodes, this.workflow.edges);
    const context = new ExecutionContext(
      this.workflow.edges,
      this.initialInputs,
      nodes,
      this.executionDataId
    );

    const queue: string[] = [];
    indegree.forEach((degree, nodeId) => {
      if (degree === 0) {
        queue.push(nodeId);
      }
    });

    if (queue.length === 0) {
      throw new Error("No starting nodes found");
    }

    // Execute this.workflow
    while (queue.length > 0) {
      const nodeId = queue.shift();
      const node = nodes.get(nodeId);

      console.log(`\n--- Executing Node: ${node.label} (${node.type}) ---`);
      context.currentNodeId = nodeId;

      try {
        console.log(`\n🔄 Executing Node: ${node.label} (${node.type})`);
        console.log("━".repeat(50));
        await node.execute(context);
        console.log(`✅ Node ${node.label} executed successfully`);
      } catch (error) {
        console.error(`\n❌ Error executing node ${node.label}:`);
        console.error("━".repeat(50));
        if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);
          console.error(`Stack trace:\n${error.stack}`);
        } else {
          console.error("Unknown error:", error);
        }
        throw {
          executionDataId: this.executionDataId,
          nodeId: nodeId,
          message: error instanceof Error ? error.message : "Unknown error",
          stack: error instanceof Error ? error.stack : undefined,
        };
      }

      const outgoingEdges = this.workflow.edges.filter(
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
    await context.printVariablePool(this.executionDataId);
  }
}
