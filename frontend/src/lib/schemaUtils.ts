/**
 * Schema Utilities
 *
 * Functions for working with simple schemas, template autocomplete,
 * and variable extraction from workflow nodes.
 */

import type {
  SimpleSchema,
  SchemaType,
  SchemaValue,
  VariableInfo,
  SourceNodeVariables,
  TemplateContext,
  InsertionResult,
} from "./schemaTypes";
import type { WorkflowNode, WorkflowEdge } from "./workflow-types";

/**
 * Check if a schema value is a nested object (not a type string)
 */
function isNestedSchema(value: SchemaValue): value is SimpleSchema {
  return typeof value === "object" && value !== null;
}

/**
 * Extract all variable paths from a schema with their types
 *
 * @param schema - The output schema to extract from
 * @param nodeLabel - Label of the node (used as prefix)
 * @returns Array of VariableInfo with full paths
 *
 * @example
 * extractVariablesFromSchema({ city: "string", data: { temp: "number" } }, "Start")
 * // Returns:
 * // [
 * //   { path: "Start.city", type: "string" },
 * //   { path: "Start.data.temp", type: "number" }
 * // ]
 */
export function extractVariablesFromSchema(
  schema: SimpleSchema | undefined,
  nodeLabel: string,
): VariableInfo[] {
  if (!schema || typeof schema !== "object") return [];

  const variables: VariableInfo[] = [];

  function extractRecursive(obj: SimpleSchema, prefix: string): void {
    for (const [key, value] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "string") {
        // Simple type string - add to results
        variables.push({
          path: `${nodeLabel}.${path}`,
          type: value as SchemaType,
        });
      } else if (
        value &&
        typeof value === "object" &&
        "type" in value &&
        value.type === "array" &&
        "items" in value
      ) {
        // ArraySchemaDefinition format: { type: "array", items: {...} }
        // Show the field as object[] type
        variables.push({
          path: `${nodeLabel}.${path}`,
          type: "object[]" as SchemaType,
        });
        // Also extract nested item fields with [].fieldName notation
        if (value.items && typeof value.items === "object") {
          extractRecursive(value.items as SimpleSchema, `${path}[]`);
        }
      } else if (isNestedSchema(value)) {
        // Regular nested object - show the field and recurse
        variables.push({
          path: `${nodeLabel}.${path}`,
          type: "object" as SchemaType,
        });
        extractRecursive(value, path);
      }
    }
  }

  extractRecursive(schema, "");
  return variables;
}

/**
 * Get all available variables for a target node from its incoming edges
 *
 * @param targetNodeId - ID of the node to get variables for
 * @param nodes - All nodes in the workflow
 * @param edges - All edges in the workflow
 * @returns Array of source nodes with their available variables
 */
export function getAvailableVariables(
  targetNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): SourceNodeVariables[] {
  const results: SourceNodeVariables[] = [];

  // Find all edges leading INTO targetNodeId
  const incomingEdges = edges.filter((edge) => edge.target === targetNodeId);

  // For each incoming edge, get the source node's output schema
  for (const edge of incomingEdges) {
    const sourceNode = nodes.find((n) => n.id === edge.source);
    if (!sourceNode) continue;

    const nodeLabel = sourceNode.data.label;
    const outputSchema = sourceNode.data.outputSchema as
      | SimpleSchema
      | undefined;

    const variables = extractVariablesFromSchema(outputSchema, nodeLabel);

    // Only add if there are variables
    if (variables.length > 0) {
      results.push({
        nodeLabel,
        variables,
      });
    }
  }

  return results;
}

/**
 * Get flattened list of all available variable paths
 * Useful for autocomplete
 */
export function getFlatVariables(
  targetNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
): VariableInfo[] {
  const grouped = getAvailableVariables(targetNodeId, nodes, edges);
  return grouped.flatMap((group) => group.variables);
}

/**
 * Analyze cursor position to determine if inside a {{ }} template
 *
 * @param value - The full input value
 * @param cursorPosition - Current cursor position
 * @returns Template context with position and filter text
 */
