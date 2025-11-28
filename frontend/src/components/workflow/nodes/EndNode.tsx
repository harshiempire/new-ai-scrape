import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-types";

// @ts-expect-error - React Flow NodeProps generic constraint issue
export function EndNode({ data: dataUntyped, selected }: NodeProps<WorkflowNodeData>) {
  const data = dataUntyped as WorkflowNodeData;
	return (
		<div
			className={cn(
				"px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white shadow-md transition-all",
				selected ? "border-red-500 shadow-lg" : "border-red-300",
			)}
		>
			<Handle type="target" position={Position.Top} className="w-3 h-3" />

			<div className="flex items-center gap-2 mb-1">
				<Flag className="w-4 h-4 text-red-600 fill-red-600" />
				<div className="font-semibold text-red-900">{data.label}</div>
			</div>
			<div className="text-xs text-gray-500">Workflow completion</div>
		</div>
	);
}
