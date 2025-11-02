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
