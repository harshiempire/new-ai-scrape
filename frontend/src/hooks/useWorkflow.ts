import { applyNodeChanges, applyEdgeChanges, addEdge } from "@xyflow/react";
import { useState, useCallback } from "react";
import "@xyflow/react/dist/style.css";

export default function useWorkflow({ initialNodes, initialEdges }) {
  const toReactFlowNodes = (nodes) => {
    return nodes.map((node, index) => ({
      id: node.id,
      position: node.props?.position ?? { x: index * 200, y: index * 150 },
      data: { label: node.label },
    }));
  };
  const [nodes, setNodes] = useState(toReactFlowNodes(initialNodes));
  const [edges, setEdges] = useState(initialEdges);

  const onNodesChange = useCallback(
    (changes) =>
      setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    []
  );
  const onEdgesChange = useCallback(
    (changes) =>
      setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    []
  );
  const onConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    []
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
  };
}
