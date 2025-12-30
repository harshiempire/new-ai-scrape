import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";
import type { NodeDefinitionMeta } from "./NodeDefinitionMeta";
import { createNodePropsSchema } from "../lib/schemaBuilder";

// Single source of truth: Zod schema + UI metadata
const { zodSchema: WaitNodePropsSchema, jsonSchema: WaitNodeUISchema } = createNodePropsSchema({
  schema: z.object({
    duration: z.number().min(0).default(1000),
  }),
  ui: {
    duration: {
      showOnNode: true,
      label: "Delay:",
      format: "{value/1000}s",  // Show as seconds
    },
  },
});

export const WaitNodeMeta: NodeDefinitionMeta = {
  type: "wait",
  label: "Wait",
  description: "Pauses workflow execution for a specified duration",
  category: "logic",
  icon: "Clock",
  color: "purple",
  propsSchema: WaitNodeUISchema,
  defaultProps: { duration: 1000 },
  validationRules: [
    { field: "duration", type: "min", value: 0, message: "Duration must be positive" }
  ],
  visualConfig: {
    handles: { inputs: true, outputs: true },
  },
};

export class WaitNode extends Node {
  name = "WaitNode";

  constructor({
    id,
    label,
    props,
    outputSchema,
  }: {
    id: string;
    label: string;
    props?: Record<string, any>;
    outputSchema?: import("zod").ZodTypeAny;
  }) {
    super({ id, label, type: "wait", props, outputSchema });
    this.description = "Waits for a specified duration before proceeding";
  }

  async execute(context: ExecutionContext): Promise<void> {
    console.log(`[WaitNode ${this.label}] Executing wait (no-op placeholder)`);

    // For now, WaitNode simply passes props or an optional "message" forward
    const output = this.props?.output ?? this.props?.message ?? null;
    await this.sendOutput(output, context);
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

