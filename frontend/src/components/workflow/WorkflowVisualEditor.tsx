import {
  addEdge,
  Background,
  BackgroundVariant,
  type Connection,
  Controls,
  MiniMap,
  type OnConnect,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import { type DragEvent, useCallback, useEffect, useState } from "react";
import "@xyflow/react/dist/style.css";

import { generateEdgeId, generateNodeId } from "@/lib/workflow-transformer";
import type {
  NodeType,
  WorkflowEdge,
  WorkflowNode,
} from "@/lib/workflow-types";
import { nodeTypes } from "./nodes";

interface WorkflowVisualEditorProps {
  initialNodes: WorkflowNode[];
  initialEdges: WorkflowEdge[];
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  onEdgesChange?: (edges: WorkflowEdge[]) => void;
  onNodeSelection?: (selectedNodes: WorkflowNode[]) => void;
}

export function WorkflowVisualEditor({
  initialNodes,
  initialEdges,
  onNodesChange,
  onEdgesChange,
  onNodeSelection,
}: WorkflowVisualEditorProps) {
  console.log("initialEdges", initialEdges);
  console.log("initialNodes", initialNodes);
  const [nodes, setNodes, onInternalNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onInternalEdgesChange] = useEdgesState(initialEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  useEffect(() => {
    console.log("edges", edges);
  }, [edges]);
  useEffect(() => {
    console.log("node", nodes);
  }, [nodes]);

  // Notify parent of changes
  const handleNodesChange = useCallback(
    (changes: any) => {
      onInternalNodesChange(changes);
      if (onNodesChange) {
        // Wait for next tick to get updated nodes
        setTimeout(() => {
          setNodes((currentNodes) => {
            onNodesChange(currentNodes);
            return currentNodes;
          });
        }, 0);
      }
    },
    [onInternalNodesChange, onNodesChange, setNodes]
  );

  const handleEdgesChange = useCallback(
    (changes: any) => {
      onInternalEdgesChange(changes);
      if (onEdgesChange) {
        setTimeout(() => {
          setEdges((currentEdges) => {
            onEdgesChange(currentEdges);
            return currentEdges;
          });
        }, 0);
      }
    },
    [onInternalEdgesChange, onEdgesChange, setEdges]
  );

  // Handle new connections
  const handleConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: generateEdgeId(connection.source!, connection.target!),
        type: "smoothstep",
        animated: true,
      };

      setEdges((eds) => addEdge(newEdge as WorkflowEdge, eds));

      if (onEdgesChange) {
        setTimeout(() => {
          setEdges((currentEdges) => {
            onEdgesChange(currentEdges);
            return currentEdges;
          });
        }, 0);
      }
    },
    [setEdges, onEdgesChange]
  );

  // Handle drag over (for dropping nodes)
  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Handle drop (create new node)
  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData(
        "application/reactflow"
      ) as NodeType;
      if (!type) return;

      const position = reactFlowInstance?.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (!position) return;

      const newNode: WorkflowNode = {
        id: generateNodeId(type),
        type,
        position,
        data: {
          label: `${type.charAt(0).toUpperCase() + type.slice(1)} Node`,
          props: type === "api" ? { method: "GET", url: "" } : {},
        },
      };

      setNodes((nds) => nds.concat(newNode));

      if (onNodesChange) {
        setTimeout(() => {
          setNodes((currentNodes) => {
            onNodesChange(currentNodes);
            return currentNodes;
          });
        }, 0);
      }
    },
    [reactFlowInstance, setNodes, onNodesChange]
  );

  // Handle selection change
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: WorkflowNode[] }) => {
      if (onNodeSelection) {
        onNodeSelection(selectedNodes);
      }
    },
    [onNodeSelection]
  );

  return (
    <div className="w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={handleConnect}
        onInit={setReactFlowInstance}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        selectionKeyCode="meta"
        multiSelectionKeyCode="meta"
        deleteKeyCode="Delete"
        className="bg-gray-50"
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
        <MiniMap
          nodeColor={(node) => {
            switch (node.type) {
              case "start":
                return "#86efac";
              case "api":
                return "#93c5fd";
              case "wait":
                return "#d8b4fe";
              case "end":
                return "#fca5a5";
              default:
                return "#e5e7eb";
            }
          }}
          className="bg-white border-2 border-gray-200 rounded"
        />
      </ReactFlow>
    </div>
  );
}
