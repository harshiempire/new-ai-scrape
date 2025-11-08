import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";

export class StartNode extends Node {
  name = "StartNode";

  constructor({
    id,
    label,
    outputSchema,
  }: {
    id: string;
    label: string;
    outputSchema?: import("zod").ZodTypeAny;
  }) {
    super({ id, label, type: "start", outputSchema });
    this.description = "Starts workflow execution by injecting initial inputs";

    // StartNode accepts any input, outputs whatever it receives
    // Only set default if workflow didn't provide one
    if (this.outputSchema === z.any()) {
      this.outputSchema = z.any();
    }
  }

  execute(context: ExecutionContext): void {
    console.log(
      `[StartNode ${this.label}] Injecting initial inputs:`,
      context.initialInputs
    );
    this.sendOutput(context.initialInputs, context);
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
