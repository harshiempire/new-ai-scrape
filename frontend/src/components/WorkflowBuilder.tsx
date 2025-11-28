import { ReactFlow, Background, Controls, MiniMap } from "@xyflow/react";
import useWorkflow from "@/hooks/useWorkflow";

export default function WorkflowBuilder({ initialNodes, initialEdges }) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect } = useWorkflow(
    { initialNodes, initialEdges }
  );
  const nodeColor = (node) => {
    switch (node.type) {
      case "input":
        return "#6ede87";
      case "output":
        return "#6865A5";
      default:
        return "#ff0072";
    }
  };
  console.log(nodes, edges);

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <MiniMap nodeColor={nodeColor} nodeStrokeWidth={3} zoomable pannable />
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
