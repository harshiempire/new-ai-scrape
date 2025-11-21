import { ExecutionContext } from "./ExecutionContext";
import { Edge } from "./types";
import { z } from "zod";
import { prisma } from "./lib/prisma";

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
    // console.log("outputSchema", type, outputSchema);
    this.outputSchema = outputSchema ?? z.any();
  }

  abstract execute(context: ExecutionContext): Promise<void>;

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
      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] No input schema defined for edge ${edgeId}, skipping validation`
      );
      return data;
    }

    try {
      const validated = schema.parse(data);
      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] ✅ Input validation passed for edge ${edgeId}`
      );
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[Node ${this.type.toUpperCase()}] [${this.label}] ❌ Input validation failed for edge ${edgeId}:`,
          JSON.stringify(error.issues, null, 2)
        );
        throw new Error(
          `Input validation failed for ${
            this.label
          } on edge ${edgeId}: ${JSON.stringify(error.issues, null, 2)}`
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
      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] No output schema defined, skipping validation`
      );
      return data;
    }

    try {
      const validated = this.outputSchema.parse(data);
      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] ✅ Output validation passed`
      );
      if (typeof validated === "object") {
        console.log("Output Data:", JSON.stringify(validated, null, 2));
      } else {
        console.log("Output Data:", validated);
      }
      return validated;
    } catch (error) {
      if (error instanceof z.ZodError) {
        console.error(
          `[Node ${this.type.toUpperCase()}] [${this.label}] ❌ Output validation failed:`,
          JSON.stringify(error.issues, null, 2)
        );
        throw new Error(
          `Output validation failed for ${this.label}: ${JSON.stringify(
            error.issues,
            null,
            2
          )}`
        );
      }
      throw error;
    }
  }

  /**
   * Get inputs for a node from the VariablePool WITHOUT direct validation
   * (validation happens inside node.execute when it processes inputs)
   */
  protected async getNodeInputs(context: ExecutionContext) {
    const incomingEdges = context.edges.filter(
      (edge) => edge.target === this.id
    );
    const inputs = new Map<string, any>();

    const executionDataId = context.executionDataId;
    if (!executionDataId) {
      throw new Error("Execution data ID is missing in the context");
    }

    const exectionData = await prisma.executionData.findUnique({
      where: { id: executionDataId },
      select: {
        variablePool: true,
      },
    });
    if (!exectionData) {
      throw new Error("Execution data not found");
    }
    console.log(executionDataId, exectionData);

    incomingEdges.forEach((edge) => {
      const data = exectionData.variablePool as Record<string, any>;
      const value = data[edge.source];
      if (value !== undefined) {
        inputs.set(edge.id, value);
      }
    });

    return inputs;
  }

  protected async sendOutput(
    output: any,
    context: ExecutionContext,
    edgeFilter?: (edge: Edge) => boolean
  ) {
    console.log(
      `\n📤 [Node ${this.type.toUpperCase()}] [${this.label}] Preparing to send output...`
    );

    // Validate output before sending
    try {
      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] 🔍 Validating output data...`
      );
      const validatedOutput = this.validateOutput(output);

      const executionDataId = context.executionDataId;
      if (!executionDataId) {
        throw new Error("Execution data ID is missing in the context");
      }

      const executionData = await prisma.executionData.findUnique({
        where: { id: executionDataId },
        select: {
          variablePool: true,
        },
      });
      if (!executionData) {
        throw new Error("Execution data not found");
      }
      console.log(executionDataId, executionData);
      let newVariablePool = executionData.variablePool;

      console.log(
        `\n[Node ${this.type.toUpperCase()}] [${this.label}] 🔄 Processing node ${this.id}...`
      );

      const data = executionData.variablePool as Record<string, any>;
      newVariablePool = { ...data, [this.id]: validatedOutput };

      console.log(
        `[Node ${this.type.toUpperCase()}] [${this.label}] 💾 Updating execution data in database... with the new VariablePool ${JSON.stringify(newVariablePool, null, 2)}`
      );

      if (typeof validatedOutput === "object") {
        console.log(
          `[Node ${this.type.toUpperCase()}] [${this.label}] 📦 Data sent:`,
          JSON.stringify(validatedOutput, null, 2)
        );
      } else {
        console.log(
          `[Node ${this.type.toUpperCase()}] [${this.label}] 📦 Data sent:`,
          validatedOutput
        );
      }

      const updatedData = await prisma.executionData.update({
        where: { id: executionDataId },
        data: { variablePool: newVariablePool },
      });
      console.log(
        `✅ [Node ${this.type.toUpperCase()}] [${this.label}] Successfully sent data to edges - updated data is ${JSON.stringify(updatedData.variablePool, null, 2)}`
      );
    } catch (error) {
      console.error(
        `\n❌ [Node ${this.type.toUpperCase()}] [${this.label}] Error sending output:`
      );
      console.error("━".repeat(50));
      if (error instanceof Error) {
        console.error(`🔴 Error message: ${error.message}`);
        console.error(`📜 Stack trace:\n${error.stack}`);
      } else {
        console.error("🔴 Unknown error:", error);
      }
      throw error; // Re-throw to allow proper error handling up the chain
    }
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
