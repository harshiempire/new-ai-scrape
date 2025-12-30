import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";
import type { NodeDefinitionMeta } from "./NodeDefinitionMeta";

export const StartNodeMeta: NodeDefinitionMeta = {
  type: "start",
  label: "Start",
  description: "Workflow entry point. Receives initial inputs.",
  category: "trigger",
  icon: "Play",
  color: "green",
  propsSchema: {}, // No configurable props
  defaultProps: {},
  validationRules: [],
  visualConfig: {
    handles: { inputs: false, outputs: true }, // Only output handle
    subtitle: "Workflow entry point",
  },
};

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

  async execute(context: ExecutionContext) {
    console.log(`\n🚀 [StartNode ${this.label}] Starting workflow execution`);
    console.log("━".repeat(50));
    console.log(
      "\n📥 Initial inputs:",
      JSON.stringify(context.initialInputs, null, 2)
    );
    await this.sendOutput(context.initialInputs, context);
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