export function analyzeTemplateContext(
  value: string,
  cursorPosition: number,
): TemplateContext {
  // Get text before cursor
  const textBeforeCursor = value.slice(0, cursorPosition);

  // Find the LAST {{ before cursor
  const lastOpenIndex = textBeforeCursor.lastIndexOf("{{");

  if (lastOpenIndex === -1) {
    // No {{ found - not in template
    return { isInsideTemplate: false, templateStart: -1, filterText: "" };
  }

  // Check if there's a }} between {{ and cursor
  const textAfterOpen = textBeforeCursor.slice(lastOpenIndex);
  const hasClosing = textAfterOpen.includes("}}");

  if (hasClosing) {
    // Template is already closed
    return { isInsideTemplate: false, templateStart: -1, filterText: "" };
  }

  // Extract filter text (between {{ and cursor)
  const filterText = textAfterOpen.slice(2);

  return {
    isInsideTemplate: true,
    templateStart: lastOpenIndex,
    filterText,
  };
}

/**
 * Insert a suggestion into the template, replacing partial text
 *
 * @param currentValue - Current input value
 * @param cursorPosition - Current cursor position
 * @param suggestion - Full suggestion to insert (e.g., "StartNode.city")
 * @returns New value and cursor position
 */
export function insertSuggestion(
  currentValue: string,
  cursorPosition: number,
  suggestion: string,
): InsertionResult {
  const context = analyzeTemplateContext(currentValue, cursorPosition);

  if (!context.isInsideTemplate) {
    return { newValue: currentValue, newCursorPosition: cursorPosition };
  }

  // Build new value: (before {{) + {{suggestion}} + (after cursor, skipping any existing }})
  const before = currentValue.slice(0, context.templateStart);
  let after = currentValue.slice(cursorPosition);

  // Check if there's already a }} right after cursor and skip it
  // This handles the case where user types {{ and there was already }}
  const closingBracesMatch = after.match(/^(\s*\}+)/);
  if (closingBracesMatch) {
    // Skip all closing braces that are right after cursor
    after = after.slice(closingBracesMatch[0].length);
  }

  const newValue = `${before}{{${suggestion}}}${after}`;

  // Place cursor after the closing }}
  const newCursorPosition = before.length + 2 + suggestion.length + 2;

  return { newValue, newCursorPosition };
}

/**
 * Filter suggestions by the typed filter text
 * Case-insensitive partial matching
 */
export function filterSuggestions(
  filterText: string,
  variables: VariableInfo[],
): VariableInfo[] {
  if (!filterText.trim()) {
    return variables;
  }

  const lowerFilter = filterText.toLowerCase();
  return variables.filter((v) => v.path.toLowerCase().includes(lowerFilter));
}

/**
 * Get type display label for UI
 */
export function getTypeDisplayLabel(type: SchemaType): string {
  if (type.endsWith("[]")) {
    return `${type.slice(0, -2)}[]`;
  }
  if (type.endsWith("?")) {
    return `${type.slice(0, -1)}?`;
  }
  return type;
}

/**
 * Validate a type string is a valid SchemaType
 */
export function isValidSchemaType(value: string): value is SchemaType {
  const validTypes = [
    "string",
    "number",
    "boolean",
    "any",
    "string[]",
    "number[]",
    "boolean[]",
    "object",
    "object[]",
    "any[]",
    "string?",
    "number?",
    "boolean?",
    "any?",
  ];
  return validTypes.includes(value);
}

/**
 * Get all supported type options for dropdown
 */
export function getSchemaTypeOptions(): { value: SchemaType; label: string }[] {
  return [
    { value: "string", label: "String" },
    { value: "number", label: "Number" },
    { value: "boolean", label: "Boolean" },
    { value: "any", label: "Any" },
    { value: "string[]", label: "String Array" },
    { value: "number[]", label: "Number Array" },
    { value: "boolean[]", label: "Boolean Array" },
    { value: "object", label: "Object" },
    { value: "object[]", label: "Object Array" },
    { value: "string?", label: "String (Optional)" },
    { value: "number?", label: "Number (Optional)" },
  ];
}
