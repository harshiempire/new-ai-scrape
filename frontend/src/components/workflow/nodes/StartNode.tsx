import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Play } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-types";

// @ts-expect-error - React Flow NodeProps generic constraint issue
export function StartNode({ data: dataUntyped, selected }: NodeProps<WorkflowNodeData>) {
  const data = dataUntyped as WorkflowNodeData;
	return (
		<div
			className={cn(
				"px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md transition-all",
				selected ? "border-green-500 shadow-lg" : "border-green-300",
			)}
		>
			<div className="flex items-center gap-2 mb-1">
				<Play className="w-4 h-4 text-green-600 fill-green-600" />
				<div className="font-semibold text-green-900">{data.label}</div>
			</div>
			<div className="text-xs text-gray-500">Workflow entry point</div>

			<Handle type="source" position={Position.Bottom} className="w-3 h-3" />
		</div>
	);
}
