import type { NodeTypes } from "@xyflow/react";
import { DynamicNode } from "./DynamicNode";

// All node types now use the single DynamicNode component
// which renders based on backend metadata (visualConfig)
// This is the industry-standard pattern (like n8n's declarative nodes)
export const nodeTypes = {
  start: DynamicNode,
  api: DynamicNode,
  wait: DynamicNode,
  end: DynamicNode,
  // Add new node types here - they all use DynamicNode
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any as NodeTypes;

