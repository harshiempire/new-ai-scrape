import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getLayoutedElements } from "@/lib/workflow-layout";
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow-types";

interface LayoutControlsProps {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	onLayout: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
	className?: string;
}

export function LayoutControls({
	nodes,
	edges,
	onLayout,
	className,
}: LayoutControlsProps) {
	const handleAutoLayout = () => {
		const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
			nodes,
			edges,
			"TB",
		);
		onLayout(layoutedNodes, layoutedEdges);
	};

	return (
		<Button
			onClick={handleAutoLayout}
			variant="outline"
			size="sm"
			className={className}
		>
			<LayoutGrid className="w-4 h-4 mr-2" />
			Auto Layout
		</Button>
	);
}
