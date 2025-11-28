import type { Edge, Node } from "@xyflow/react";

/**
 * Backend API Types (matches src/lib/types.ts from backend)
 */
export interface BackendEdge {
	id: string;
	source: string;
	target: string;
	sourceHandle?: string;
	targetHandle?: string;
}

export interface BackendNodeDefinition {
	id: string;
	type: string;
	label: string;
	props?: Record<string, any>;
	inputSchema?: Record<string, any>;
	outputSchema?: Record<string, any>;
}

export interface BackendWorkflowDefinition {
	nodes: BackendNodeDefinition[];
	edges: BackendEdge[];
}

/**
 * Extended types for API responses
 */
export interface WorkflowDTO {
	id: string;
	name: string;
	nodes: BackendNodeDefinition[];
	edges: BackendEdge[];
	createdAt: string;
	updatedAt: string;
}

export interface WorkflowExecution {
	id: string;
	workflowId: string;
	runNumber: number;
	status: string;
	startedAt: string;
	completedAt?: string;
	executionTime?: number;
}

export interface ExecutionData {
	id: string;
	executionId: string;
	variablePool: Record<string, any>;
	initialInputs: Record<string, any>;
}

/**
 * React Flow Types (extended with custom data)
 */
export interface WorkflowNodeData extends Record<string, unknown> {
	label: string;
	props?: Record<string, any>;
	inputSchema?: Record<string, any>;
	outputSchema?: Record<string, any>;
}

export type WorkflowNode = Node<WorkflowNodeData>;
export type WorkflowEdge = Edge;

/**
 * Node type literals
 */
export type NodeType = "start" | "api" | "wait" | "end";

/**
 * Position data stored in node props
 */
export interface NodePosition {
	x: number;
	y: number;
}
