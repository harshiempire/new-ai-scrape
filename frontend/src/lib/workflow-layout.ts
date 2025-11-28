import dagre from "dagre";
import type { WorkflowEdge, WorkflowNode } from "./workflow-types";

/**
 * Auto-layout nodes using Dagre hierarchical layout algorithm
 *
 * @param nodes - Array of workflow nodes
 * @param edges - Array of workflow edges
 * @param direction - Layout direction ('TB' = top-to-bottom, 'LR' = left-to-right)
 * @returns Object with layouted nodes and original edges
 */
export function getLayoutedElements(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
	direction: "TB" | "LR" = "TB",
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
	const dagreGraph = new dagre.graphlib.Graph();
	dagreGraph.setDefaultEdgeLabel(() => ({}));

	// Configure graph layout
	dagreGraph.setGraph({
		rankdir: direction,
		nodesep: 80, // Horizontal spacing between nodes
		ranksep: 120, // Vertical spacing between ranks
		marginx: 20,
		marginy: 20,
	});

	const nodeWidth = 250;
	const nodeHeight = 80;

	// Add nodes to dagre graph
	nodes.forEach((node) => {
		dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
	});

	// Add edges to dagre graph
	edges.forEach((edge) => {
		dagreGraph.setEdge(edge.source, edge.target);
	});

	// Run layout algorithm
	dagre.layout(dagreGraph);

	// Apply calculated positions to nodes
	const layoutedNodes = nodes.map((node) => {
		const nodeWithPosition = dagreGraph.node(node.id);

		return {
			...node,
			position: {
				x: nodeWithPosition.x - nodeWidth / 2,
				y: nodeWithPosition.y - nodeHeight / 2,
			},
		};
	});

	return { nodes: layoutedNodes, edges };
}

/**
 * Get bounding box of all nodes
 * Useful for centering or fitting view
 */
export function getNodesBoundingBox(nodes: WorkflowNode[]): {
	x: number;
	y: number;
	width: number;
	height: number;
} {
	if (nodes.length === 0) {
		return { x: 0, y: 0, width: 0, height: 0 };
	}

	let minX = Infinity;
	let minY = Infinity;
	let maxX = -Infinity;
	let maxY = -Infinity;

	nodes.forEach((node) => {
		minX = Math.min(minX, node.position.x);
		minY = Math.min(minY, node.position.y);
		maxX = Math.max(maxX, node.position.x + 250); // Default node width
		maxY = Math.max(maxY, node.position.y + 80); // Default node height
	});

	return {
		x: minX,
		y: minY,
		width: maxX - minX,
		height: maxY - minY,
	};
}
