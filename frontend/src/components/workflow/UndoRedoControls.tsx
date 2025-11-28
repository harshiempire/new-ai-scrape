import { Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UndoRedoControlsProps {
	canUndo: boolean;
	canRedo: boolean;
	onUndo: () => void;
	onRedo: () => void;
}

export function UndoRedoControls({
	canUndo,
	canRedo,
	onUndo,
	onRedo,
}: UndoRedoControlsProps) {
	return (
		<div className="flex items-center gap-1 bg-white rounded-lg border shadow-sm p-1">
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={onUndo}
				disabled={!canUndo}
				title="Undo (Cmd/Ctrl+Z)"
			>
				<Undo2 className="h-4 w-4" />
			</Button>
			<Button
				variant="ghost"
				size="icon-sm"
				onClick={onRedo}
				disabled={!canRedo}
				title="Redo (Cmd/Ctrl+Shift+Z)"
			>
				<Redo2 className="h-4 w-4" />
			</Button>
		</div>
	);
}
