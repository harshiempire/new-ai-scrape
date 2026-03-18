import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-types";

// @ts-expect-error - React Flow NodeProps generic constraint issue
export function APINode({ data: dataUntyped, selected, }: NodeProps<WorkflowNodeData>) {
  const data = dataUntyped as WorkflowNodeData;
  const method = data.props?.method || "GET";
  const url = data.props?.url || "";

  // Method-specific colors
  const methodColors: Record<string, string> = {
    GET: "text-blue-600 bg-blue-50",
    POST: "text-green-600 bg-green-50",
    PUT: "text-amber-600 bg-amber-50",
    DELETE: "text-red-600 bg-red-50",
  };

  return (
    <div
      className={cn(
        "px-4 py-3 rounded-lg border-2 min-w-[220px] bg-white dark:bg-slate-800 shadow-md transition-all",
        selected ? "border-blue-500 shadow-lg" : "border-blue-300 dark:border-blue-600"
      )}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-center gap-2 mb-2">
        <Globe className="w-4 h-4 text-blue-500" />
        <div className="font-semibold text-blue-900 dark:text-blue-400">{data.label}</div>
      </div>

      <div className="text-xs space-y-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              "px-1.5 py-0.5 rounded font-semibold text-[10px]",
              methodColors[method] || "text-muted-foreground bg-muted"
            )}
          >
            {method}
          </span>
          <span className="text-muted-foreground truncate flex-1" title={url}>
            {url || "No URL configured"}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}
