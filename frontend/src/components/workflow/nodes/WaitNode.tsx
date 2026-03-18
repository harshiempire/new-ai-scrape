import { Handle, type NodeProps, Position } from "@xyflow/react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowNodeData } from "@/lib/workflow-types";

// @ts-expect-error - React Flow NodeProps generic constraint issue
export function WaitNode({ data: dataUntyped, selected }: NodeProps<WorkflowNodeData>) {
	const data = dataUntyped as WorkflowNodeData;
	const duration = data.props?.duration || 1000;
	const durationInSeconds = (duration / 1000).toFixed(1);

	return (
		<div
			className={cn(
				"px-4 py-3 rounded-lg border-2 min-w-[180px] bg-white dark:bg-slate-800 shadow-md transition-all",
				selected ? "border-purple-500 shadow-lg" : "border-purple-300 dark:border-purple-600",
			)}
		>
			<Handle type="target" position={Position.Top} className="w-3 h-3" />

			<div className="flex items-center gap-2 mb-1">
				<Clock className="w-4 h-4 text-purple-600" />
				<div className="font-semibold text-purple-900 dark:text-purple-400">{data.label}</div>
			</div>

			<div className="text-xs text-muted-foreground">Delay: {durationInSeconds}s</div>

			<Handle type="source" position={Position.Bottom} className="w-3 h-3" />
		</div>
	);
}
