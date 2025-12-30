import { z } from "zod";

/**
 * Validation rule types for node properties
 * Used for both frontend UX validation and backend security validation
 */
export const ValidationRuleSchema = z.object({
  field: z.string(),
  type: z.enum(["required", "pattern", "min", "max", "custom"]),
  value: z.any().optional(),
  message: z.string(),
});

/**
 * Display field configuration for node visual rendering
 * Defines what data to show on the node canvas and how to format it
 */
export const DisplayFieldSchema = z.object({
  field: z.string(), // Path to value: "props.method", "props.duration"
  type: z.enum(["text", "badge", "formatted"]),
  label: z.string().optional(), // Prefix label: "Delay:"
  format: z.string().optional(), // Template: "{value}s" or "{value/1000}s"
  truncate: z.boolean().optional(), // Truncate long text
  colorMap: z.record(z.string(), z.string()).optional(), // Badge colors: { "GET": "blue" }
});

/**
 * Visual configuration for node canvas rendering
 * Defines handles (inputs/outputs) and what to display on the node
 */
export const VisualConfigSchema = z.object({
  handles: z.object({
    inputs: z.boolean(), // Show target handle (top)
    outputs: z.boolean(), // Show source handle (bottom)
  }),
  subtitle: z.string().optional(), // Template: "{{props.method}} {{props.url}}"
  displayFields: z.array(DisplayFieldSchema).optional(),
});

/**
 * Full node definition metadata
 * Provides all information needed for frontend to dynamically render:
 * - NodePalette items
 * - PropertyInspector forms (via JSON Schema + @rjsf/core)
 * - Node visual on canvas (via visualConfig)
 * - Validation rules
 */
export const NodeDefinitionMetaSchema = z.object({
  type: z.string(),
  label: z.string(),
  description: z.string(),
  category: z.enum(["trigger", "action", "logic", "output"]),
  icon: z.string(), // Lucide icon name (e.g., "Play", "Globe", "Clock", "Flag")
  color: z.enum(["green", "blue", "purple", "red", "amber", "gray"]),
  propsSchema: z.record(z.string(), z.any()), // JSON Schema object for @rjsf/core
  defaultProps: z.record(z.string(), z.any()).optional(),
  validationRules: z.array(ValidationRuleSchema).optional(),
  visualConfig: VisualConfigSchema, // NEW: Visual rendering config
});

export type NodeDefinitionMeta = z.infer<typeof NodeDefinitionMetaSchema>;
export type ValidationRule = z.infer<typeof ValidationRuleSchema>;
export type VisualConfig = z.infer<typeof VisualConfigSchema>;
export type DisplayField = z.infer<typeof DisplayFieldSchema>;

