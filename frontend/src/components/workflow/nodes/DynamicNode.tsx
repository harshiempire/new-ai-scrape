import { Handle, type NodeProps, Position } from "@xyflow/react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-types";
import { useNodeDefinitionByType } from "@/hooks/useNodeDefinitions";
import { getIcon, getColorClasses } from "@/lib/iconRegistry";
import type { DisplayField } from "@/api/nodeDefinitions";

/**
 * Infer display fields from propsSchema using x-showOnNode extension
 * This eliminates the need for explicit displayFields in visualConfig
 */
function inferDisplayFieldsFromSchema(propsSchema: Record<string, any>): DisplayField[] {
    const properties = propsSchema?.properties || {};
    const fields: DisplayField[] = [];

    for (const [key, schema] of Object.entries(properties) as [string, any][]) {
        // Only show fields with x-showOnNode: true
        if (!schema["x-showOnNode"]) continue;

        // Infer type from schema
        if (schema.enum) {
            // Enum → Badge
            fields.push({
                field: `props.${key}`,
                type: "badge",
                colorMap: schema["x-colorMap"],
            });
        } else if (schema.type === "number" || schema["x-format"]) {
            // Number with format → Formatted
            fields.push({
                field: `props.${key}`,
                type: "formatted",
                label: schema["x-label"],
                format: schema["x-format"] || "{value}",
            });
        } else {
            // String → Text
            fields.push({
                field: `props.${key}`,
                type: "text",
                truncate: true,
            });
        }
    }

    return fields;
}

/**
 * DynamicNode - A single component that renders any node type
 * based on metadata from the backend (visualConfig + propsSchema)
 */
// @ts-expect-error - React Flow NodeProps generic constraint issue  
export function DynamicNode({ data: dataUntyped, selected, type }: NodeProps<WorkflowNodeData>) {
    const data = dataUntyped as WorkflowNodeData;
    const nodeType = typeof type === "string" ? type : String(type);
    const { data: nodeDef, isLoading } = useNodeDefinitionByType(nodeType);

    // Loading state
    if (isLoading || !nodeDef) {
        return (
            <div className="px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white dark:bg-slate-800 shadow-md border-gray-300">
                <div className="animate-pulse">Loading...</div>
            </div>
        );
    }

    // Get icon and colors from metadata
    const Icon = getIcon(nodeDef.icon);
    const colorClasses = getColorClasses(nodeDef.color);
    const visualConfig = nodeDef.visualConfig;

    // Auto-infer displayFields from schema, fallback to explicit config
    const inferredFields = inferDisplayFieldsFromSchema(nodeDef.propsSchema);
    const displayFields =
        inferredFields.length > 0 ? inferredFields : (visualConfig?.displayFields ?? []);

    // Helper to get nested value from data
    const getValue = (path: string): any => {
        const parts = path.split(".");
        let current: any = data;
        for (const part of parts) {
            current = current?.[part];
        }
        return current;
    };

    // Render a display field based on its type
    const renderDisplayField = (field: DisplayField, index: number) => {
        const value = getValue(field.field);

        switch (field.type) {
            case "badge": {
                const badgeColor = field.colorMap?.[value] || "gray";
                const badgeColorClasses: Record<string, string> = {
                    blue: "text-blue-600 bg-blue-50",
                    green: "text-green-600 bg-green-50",
                    amber: "text-amber-600 bg-amber-50",
                    red: "text-red-600 bg-red-50",
                    gray: "text-gray-600 bg-gray-50",
                };
                return (
                    <span
                        key={index}
                        className={cn(
                            "px-1.5 py-0.5 rounded font-semibold text-[10px]",
                            badgeColorClasses[badgeColor] || badgeColorClasses.gray
                        )}
                    >
                        {value || "N/A"}
                    </span>
                );
            }

            case "formatted": {
                let formatted = field.format || "{value}";
                // Handle division: {value/1000}
                formatted = formatted.replace(/\{value\/(\d+)\}/g, (_: string, div: string) =>
                    value ? (Number(value) / Number(div)).toFixed(1) : "0"
                );
                // Handle simple value replacement
                formatted = formatted.replace("{value}", value ?? "");
                return (
                    <span key={index} className="text-muted-foreground text-xs">
                        {field.label} {formatted}
                    </span>
                );
            }

            case "text":
            default:
                return (
                    <span
                        key={index}
                        className={cn(
                            "text-muted-foreground text-xs",
                            field.truncate && "truncate flex-1"
                        )}
                        title={field.truncate ? String(value) : undefined}
                    >
                        {value || "Not configured"}
                    </span>
                );
        }
    };

    return (
        <div
            className={cn(
                "px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white dark:bg-slate-800 shadow-md transition-all",
                selected ? colorClasses.selectedBorder : colorClasses.border
            )}
        >
            {/* Input Handle */}
            {visualConfig?.handles.inputs && (
                <Handle type="target" position={Position.Top} className="w-3 h-3" />
            )}

            {/* Header: Icon + Label */}
            <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("w-4 h-4", colorClasses.icon)} />
                <div className={cn("font-semibold", colorClasses.text)}>
                    {data.label}
                </div>
            </div>

            {/* Subtitle (for simple nodes) or Display Fields */}
            {visualConfig?.subtitle && displayFields.length === 0 && (
                <div className="text-xs text-muted-foreground">
                    {visualConfig.subtitle}
                </div>
            )}

            {displayFields.length > 0 && (
                <div className="text-xs flex items-center gap-1.5">
                    {displayFields.map((field, idx) => renderDisplayField(field, idx))}
                </div>
            )}

            {/* Output Handle */}
            {visualConfig?.handles.outputs && (
                <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
            )}
        </div>
    );
}
