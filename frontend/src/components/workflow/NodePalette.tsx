import { Clock, Flag, Globe, Play } from "lucide-react";
import type { DragEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NodeType } from "@/lib/workflow-types";

interface NodePaletteProps {
	className?: string;
}

const nodeDefinitions: Array<{
	type: NodeType;
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
	color: string;
}> = [
	{
		type: "start",
		label: "Start",
		description: "Workflow entry point",
		icon: Play,
		color: "text-green-600 bg-green-50 border-green-200",
	},
	{
		type: "api",
		label: "API Call",
		description: "Make HTTP requests",
		icon: Globe,
		color: "text-blue-600 bg-blue-50 border-blue-200",
	},
	{
		type: "wait",
		label: "Wait",
		description: "Add delays",
		icon: Clock,
		color: "text-purple-600 bg-purple-50 border-purple-200",
	},
	{
		type: "end",
		label: "End",
		description: "Workflow completion",
		icon: Flag,
		color: "text-red-600 bg-red-50 border-red-200",
	},
];

export function NodePalette({ className }: NodePaletteProps) {
	const handleDragStart = (event: DragEvent, nodeType: NodeType) => {
		event.dataTransfer.setData("application/reactflow", nodeType);
		event.dataTransfer.effectAllowed = "move";
	};

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-base">Node Palette</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{nodeDefinitions.map(
					({ type, label, description, icon: Icon, color }) => (
						<div
							key={type}
							draggable
							onDragStart={(e) => handleDragStart(e, type)}
							className={`
              flex items-center gap-3 p-3 border-2 rounded-lg cursor-move
              transition-all hover:shadow-md active:shadow-sm
              ${color}
            `}
						>
							<Icon className="w-5 h-5 flex-shrink-0" />
							<div className="flex-1 min-w-0">
								<div className="font-semibold text-sm">{label}</div>
								<div className="text-xs opacity-75 truncate">{description}</div>
							</div>
						</div>
					),
				)}

				<div className="pt-2 mt-2 border-t text-xs text-gray-500">
					💡 Drag nodes onto the canvas
				</div>
			</CardContent>
		</Card>
	);
}
