import { useCallback, useEffect, useState } from "react";
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow-types";
import { useDebounce } from "./useDebounce";

interface UseWorkflowSaveOptions {
	workflowId: string;
	onSave: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => Promise<void>;
	autoSaveDelay?: number;
}

export function useWorkflowSave({
	workflowId: _workflowId,
	onSave,
	autoSaveDelay = 1000,
}: UseWorkflowSaveOptions) {
	// Load from localStorage or default to true
	const [autoSaveEnabled, setAutoSaveEnabled] = useState(() => {
		const saved = localStorage.getItem("workflow-autosave-enabled");
		return saved !== null ? JSON.parse(saved) : true;
	});

	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [pendingSave, setPendingSave] = useState<{
		nodes: WorkflowNode[];
		edges: WorkflowEdge[];
	} | null>(null);

	// Persist auto-save setting
	useEffect(() => {
		localStorage.setItem(
			"workflow-autosave-enabled",
			JSON.stringify(autoSaveEnabled),
		);
	}, [autoSaveEnabled]);

	const handleSave = useCallback(
		async (nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
			setIsSaving(true);
			try {
				await onSave(nodes, edges);
				setHasUnsavedChanges(false);
			} catch (error) {
				console.error("Failed to save workflow:", error);
				// Keep hasUnsavedChanges true on error
			} finally {
				setIsSaving(false);
			}
		},
		[onSave],
	);

	// Debounced auto-save
	const debouncedSave = useDebounce(
		(nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
			if (autoSaveEnabled && hasUnsavedChanges) {
				handleSave(nodes, edges);
			}
		},
		autoSaveDelay,
	);

	const triggerChange = useCallback(
		(nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
			setHasUnsavedChanges(true);
			setPendingSave({ nodes, edges });

			if (autoSaveEnabled) {
				debouncedSave(nodes, edges);
			}
		},
		[autoSaveEnabled, debouncedSave],
	);

	const handleManualSave = useCallback(() => {
		if (pendingSave) {
			handleSave(pendingSave.nodes, pendingSave.edges);
		}
	}, [pendingSave, handleSave]);

	const toggleAutoSave = useCallback(
		(enabled: boolean) => {
			setAutoSaveEnabled(enabled);

			// If turning on auto-save and there are unsaved changes, save immediately
			if (enabled && hasUnsavedChanges && pendingSave) {
				handleSave(pendingSave.nodes, pendingSave.edges);
			}
		},
		[hasUnsavedChanges, pendingSave, handleSave],
	);

	return {
		autoSaveEnabled,
		toggleAutoSave,
		hasUnsavedChanges,
		isSaving,
		triggerChange,
		handleManualSave,
	};
}
