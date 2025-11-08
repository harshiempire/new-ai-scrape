import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { getNodeInputs } from "./utils";

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

  execute(context: ExecutionContext): void {
    const inputs = getNodeInputs(context, this.id);
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
