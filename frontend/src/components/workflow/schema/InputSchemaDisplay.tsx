/**
 * InputSchemaDisplay - Read-only display of auto-inferred input schema
 * 
 * Shows variables available from connected source nodes,
 * grouped by source node label.
 */

import { Label } from "@/components/ui/label";
import { useAvailableVariables } from "@/hooks/useAvailableVariables";
import { Badge } from "@/components/ui/badge";

interface InputSchemaDisplayProps {
    /** ID of the current node */
    nodeId: string;
}

/**
 * Color mapping for types
 */
const typeColorMap: Record<string, string> = {
    string: "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
    number: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    boolean: "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300",
    object: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
    any: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function getTypeColor(type: string): string {
    // Handle arrays and optionals
    const baseType = type.replace("[]", "").replace("?", "");
    return typeColorMap[baseType] || typeColorMap.any;
}

export function InputSchemaDisplay({ nodeId }: InputSchemaDisplayProps) {
    const groupedVariables = useAvailableVariables(nodeId);

    return (
        <div className="space-y-3">
            <Label className="text-sm font-medium">Input Schema</Label>
            <p className="text-xs text-muted-foreground">
                Auto-inferred from connected nodes
            </p>

            {groupedVariables.length === 0 ? (
                <div className="text-sm text-muted-foreground italic py-2">
                    No inputs connected
                </div>
            ) : (
                <div className="space-y-3">
                    {groupedVariables.map((group) => (
                        <div key={group.nodeLabel} className="space-y-1">
                            <div className="text-xs font-medium text-muted-foreground">
                                From: {group.nodeLabel}
                            </div>
                            <div className="pl-2 border-l-2 border-muted space-y-1">
                                {group.variables.map((variable) => (
                                    <div
                                        key={variable.path}
                                        className="flex items-center gap-2 text-sm"
                                    >
                                        <span className="font-mono text-xs">
                                            {variable.path.split(".").slice(1).join(".")}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className={`text-[10px] px-1.5 py-0 ${getTypeColor(variable.type)}`}
                                        >
                                            {variable.type}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
