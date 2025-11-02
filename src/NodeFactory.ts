import { Node } from "./Node";
import { StartNode } from "./StartNode";
import { APINode } from "./APINode";
import { EndNode } from "./EndNode";
import { NodeDefinition } from "./types";

export class NodeFactory {
  static createNode(nodeDef: NodeDefinition): Node {
    switch (nodeDef.type) {
      case "start":
        return new StartNode({ id: nodeDef.id, label: nodeDef.label });

      case "api":
        return new APINode({
          id: nodeDef.id,
          label: nodeDef.label,
          props: nodeDef.props,
        });

      case "end":
        return new EndNode({ id: nodeDef.id, label: nodeDef.label });

      default:
        throw new Error(`Unknown node type: ${nodeDef.type}`);
    }
  }
}
