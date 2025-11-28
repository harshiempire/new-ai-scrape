import type {
	BackendEdge,
	BackendNodeDefinition,
	BackendWorkflowDefinition,
	NodePosition,
	WorkflowEdge,
	WorkflowNode,
} from "./workflow-types";

/**
 * Transform backend node definitions to React Flow nodes
 *
 * Extracts position from props if available, otherwise defaults to (0, 0)
 * which will be replaced by auto-layout on first render.
 */
export function toReactFlowNodes(
	nodeDefinitions: BackendNodeDefinition[],
): WorkflowNode[] {
	return nodeDefinitions.map((node) => {
		const position: NodePosition = node.props?.position || { x: 0, y: 0 };

		// Remove position from props to avoid duplication
		const { position: _, ...propsWithoutPosition } = node.props || {};

		return {
			id: node.id,
			type: node.type,
			position,
			data: {
				label: node.label,
				props: propsWithoutPosition,
				inputSchema: node.inputSchema,
				outputSchema: node.outputSchema,
			},
		};
	});
}

/**
 * Transform backend edges to React Flow edges
 *
 * Adds default styling for visual consistency.
 */
export function toReactFlowEdges(edges: BackendEdge[]): WorkflowEdge[] {
	return edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		sourceHandle: edge.sourceHandle,
		targetHandle: edge.targetHandle,
		type: "smoothstep",
		animated: true,
	}));
}

/**
 * Transform React Flow nodes and edges back to backend format
 *
 * Stores node positions in props for persistence.
 */
export function toBackendWorkflow(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
): BackendWorkflowDefinition {
	return {
		nodes: nodes.map((node) => ({
			id: node.id,
			type: node.type as string, // React Flow node.type can be undefined, but we ensure it's always set
			label: node.data.label,
			props: {
				...node.data.props,
				position: node.position, // Store position for next load
			},
			inputSchema: node.data.inputSchema,
			outputSchema: node.data.outputSchema,
		})),
		edges: edges.map((edge) => ({
			id: edge.id,
			source: edge.source,
			target: edge.target,
			sourceHandle: edge.sourceHandle ?? undefined, // Convert null to undefined
			targetHandle: edge.targetHandle ?? undefined, // Convert null to undefined
		})),
	};
}

/**
 * Generate a unique ID for new nodes
 */
export function generateNodeId(type: string): string {
	return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a unique ID for new edges
 */
export function generateEdgeId(sourceId: string, targetId: string): string {
	return `${sourceId}-${targetId}-${Date.now()}`;
}
