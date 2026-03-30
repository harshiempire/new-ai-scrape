import { create } from "zustand";
import type { WorkflowNode, WorkflowEdge } from "@/lib/workflow-types.ts";

interface WorkflowState {
	// Core workflow state
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];

	// UI state
	selectedNode: WorkflowNode | null;
	selectedNodes: WorkflowNode[];
	editingNode: WorkflowNode | null; // Node being edited in PropertyInspector
	activeTab: string;

	// Node actions
	setNodes: (nodes: WorkflowNode[]) => void;
	addNode: (node: WorkflowNode) => void;
	removeNode: (nodeId: string) => void;
	updateNode: (nodeId: string, updates: Partial<WorkflowNode["data"]>) => void;

	// Edge actions
	setEdges: (edges: WorkflowEdge[]) => void;
	addEdge: (edge: WorkflowEdge) => void;
	removeEdge: (edgeId: string) => void;

	// Selection actions
	setSelectedNode: (node: WorkflowNode | null) => void;
	setSelectedNodes: (nodes: WorkflowNode[]) => void;
	clearSelection: () => void;
	setEditingNode: (node: WorkflowNode | null) => void;

	// UI actions
	setActiveTab: (tab: string) => void;

	// Composite actions
	resetWorkflow: () => void;
	loadWorkflow: (nodes: WorkflowNode[], edges: WorkflowEdge[], preserveSelection?: boolean) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
	// Initial state
	nodes: [],
	edges: [],
	selectedNode: null,
	selectedNodes: [],
	editingNode: null,
	activeTab: "editor",

	// Node actions
	setNodes: (nodes) => set({ nodes }),

	addNode: (node) =>
		set((state) => ({
			nodes: [...state.nodes, node],
		})),

	removeNode: (nodeId) =>
		set((state) => ({
			nodes: state.nodes.filter((n) => n.id !== nodeId),
			// Also remove connected edges
			edges: state.edges.filter(
				(e) => e.source !== nodeId && e.target !== nodeId,
			),
			// Clear selection if removed node was selected
			selectedNode:
				state.selectedNode?.id === nodeId ? null : state.selectedNode,
			selectedNodes: state.selectedNodes.filter((n) => n.id !== nodeId),
		})),

	updateNode: (nodeId, updates) =>
		set((state) => {
			const updatedNodes = state.nodes.map((node) =>
				node.id === nodeId
					? { ...node, data: { ...node.data, ...updates } }
					: node,
			);

			// Also update selectedNode if it's the one being updated
			const updatedSelectedNode =
				state.selectedNode?.id === nodeId
					? updatedNodes.find((n) => n.id === nodeId) || null
					: state.selectedNode;

			return {
				nodes: updatedNodes,
				selectedNode: updatedSelectedNode,
			};
		}),

	// Edge actions
	setEdges: (edges) => set({ edges }),

	addEdge: (edge) =>
		set((state) => ({
			edges: [...state.edges, edge],
		})),

	removeEdge: (edgeId) =>
		set((state) => ({
			edges: state.edges.filter((e) => e.id !== edgeId),
		})),

	// Selection actions
	setSelectedNode: (node) =>
		set({
			selectedNode: node,
			selectedNodes: node ? [node] : [],
		}),

	setSelectedNodes: (nodes) =>
		set({
			selectedNodes: nodes,
			selectedNode: nodes.length === 1 ? nodes[0] : null,
		}),

	clearSelection: () =>
		set({
			selectedNode: null,
			selectedNodes: [],
		}),

	setEditingNode: (node) => set({ editingNode: node }),

	// UI actions
	setActiveTab: (tab) => set({ activeTab: tab }),

	// Composite actions
	resetWorkflow: () =>
		set({
			nodes: [],
			edges: [],
			selectedNode: null,
			selectedNodes: [],
		}),

	loadWorkflow: (nodes, edges, preserveSelection = false) =>
		set({
			nodes,
			edges,
			...(preserveSelection
				? {}
				: { selectedNode: null, selectedNodes: [] }),
		}),
}));
