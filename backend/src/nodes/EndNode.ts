import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import type { NodeDefinitionMeta } from "./NodeDefinitionMeta";

export const EndNodeMeta: NodeDefinitionMeta = {
  type: "end",
  label: "End",
  description: "Marks workflow completion",
  category: "output",
  icon: "Flag",
  color: "red",
  propsSchema: {},
  defaultProps: {},
  validationRules: [],
  visualConfig: {
    handles: { inputs: true, outputs: false }, // Only input handle
    subtitle: "Workflow completion",
  },
};

export class EndNode extends Node {
  name = "EndNode";

  constructor({
    id,
    label,
    outputSchema,
  }: {
    id: string;
    label: string;
    outputSchema?: import("zod").ZodTypeAny;
  }) {
    super({ id, label, type: "end", outputSchema });
    this.description = "Marks the end of workflow execution";
  }

  async execute(context: ExecutionContext) {
    const inputs = await this.getNodeInputs(context);
    console.log(
      `[EndNode ${this.label}] Workflow completed with inputs:`,
      Object.fromEntries(inputs)
    );
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      props: this.props,
    };
  }
}

