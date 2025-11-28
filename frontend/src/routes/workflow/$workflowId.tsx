import {
	useMutation,
	useQuery,
	useQueryClient,
	useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWorkflowSave } from "@/hooks/useWorkflowSave";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import type { WorkflowExecution } from "@/lib/types";
import type {
	WorkflowEdge,
	WorkflowNode,
} from "@/lib/workflow-types";
import {
	toBackendWorkflow,
	toReactFlowEdges,
	toReactFlowNodes,
} from "@/lib/workflow-transformer";
import {
	executionDataQueryOptions,
	executionsQueryOptions,
	workflowQueryOptions,
} from "@/query";
import { ExecutionDetails } from "../../components/ExecutionDetails";
import { ExecutionsList } from "../../components/ExecutionsList";
import { WorkflowDetails } from "../../components/WorkflowDetails";
import { EditorToolbar } from "../../components/workflow/EditorToolbar";
import { LayoutControls } from "../../components/workflow/LayoutControls";
import { NodePalette } from "../../components/workflow/NodePalette";
import { ValidationPanel } from "../../components/workflow/ValidationPanel";
import { WorkflowVisualEditor } from "../../components/workflow/WorkflowVisualEditor";
import { PropertyInspector } from "../../components/workflow/PropertyInspector";
import { UndoRedoControls } from "../../components/workflow/UndoRedoControls";

export const Route = createFileRoute("/workflow/$workflowId")({
	loader: ({ context: { queryClient }, params: { workflowId } }) => {
		return [queryClient.ensureQueryData(workflowQueryOptions(workflowId))];
	},
	component: WorkflowDisplay,
});

