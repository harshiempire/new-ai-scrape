/**
 * Schema Builder Utility
 * 
 * Generates JSON Schema with UI extensions from Zod schemas.
 * This creates a single source of truth - define schemas in Zod,
 * get JSON Schema with UI metadata automatically.
 */

import { z } from "zod";
import type { JSONSchema7, JSONSchema7Definition } from "json-schema";

/**
 * Extended JSON Schema property with our custom UI extensions
 */
interface ExtendedSchemaProperty extends JSONSchema7 {
  "x-showOnNode"?: boolean;
  "x-colorMap"?: Record<string, string>;
  "x-label"?: string;
  "x-format"?: string;
  placeholder?: string;
}

/**
 * Extended JSON Schema with our custom extensions
 */
export interface ExtendedJSONSchema extends Omit<JSONSchema7, "properties" | "if" | "then"> {
  properties?: Record<string, ExtendedSchemaProperty | boolean>;
  if?: { properties: Record<string, { enum: string[] }> };
  then?: { properties: Record<string, { type: string; title?: string }> };
}

/**
 * UI configuration for individual fields
 */
export interface FieldUIConfig {
  /** Show this field on the node canvas */
  showOnNode?: boolean;
  /** Color mapping for enum values (e.g., { GET: "blue", POST: "green" }) */
  colorMap?: Record<string, string>;
  /** Label prefix for display (e.g., "Delay:") */
  label?: string;
  /** Format template for display (e.g., "{value/1000}s") */
  format?: string;
  /** Placeholder text for input */
  placeholder?: string;
}

/**
 * Conditional visibility rule
 */
export interface ConditionalRule {
  /** Field to check */
  if: { field: string; values: string[] };
  /** Fields to show when condition is met */
  then: { show: Record<string, { type: string; title?: string }> };
}

/**
 * Configuration for creating a node props schema
 */
export interface NodePropsSchemaConfig<T extends z.ZodRawShape> {
  /** The Zod schema (source of truth for types) */
  schema: z.ZodObject<T>;
  /** UI configuration per field */
  ui?: Partial<Record<keyof T, FieldUIConfig>>;
  /** Conditional visibility rules */
  conditionals?: ConditionalRule[];
  /** Required fields override (if not using Zod's built-in) */
  required?: (keyof T)[];
}

/**
 * Result of creating a node props schema
 */
export interface NodePropsSchemaResult<T extends z.ZodRawShape> {
  /** Zod schema for runtime validation */
  zodSchema: z.ZodObject<T>;
  /** JSON Schema with UI extensions for frontend */
  jsonSchema: ExtendedJSONSchema;
}

/**
 * Create a node props schema from Zod with UI metadata
 * 
 * @example
 * const { zodSchema, jsonSchema } = createNodePropsSchema({
 *   schema: z.object({
 *     method: z.enum(["GET", "POST"]),
 *     url: z.string(),
 *   }),
 *   ui: {
 *     method: { showOnNode: true, colorMap: { GET: "blue", POST: "green" } },
 *     url: { showOnNode: true },
 *   },
 * });
 */
export function createNodePropsSchema<T extends z.ZodRawShape>(
  config: NodePropsSchemaConfig<T>
): NodePropsSchemaResult<T> {
  // Generate base JSON Schema from Zod
  const baseJsonSchema = z.toJSONSchema(config.schema) as JSONSchema7;

  // Deep clone and cast to our extended type
  const jsonSchema = structuredClone(baseJsonSchema) as unknown as ExtendedJSONSchema;

  // Merge UI metadata into properties
  if (config.ui && jsonSchema.properties) {
    for (const [field, uiConfig] of Object.entries(config.ui)) {
      const prop = jsonSchema.properties[field];
      if (prop && typeof prop !== "boolean" && uiConfig) {
        const ui = uiConfig as FieldUIConfig;
        
        if (ui.showOnNode) {
          prop["x-showOnNode"] = true;
        }
        if (ui.colorMap) {
          prop["x-colorMap"] = ui.colorMap;
        }
        if (ui.label) {
          prop["x-label"] = ui.label;
        }
        if (ui.format) {
          prop["x-format"] = ui.format;
        }
        if (ui.placeholder) {
          prop["placeholder"] = ui.placeholder;
        }
      }
    }
  }

  // Add conditional visibility rules
  if (config.conditionals && config.conditionals.length > 0) {
    const cond = config.conditionals[0]; // Support first conditional for now
    jsonSchema.if = {
      properties: {
        [cond.if.field]: { enum: cond.if.values },
      },
    };
    jsonSchema.then = {
      properties: cond.then.show,
    };
  }

  // Override required if specified
  if (config.required) {
    jsonSchema.required = config.required as string[];
  }

  return {
    zodSchema: config.schema,
    jsonSchema,
  };
}

/**
 * Create an empty schema for nodes with no configurable props
 */
export function createEmptyPropsSchema() {
  return {
    zodSchema: z.object({}),
    jsonSchema: {},
  };
}
