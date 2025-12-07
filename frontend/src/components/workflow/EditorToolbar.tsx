import { AlertCircle, Play, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface EditorToolbarProps {
	autoSaveEnabled: boolean;
	onToggleAutoSave: (enabled: boolean) => void;
	hasUnsavedChanges: boolean;
	onManualSave: () => void;
	isSaving?: boolean;
	className?: string;
	onExecute?: () => void;
	isExecuting?: boolean;
}

export function EditorToolbar({
	autoSaveEnabled,
	onToggleAutoSave,
	hasUnsavedChanges,
	onManualSave,
	isSaving = false,
	className,
	onExecute,
	isExecuting = false,
}: EditorToolbarProps) {
	return (
		<div
			className={`flex items-center justify-between p-3 border-b bg-white ${className}`}
		>
			<div className="flex items-center gap-4">
				{/* Auto-save toggle */}
				<div className="flex items-center gap-2">
					<input
						type="checkbox"
						id="auto-save-toggle"
						checked={autoSaveEnabled}
						onChange={(e) => onToggleAutoSave(e.target.checked)}
						className="w-4 h-4 rounded border-gray-300"
					/>
					<Label
						htmlFor="auto-save-toggle"
						className="text-sm font-medium cursor-pointer"
					>
						Auto-save
					</Label>
				</div>

				{/* Unsaved changes indicator */}
				{!autoSaveEnabled && hasUnsavedChanges && (
					<div className="flex items-center gap-2 text-amber-600 text-sm">
						<AlertCircle className="w-4 h-4" />
						<span>Unsaved changes</span>
					</div>
				)}

				{/* Saving indicator */}
				{isSaving && <div className="text-sm text-gray-500">Saving...</div>}
			</div>

			{/* Action buttons */}
		<div className="flex items-center gap-2">
			{/* Execute button */}
			{onExecute && (
				<Button
					onClick={onExecute}
					disabled={isExecuting}
					size="sm"
					variant="default"
					className="bg-green-600 hover:bg-green-700"
				>
					<Play className="w-4 h-4 mr-2" />
					{isExecuting ? "Executing..." : "Execute"}
				</Button>
			)}

			{/* Manual save button (only shown when auto-save is off) */}
			{!autoSaveEnabled && (
				<Button
					onClick={onManualSave}
					disabled={!hasUnsavedChanges || isSaving}
					size="sm"
					variant="outline"
				>
					<Save className="w-4 h-4 mr-2" />
					Save Workflow
				</Button>
			)}
		</div>
	</div>
);
}
