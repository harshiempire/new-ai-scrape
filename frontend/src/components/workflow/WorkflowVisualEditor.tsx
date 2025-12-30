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
import { useWorkflowStore } from "@/store/useWorkflowStore.ts";
import type {
  NodeType,
  WorkflowEdge,
  WorkflowNode,
} from "@/lib/workflow-types";
import { nodeTypes } from "./nodes";

interface WorkflowVisualEditorProps {
  onNodesChange?: (nodes: WorkflowNode[]) => void;
  onEdgesChange?: (edges: WorkflowEdge[]) => void;
  onNodeSelection?: (selectedNodes: WorkflowNode[]) => void;
}

export function WorkflowVisualEditor({
  onNodesChange,
  onEdgesChange,
  onNodeSelection,
}: WorkflowVisualEditorProps) {
  // Read from store
  const storeNodes = useWorkflowStore((state) => state.nodes);
  const storeEdges = useWorkflowStore((state) => state.edges);
  const addNode = useWorkflowStore((state) => state.addNode);
  const setSelectedNodes = useWorkflowStore((state) => state.setSelectedNodes);

  // ReactFlow internal state (synced with store)
  const [nodes, setNodes, onInternalNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onInternalEdgesChange] = useEdgesState(storeEdges);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

  // Sync store changes to ReactFlow
  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  // Handle node changes - NO MORE setTimeout!
  const handleNodesChange = useCallback(
    (changes: any) => {
      onInternalNodesChange(changes);
      // Get updated nodes after ReactFlow processes changes
      setNodes((currentNodes) => {
        if (onNodesChange) {
          onNodesChange(currentNodes);
        }
        return currentNodes;
      });
    },
    [onInternalNodesChange, onNodesChange, setNodes]
  );

  // Handle edge changes - NO MORE setTimeout!
  const handleEdgesChange = useCallback(
    (changes: any) => {
      onInternalEdgesChange(changes);
      // Get updated edges after ReactFlow processes changes
      setEdges((currentEdges) => {
        if (onEdgesChange) {
          onEdgesChange(currentEdges);
        }
        return currentEdges;
      });
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

      setEdges((eds) => {
        const updatedEdges = addEdge(newEdge as WorkflowEdge, eds);
        if (onEdgesChange) {
          onEdgesChange(updatedEdges);
        }
        return updatedEdges;
      });
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

      // Add to store directly
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  // Get current selected node from store
  const selectedNode = useWorkflowStore((state) => state.selectedNode);

  // Handle selection change
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: WorkflowNode[] }) => {
      // If ReactFlow reports empty selection but our selected node still exists,
      // don't clear the selection - this is a spurious event from node data updates
      if (selectedNodes.length === 0 && selectedNode) {
        const nodeStillExists = storeNodes.some(n => n.id === selectedNode.id);
        if (nodeStillExists) {
          return; // Don't clear selection
        }
      }

      setSelectedNodes(selectedNodes);
      if (onNodeSelection) {
        onNodeSelection(selectedNodes);
      }
    },
    [setSelectedNodes, onNodeSelection, selectedNode, storeNodes]
  );

  // Get setEditingNode from store for double-click handling
  const setEditingNode = useWorkflowStore((state) => state.setEditingNode);

  // Handle double-click on node to open PropertyInspector
  const handleNodeDoubleClick = useCallback(
    (_event: React.MouseEvent, node: WorkflowNode) => {
      setEditingNode(node);
    },
    [setEditingNode]
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
        onNodeDoubleClick={handleNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        selectionKeyCode="meta"
        multiSelectionKeyCode="meta"
        deleteKeyCode={["Delete", "Backspace"]}
        className="bg-gray-50 dark:bg-slate-900"
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
          className="bg-white dark:bg-slate-900 border-2 border-border rounded"
        />
      </ReactFlow>
    </div>
  );
}
