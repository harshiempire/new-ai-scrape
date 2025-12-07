import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type {TemplateSuggestion} from "@/lib/types.ts";
import type {WorkflowEdge, WorkflowNode} from "@/lib/workflow-types.ts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvailableVariables(
    targetNodeId: string,
    nodes: WorkflowNode[],
    edges: WorkflowEdge[]
) {
    const suggestions: TemplateSuggestion[] = [];

    // Step 1: Find all incoming edges to this node
    const incomingEdges = edges.filter(e => e.target === targetNodeId);

    // Step 2: For each edge, get the source node
    for (const edge of incomingEdges) {
        const sourceNode = nodes.find(n => n.id === edge.source);
        if (!sourceNode) continue;

        // Step 3: Extract variables from outputSchema
        const variables = extractVariablesFromSchema(
            sourceNode.data.outputSchema,
            sourceNode.data.label
        );

        suggestions.push({
            nodeLabel: sourceNode.data.label,
            nodeId: sourceNode.id,
            variables
        });
    }

    return suggestions;
}

export function extractVariablesFromSchema(
    schema: Record<string, any> | undefined,
    nodeLabel: string,
    prefix: string = ""
): Array<{ path: string; type: string; fullPath: string }> {
    if (!schema) return [];

    const variables: Array<{ path: string; type: string; fullPath: string }> = [];

    for (const [key, value] of Object.entries(schema)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const type = typeof value === "string" ? value : "object";

        variables.push({
            path,
            type,
            fullPath: `{{${nodeLabel}.${path}}}`
        });

        // If nested object, recurse
        if (typeof value === "object" && value !== null && !Array.isArray(value)) {
            variables.push(...extractVariablesFromSchema(value, nodeLabel, path));
        }
    }

    return variables;
}

export function isLabelUnique(
    label: string,
    currentNodeId: string,
    nodes: WorkflowNode[]
): boolean {
    return !nodes.some(n => n.id !== currentNodeId && n.data.label === label);
}

export function generateUniqueLabel(baseLabel: string, nodes: WorkflowNode[]): string {
    let label = baseLabel;
    let counter = 1;

    while (nodes.some(n => n.data.label === label)) {
        label = `${baseLabel} ${counter}`;
        counter++;
    }

    return label;
}