import { ExecutionContext } from "./ExecutionContext";
import { Edge } from "./types";
import { z } from "zod";

export abstract class Node {
  id: string;
  label: string;
  type: string;
  description: string;
  props: Record<string, any>;
  inputSchema: Map<string, z.ZodTypeAny>;
  outputSchema: z.ZodTypeAny;

  constructor({
    id,
    label,
    type,
    props,
    outputSchema,
  }: {
    id: string;
    label: string;
    type: string;
    props?: Record<string, any>;
    outputSchema?: z.ZodTypeAny;
  }) {
    this.id = id;
    this.label = label;
    this.type = type;
    this.description = "";
    this.props = props || {};
    this.inputSchema = new Map();
    // Initialize output schema from constructor param if provided, otherwise default to any
    console.log("outputSchema", type, outputSchema);
    this.outputSchema = outputSchema ?? z.any();
  }

  abstract execute(context: ExecutionContext): Promise<void> | void;

  abstract toJSON(): Record<string, any>;

  // protected sendOutput(
  //   output: any,
  //   context: ExecutionContext,
  //   edgeFilter?: (edge: Edge) => boolean
  // ): void {
  //   const outgoingEdges = context.edges.filter(
  //     (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
  //   );

  //   outgoingEdges.forEach((edge) => {
  //     context.variablePool.set(edge.id, output);
  //     console.log(`Node [${this.label}] pushed data to edge ${edge.id}`);
  //   });
  // }

  /**
   * Validate input data against the schema for a specific edge
   * Made public so utils can call it
   */
  public validateInput(edgeId: string, data: any): any {
    const schema = this.inputSchema.get(edgeId);

    if (!schema) {
      // No schema defined, skip validation
      return data;
    }

    try {
      const validated = schema.parse(data);
      console.log(
        `[${this.label}] ✓ Input validation passed for edge ${edgeId}`
      );
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Input validation failed for edge ${edgeId}:`,
          error.issues
        );
        throw new Error(
          `Input validation failed for ${
            this.label
          } on edge ${edgeId}: ${JSON.stringify(error.issues)}`
        );
      }
      throw error;
    }
  }

  /**
   * Validate output data before writing to VariablePool
   */
  protected validateOutput(data: any): any {
    // If no specific schema, return as-is
    if (this.outputSchema === z.any() || !this.outputSchema) {
      return data;
    }

    try {
      const validated = this.outputSchema.parse(data);
      console.log(`[${this.label}] ✓ Output validation passed`);
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[${this.label}] ✗ Output validation failed:`,
          error.issues
        );
        throw new Error(
          `Output validation failed for ${this.label}: ${JSON.stringify(
            error.issues
          )}`
        );
      }
      throw error;
    }
  }

  protected sendOutput(
    output: any,
    context: ExecutionContext,
    edgeFilter?: (edge: Edge) => boolean
  ): void {
    // Validate output before sending
    const validatedOutput = this.validateOutput(output);

    const outgoingEdges = context.edges.filter(
      (edge) => edge.source === this.id && (!edgeFilter || edgeFilter(edge))
    );

    outgoingEdges.forEach((edge) => {
      context.variablePool.set(edge.id, validatedOutput);
      console.log(
        `Node [${this.label}] pushed validated data to edge ${edge.id}`
      );
    });
  }

  /**
   * Set input schema for a specific edge
   */
  setInputSchemaForEdge(edgeId: string, schema: z.ZodTypeAny): void {
    this.inputSchema.set(edgeId, schema);
    console.log(`[${this.label}] Registered input schema for edge ${edgeId}`);
  }

  /**
   * Set output schema
   */
  setOutputSchema(schema: z.ZodTypeAny): void {
    this.outputSchema = schema;
    console.log(`[${this.label}] Registered output schema`);
  }
}
