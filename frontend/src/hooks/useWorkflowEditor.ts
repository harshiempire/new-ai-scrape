import { useCallback, useEffect, useState } from "react";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { api } from "@/api";
import type { WorkflowNode, WorkflowEdge } from "@/lib/workflow-types";
import { useWorkflowStore } from "@/store/useWorkflowStore.ts";
import { useUndoRedo } from "./useUndoRedo";
import { useWorkflowSave } from "./useWorkflowSave";
import { toBackendWorkflow } from "@/lib/workflow-transformer";
import type { WorkflowExecution } from "@/lib/types";
import { executionDataQueryOptions, executionsQueryOptions } from "@/query";

interface UseWorkflowEditorOptions {
  workflowId: string;
}

/**
 * Comprehensive hook for workflow editor functionality
 * Consolidates all workflow state management, operations, and side effects
 *
 * This hook combines:
 * - Zustand store for global state
 * - Undo/redo functionality
 * - Auto-save functionality
 * - Server mutations (save, execute)
 * - Execution queries
 *
 * @param options - Configuration options including workflowId
 * @returns Complete workflow editor interface
 */
export function useWorkflowEditor({ workflowId }: UseWorkflowEditorOptions) {
  const queryClient = useQueryClient();

  // Global state from Zustand
  const {
    nodes,
    edges,
    setNodes,
    setEdges,
    selectedNode,
    setSelectedNode,
    updateNode,
    activeTab,
    setActiveTab,
    loadWorkflow,
  } = useWorkflowStore();

  // Local UI state (execution selection)
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecution>();

  // Save workflow mutation
  const saveWorkflowMutation = useMutation({
    mutationFn: async (data: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    }) => {
      const backendWorkflow = toBackendWorkflow(data.nodes, data.edges);
      await api.patch(`/workflows/${workflowId}`, backendWorkflow);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
    },
  });

  // Execute workflow mutation
  const executeWorkflowMutation = useMutation({
    mutationFn: async (initialInputs: Record<string, any>) => {
      const response = await api.post(`/workflows/${workflowId}/run`, {
        initialInputs,
      });
      return response.data;
    },
    onSuccess: () => {
      setActiveTab("executions");
      queryClient.invalidateQueries({ queryKey: ["executions", workflowId] });
    },
    onError: (error) => {
      console.error("Failed to execute workflow:", error);
      alert("Failed to execute workflow. Check console for details.");
    },
  });
  // Undo/Redo hook
  const { saveState, undo, redo, canUndo, canRedo } = useUndoRedo({
    maxHistorySize: 50,
    onStateChange: (nodes, edges) => {
      setNodes(nodes);
      setEdges(edges);
    },
  });

  // Auto-save hook
  const {
    autoSaveEnabled,
    toggleAutoSave,
    hasUnsavedChanges,
    isSaving,
    triggerChange,
    handleManualSave,
  } = useWorkflowSave({
    workflowId,
    onSave: async (nodes, edges) => {
      await saveWorkflowMutation.mutateAsync({ nodes, edges });
    },
  });

  // Handle node changes
  const handleNodesChange = useCallback(
    (updatedNodes: WorkflowNode[]) => {
      setNodes(updatedNodes);
      saveState(updatedNodes, edges);
      triggerChange(updatedNodes, edges);
    },
    [edges, saveState, triggerChange, setNodes],
  );

  // Handle edge changes
  const handleEdgesChange = useCallback(
    (updatedEdges: WorkflowEdge[]) => {
      setEdges(updatedEdges);
      saveState(nodes, updatedEdges);
      triggerChange(nodes, updatedEdges);
    },
    [nodes, saveState, triggerChange, setEdges],
  );

  // Handle node selection
  const handleNodeSelection = useCallback(
    (selectedNodes: WorkflowNode[]) => {
      setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
    },
    [setSelectedNode],
  );

  // Handle node property updates
  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: Partial<WorkflowNode["data"]>) => {
      // Compute updated nodes before updating store
      const updatedNodes = nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node,
      );
      updateNode(nodeId, updates);
      saveState(updatedNodes, edges);
      triggerChange(updatedNodes, edges);
    },
    [nodes, edges, saveState, triggerChange, updateNode],
  );

  // Handle layout
  const handleLayout = useCallback(
    (layoutedNodes: WorkflowNode[], layoutedEdges: WorkflowEdge[]) => {
      setNodes(layoutedNodes);
      setEdges(layoutedEdges);
      saveState(layoutedNodes, layoutedEdges);
      triggerChange(layoutedNodes, layoutedEdges);
    },
    [saveState, triggerChange, setNodes, setEdges],
  );

  // Execute workflow
  const handleExecuteWorkflow = useCallback(
    (initialInputs: Record<string, any>) => {
      executeWorkflowMutation.mutate(initialInputs);
    },
    [executeWorkflowMutation],
  );

  // Executions query (only load when on executions tab)
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    ...executionsQueryOptions(workflowId),
    enabled: activeTab === "executions",
  });

  // Execution data query
  const { data: executionData, isLoading: isLoadingExecutionData } = useQuery(
    executionDataQueryOptions(selectedExecution?.id || ""),
  );

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key === "z") {
        e.preventDefault();
        undo();
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "z") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  return {
    // State
    nodes,
    edges,
    selectedNode,
    activeTab,
    selectedExecution,
    executions,
    executionData,

    // Node/Edge operations
    handleNodesChange,
    handleEdgesChange,
    handleNodeSelection,
    handleNodeUpdate,
    handleLayout,

    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,

    // Save operations
    autoSaveEnabled,
    toggleAutoSave,
    hasUnsavedChanges,
    isSaving: isSaving || saveWorkflowMutation.isPending,
    handleManualSave,

    // Workflow execution
    handleExecuteWorkflow,
    isExecuting: executeWorkflowMutation.isPending,

    // UI state
    setActiveTab,
    setSelectedExecution,

    // Loading states
    isLoadingExecutions,
    isLoadingExecutionData,

    // Utilities
    loadWorkflow,
  };
}
