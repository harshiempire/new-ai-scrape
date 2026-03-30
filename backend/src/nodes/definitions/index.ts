import { APINodeMeta } from "../APINode";
import { StartNodeMeta } from "../StartNode";
import { WaitNodeMeta } from "../WaitNode";
import { EndNodeMeta } from "../EndNode";

export const NODE_DEFINITIONS = {
  start: StartNodeMeta,
  api: APINodeMeta,
  wait: WaitNodeMeta,
  end: EndNodeMeta,
};

export type NodeType = keyof typeof NODE_DEFINITIONS;

