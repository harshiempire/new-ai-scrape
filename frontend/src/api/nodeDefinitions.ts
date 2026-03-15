import { api } from "./index";

export interface ValidationRule {
  field: string;
  type: "required" | "pattern" | "min" | "max" | "custom";
  value?: any;
  message: string;
}

export interface DisplayField {
  field: string;
  type: "text" | "badge" | "formatted";
  label?: string;
  format?: string;
  truncate?: boolean;
  colorMap?: Record<string, string>;
}

export interface VisualConfig {
  handles: {
    inputs: boolean;
    outputs: boolean;
  };
  subtitle?: string;
  displayFields?: DisplayField[];
}

export interface NodeDefinition {
  type: string;
  label: string;
  description: string;
  category: "trigger" | "action" | "logic" | "output";
  icon: string;
  color: "green" | "blue" | "purple" | "red" | "amber" | "gray";
  propsSchema: Record<string, any>;
  defaultProps?: Record<string, any>;
  validationRules?: ValidationRule[];
  visualConfig: VisualConfig;
}

export interface NodeDefinitionsResponse {
  success: boolean;
  data: NodeDefinition[];
}

export async function getNodeDefinitions(): Promise<NodeDefinition[]> {
  const res = await api.get<NodeDefinition[]>("/node-definitions");
  return res.data;
}

export async function getNodeDefinitionByType(type: string): Promise<NodeDefinition | null> {
  try {
    const res = await api.get<NodeDefinition>(`/node-definitions/${type}`);
    return res.data;
  } catch {
    return null;
  }
}

