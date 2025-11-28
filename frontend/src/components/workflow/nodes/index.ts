import type { NodeTypes } from "@xyflow/react";
import { APINode } from "./APINode";
import { EndNode } from "./EndNode";
import { StartNode } from "./StartNode";
import { WaitNode } from "./WaitNode";

// React Flow has strict generic constraints on NodeTypes that are incompatible
// with our custom WorkflowNodeData type, but the code works correctly at runtime.
// This is a known limitation: https://github.com/xyflow/xyflow/discussions/2780
export const nodeTypes = {
	start: StartNode,
	api: APINode,
	wait: WaitNode,
	end: EndNode,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as NodeTypes;
