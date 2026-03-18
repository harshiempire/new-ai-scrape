/**
 * Schema Type Definitions
 *
 * Simple JSON format for defining schemas that converts to Zod under the hood.
 * Example: { status: "number", city: "string", tags: "string[]" }
 */

// Primitive type keywords
export type PrimitiveType = "string" | "number" | "boolean" | "any" | "object";

// Array type notation: "string[]", "number[]", etc.
export type ArrayType = `${PrimitiveType}[]`;

// Optional type notation: "string?", "number?", etc.
export type OptionalType = `${PrimitiveType}?`;

// All supported type keywords
export type SchemaType = PrimitiveType | ArrayType | OptionalType;

// Schema value can be a type string or nested object
export type SchemaValue = SchemaType | SimpleSchema | ArraySchemaDefinition;

// The main schema format: { fieldName: "type" | nestedSchema }
export interface SimpleSchema {
  [key: string]: SchemaValue;
}

/**
 * Variable info for autocomplete suggestions
 */
export interface VariableInfo {
  /** Full path including node label: "StartNode.city" */
  path: string;
  /** Type of the variable: "string", "number", etc. */
  type: SchemaType;
}

/**
 * Grouped variables from a source node
 */
export interface SourceNodeVariables {
  /** Label of the source node */
  nodeLabel: string;
  /** Variables available from this node */
  variables: VariableInfo[];
}

/**
 * Template analysis result
 */
export interface TemplateContext {
  /** Whether cursor is inside a {{ }} template */
  isInsideTemplate: boolean;
  /** Position of {{ in the string (-1 if not in template) */
  templateStart: number;
  /** Text typed after {{ (for filtering suggestions) */
  filterText: string;
}

/**
 * Result of inserting a suggestion
 */
export interface InsertionResult {
  /** New value with suggestion inserted */
  newValue: string;
  /** New cursor position after insertion */
  newCursorPosition: number;
}

export interface ArraySchemaDefinition {
  type: "array";
  items?: SimpleSchema;
}
