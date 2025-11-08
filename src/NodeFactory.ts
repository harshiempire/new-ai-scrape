import { Node } from "./Node";
import { StartNode } from "./StartNode";
import { APINode } from "./APINode";
import { EndNode } from "./EndNode";
import { WaitNode } from "./WaitNode";
import { NodeDefinition } from "./types";
import { z } from "zod";

export class NodeFactory {
  static createNode(
    nodeDef: NodeDefinition,
    outputSchema?: z.ZodTypeAny
  ): Node {
    switch (nodeDef.type) {
      case "start":
        return new StartNode({
          id: nodeDef.id,
          label: nodeDef.label,
          outputSchema,
        });

      case "api":
        return new APINode({
          id: nodeDef.id,
          label: nodeDef.label,
          props: nodeDef.props,
          outputSchema,
        });

      case "wait":
        return new WaitNode({
          id: nodeDef.id,
          label: nodeDef.label,
          props: nodeDef.props,
          outputSchema,
        });

      case "end":
        return new EndNode({
          id: nodeDef.id,
          label: nodeDef.label,
          outputSchema,
        });

      default:
        throw new Error(`Unknown node type: ${nodeDef.type}`);
    }
  }
}