function WorkflowDisplay() {
	const { workflowId } = Route.useParams();
	const queryClient = useQueryClient();

	const [activeTab, setActiveTab] = useState("editor");
	const [selectedExecution, setSelectedExecution] =
		useState<WorkflowExecution>();
	const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null);

	// Workflow data
	const { data: workflow } = useSuspenseQuery(workflowQueryOptions(workflowId));

	// React Flow state
	const [nodes, setNodes] = useState<WorkflowNode[]>([]);
	const [edges, setEdges] = useState<WorkflowEdge[]>([]);

	// Initialize nodes and edges from workflow
	useEffect(() => {
		if (workflow) {
			const flowNodes = toReactFlowNodes(workflow.nodes);
			const flowEdges = toReactFlowEdges(workflow.edges);
			setNodes(flowNodes);
			setEdges(flowEdges);
		}
	}, [workflow]);

	// Save workflow mutation
	const saveWorkflowMutation = useMutation({
		mutationFn: async (data: {
			nodes: WorkflowNode[];
			edges: WorkflowEdge[];
		}) => {
			const backendWorkflow = toBackendWorkflow(data.nodes, data.edges);
			await api.patch(`/api/workflows/${workflowId}`, backendWorkflow);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["workflow", workflowId] });
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

	// Handle node/edge changes
	const handleNodesChange = useCallback(
		(updatedNodes: WorkflowNode[]) => {
			setNodes(updatedNodes);
			saveState(updatedNodes, edges);
			triggerChange(updatedNodes, edges);
		},
		[edges, saveState, triggerChange],
	);

	const handleEdgesChange = useCallback(
		(updatedEdges: WorkflowEdge[]) => {
			setEdges(updatedEdges);
			saveState(nodes, updatedEdges);
			triggerChange(nodes, updatedEdges);
		},
		[nodes, saveState, triggerChange],
	);

	// Handle node selection
	const handleNodeSelection = useCallback((selectedNodes: WorkflowNode[]) => {
		setSelectedNode(selectedNodes.length === 1 ? selectedNodes[0] : null);
	}, []);

	// Handle node property updates
	const handleNodeUpdate = useCallback(
		(nodeId: string, updates: Partial<WorkflowNode["data"]>) => {
			const updatedNodes = nodes.map((node) => {
				if (node.id === nodeId) {
					return {
						...node,
						data: {
							...node.data,
							...updates,
						},
					};
				}
				return node;
			});
			setNodes(updatedNodes);
			saveState(updatedNodes, edges);
			triggerChange(updatedNodes, edges);
			
			// Update selected node to reflect changes
			if (selectedNode?.id === nodeId) {
				const updatedNode = updatedNodes.find((n) => n.id === nodeId);
				if (updatedNode) setSelectedNode(updatedNode);
			}
		},
		[nodes, edges, saveState, triggerChange, selectedNode],
	);

	// Handle layout
	const handleLayout = useCallback(
		(layoutedNodes: WorkflowNode[], layoutedEdges: WorkflowEdge[]) => {
			setNodes(layoutedNodes);
			setEdges(layoutedEdges);
			saveState(layoutedNodes, layoutedEdges);
			triggerChange(layoutedNodes, layoutedEdges);
		},
		[saveState, triggerChange],
	);

	// Executions query
	const { data: executions, isLoading: isLoadingExecutions } = useQuery({
		...executionsQueryOptions(workflowId),
		enabled: activeTab === "executions",
	});

	const { data: executionData, isLoading: isLoadingDetails } = useQuery(
		executionDataQueryOptions(selectedExecution?.id || ""),
	);

	return (
		<div className="p-6 space-y-4">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="mb-4">
					<TabsTrigger value="editor">Editor</TabsTrigger>
					<TabsTrigger value="details">Details</TabsTrigger>
					<TabsTrigger value="executions">Executions</TabsTrigger>
				</TabsList>

				{/* ================= VISUAL EDITOR TAB ================= */}
				<TabsContent value="editor" className="space-y-0">
					<EditorToolbar
						autoSaveEnabled={autoSaveEnabled}
						onToggleAutoSave={toggleAutoSave}
						hasUnsavedChanges={hasUnsavedChanges}
						onManualSave={handleManualSave}
						isSaving={isSaving || saveWorkflowMutation.isPending}
					/>

					<div className="flex gap-4 h-[calc(100vh-200px)]">
						{/* Left Sidebar: Node Palette */}
						<div className="w-64 flex-shrink-0 space-y-4 overflow-y-auto">
							<NodePalette />
							<ValidationPanel nodes={nodes} edges={edges} />
						</div>

						{/* Main Editor Area */}
						<div className="flex-1 border rounded-lg overflow-hidden bg-white relative">
							<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
								<UndoRedoControls
									canUndo={canUndo}
									canRedo={canRedo}
									onUndo={undo}
									onRedo={redo}
								/>
								<LayoutControls
									nodes={nodes}
									edges={edges}
									onLayout={handleLayout}
								/>
							</div>
							<WorkflowVisualEditor
								initialNodes={nodes}
								initialEdges={edges}
								onNodesChange={handleNodesChange}
								onEdgesChange={handleEdgesChange}
								onNodeSelection={handleNodeSelection}
							/>
						</div>

						{/* Right Sidebar: Property Inspector */}
						<PropertyInspector
							selectedNode={selectedNode}
							onUpdateNode={handleNodeUpdate}
							onClose={() => setSelectedNode(null)}
						/>
					</div>
				</TabsContent>

				{/* ================= DETAILS TAB ================= */}
				<TabsContent value="details">
					<WorkflowDetails workflow={workflow} />
				</TabsContent>

				{/* ================= EXECUTIONS TAB ================= */}
				<TabsContent value="executions">
					<div className="grid grid-cols-3 gap-6">
						<ExecutionsList
							executions={executions || []}
							isLoading={isLoadingExecutions}
							selectedExecutionId={selectedExecution?.id}
							onSelectExecution={setSelectedExecution}
						/>
						<ExecutionDetails
							execution={selectedExecution}
							executionData={executionData}
							isLoading={isLoadingDetails}
						/>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	);
}
