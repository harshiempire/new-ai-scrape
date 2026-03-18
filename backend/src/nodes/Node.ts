import { ExecutionContext } from "./ExecutionContext";
import { Edge } from "../lib/types";
import { z } from "zod";
import { prisma } from "../prisma";

export abstract class Node<TProps = Record<string, any>> {
  id: string;
  label: string;
  type: string;
  description: string;
  props: TProps;
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
    props?: TProps;
    outputSchema?: z.ZodTypeAny;
  }) {
    this.id = id;
    this.label = label;
    this.type = type;
    this.description = "";
    this.props = props;
    this.inputSchema = new Map();
    this.outputSchema = outputSchema ?? z.any();
  }

  abstract execute(context: ExecutionContext): Promise<void>;

  abstract toJSON(): Record<string, any>;

  /**
   * Validate input data against the schema for a specific edge.
   * Made public so utils can call it.
   */
  public validateInput(edgeId: string, data: any): any {
    const schema = this.inputSchema.get(edgeId);

    if (!schema) {
      return data;
    }

    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Input validation failed for ${this.label} on edge ${edgeId}: ${JSON.stringify(error.issues, null, 2)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Validate output data before writing to the variable pool.
   */
  protected validateOutput(data: any): any {
    if (this.outputSchema === z.any() || !this.outputSchema) {
      return data;
    }

    try {
      return this.outputSchema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(
          `Output validation failed for ${this.label}: ${JSON.stringify(error.issues, null, 2)}`,
        );
      }
      throw error;
    }
  }

  /**
   * Get inputs for a node from the variable pool.
   * Reads all upstream node outputs keyed by node ID.
   */
  protected async getNodeInputs(context: ExecutionContext) {
    const incomingEdges = context.edges.filter(
      (edge) => edge.target === this.id,
    );
    const inputs = new Map<string, any>();

    const executionDataId = context.executionDataId;
    if (!executionDataId) {
      throw new Error("Execution data ID is missing in the context");
    }

    const executionData = await prisma.executionData.findUnique({
      where: { id: executionDataId },
      select: { variablePool: true },
    });

    if (!executionData) {
      throw new Error("Execution data not found");
    }

    incomingEdges.forEach((edge) => {
      const data = executionData.variablePool as Record<string, any>;
      const sourceNodeId = edge.source;
      const value = data[sourceNodeId];
      if (value !== undefined) {
        inputs.set(sourceNodeId, value);
      }
    });

    return inputs;
  }

  protected async sendOutput(
    output: any,
    context: ExecutionContext,
    edgeFilter?: (edge: Edge) => boolean,
  ) {
    const validatedOutput = this.validateOutput(output);

    const executionDataId = context.executionDataId;
    if (!executionDataId) {
      throw new Error("Execution data ID is missing in the context");
    }

    const patch = JSON.stringify({ [this.id]: validatedOutput });
    const updated = await prisma.$executeRaw`
      UPDATE execution_data
      SET "variablePool" = "variablePool" || ${patch}::jsonb
      WHERE id = ${executionDataId}
    `;

    if (updated === 0) {
      throw new Error("Execution data not found");
    }
  }

  /**
   * Register the input schema for a specific incoming edge.
   */
  setInputSchemaForEdge(edgeId: string, schema: z.ZodTypeAny): void {
    this.inputSchema.set(edgeId, schema);
  }

  /**
   * Override the output schema.
   */
  setOutputSchema(schema: z.ZodTypeAny): void {
    this.outputSchema = schema;
  }
}
