import type { WorkflowEdge, WorkflowNode } from "./workflow-types";
import type { NodeDefinition, ValidationRule } from "@/api/nodeDefinitions";

export interface ValidationError {
	type: "error" | "warning";
	message: string;
	nodeIds?: string[];
}

/**
 * Apply validation rules from node definition to a node
 */
function applyValidationRules(
	node: WorkflowNode,
	rules: ValidationRule[],
	errors: ValidationError[]
): void {
	for (const rule of rules) {
		const value = node.data.props?.[rule.field];
		
		switch (rule.type) {
			case "required":
				if (value === undefined || value === null || value === "") {
					errors.push({
						type: "error",
						message: `${node.data.label}: ${rule.message}`,
						nodeIds: [node.id],
					});
				}
				break;
			case "pattern":
				if (value && rule.value && !new RegExp(rule.value).test(String(value))) {
					errors.push({
						type: "error",
						message: `${node.data.label}: ${rule.message}`,
						nodeIds: [node.id],
					});
				}
				break;
			case "min":
				if (typeof value === "number" && value < rule.value) {
					errors.push({
						type: "error",
						message: `${node.data.label}: ${rule.message}`,
						nodeIds: [node.id],
					});
				}
				break;
			case "max":
				if (typeof value === "number" && value > rule.value) {
					errors.push({
						type: "error",
						message: `${node.data.label}: ${rule.message}`,
						nodeIds: [node.id],
					});
				}
				break;
		}
	}
}

/**
 * Validate workflow structure
 * Returns array of validation errors/warnings
 * @param nodeDefinitions - Optional node definitions for dynamic validation rules
 */
export function validateWorkflow(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
	nodeDefinitions?: NodeDefinition[],
): ValidationError[] {
	const errors: ValidationError[] = [];

	// Check for start node
	const startNodes = nodes.filter((n) => n.type === "start");
	if (startNodes.length === 0) {
		errors.push({
			type: "error",
			message: "Workflow must have at least one Start node",
		});
	} else if (startNodes.length > 1) {
		errors.push({
			type: "warning",
			message: `Multiple Start nodes detected (${startNodes.length})`,
			nodeIds: startNodes.map((n) => n.id),
		});
	}

	// Check for end node
	const endNodes = nodes.filter((n) => n.type === "end");
	if (endNodes.length === 0) {
		errors.push({
			type: "error",
			message: "Workflow must have at least one End node",
		});
	}

	// Check for orphaned nodes (nodes not connected to anything, except start nodes)
	if (edges.length > 0) {
		const connectedNodeIds = new Set<string>();
		edges.forEach((edge) => {
			connectedNodeIds.add(edge.source);
			connectedNodeIds.add(edge.target);
		});

		const orphanedNodes = nodes.filter(
			(node) => !connectedNodeIds.has(node.id) && node.type !== "start",
		);

		if (orphanedNodes.length > 0) {
			errors.push({
				type: "warning",
				message: `${orphanedNodes.length} orphaned node(s) detected`,
				nodeIds: orphanedNodes.map((n) => n.id),
			});
		}
	}

	// Check for cycles using DFS
	if (hasCycle(nodes, edges)) {
		errors.push({
			type: "error",
			message: "Workflow contains cycles (DAG validation failed)",
		});
	}

	// Apply dynamic validation rules from node definitions
	if (nodeDefinitions) {
		nodes.forEach((node) => {
			const nodeDef = nodeDefinitions.find(d => d.type === node.type);
			if (nodeDef?.validationRules && nodeDef.validationRules.length > 0) {
				applyValidationRules(node, nodeDef.validationRules, errors);
			}
		});
	} else {
		// Fallback: hardcoded validation for API nodes (backwards compatibility)
		nodes.forEach((node) => {
			if (node.type === "api") {
				const url = node.data.props?.url;
				if (!url || url.trim() === "") {
					errors.push({
						type: "error",
						message: `API node "${node.data.label}" missing URL`,
						nodeIds: [node.id],
					});
				}
			}
		});
	}

	return errors;
}

/**
 * Detect cycles in the workflow graph using DFS
 */
export function hasCycle(
	nodes: WorkflowNode[],
	edges: WorkflowEdge[],
): boolean {
	const adjList = new Map<string, string[]>();

	// Build adjacency list
	nodes.forEach((node) => adjList.set(node.id, []));
	edges.forEach((edge) => {
		const neighbors = adjList.get(edge.source) || [];
		neighbors.push(edge.target);
		adjList.set(edge.source, neighbors);
	});

	const visited = new Set<string>();
	const recStack = new Set<string>();

	function dfs(nodeId: string): boolean {
		visited.add(nodeId);
		recStack.add(nodeId);

		const neighbors = adjList.get(nodeId) || [];
		for (const neighbor of neighbors) {
			if (!visited.has(neighbor)) {
				if (dfs(neighbor)) return true;
			} else if (recStack.has(neighbor)) {
				return true; // Cycle detected
			}
		}

		recStack.delete(nodeId);
		return false;
	}

	for (const node of nodes) {
		if (!visited.has(node.id)) {
			if (dfs(node.id)) return true;
		}
	}

	return false;
}

/**
 * Get validation status summary
 */
export function getValidationSummary(errors: ValidationError[]): {
	isValid: boolean;
	errorCount: number;
	warningCount: number;
} {
	const errorCount = errors.filter((e) => e.type === "error").length;
	const warningCount = errors.filter((e) => e.type === "warning").length;

	return {
		isValid: errorCount === 0,
		errorCount,
		warningCount,
	};
}
