import { APINodeDefinition } from "../APINode";

export const NODE_DEFINITIONS = {
  api: APINodeDefinition,
};

export type NodeType = keyof typeof NODE_DEFINITIONS;
