import { Node } from "./Node";
import { ExecutionContext } from "./ExecutionContext";
import { z } from "zod";

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
