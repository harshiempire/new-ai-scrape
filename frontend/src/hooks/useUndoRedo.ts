import { useCallback, useRef, useState } from "react";
import type { WorkflowNode, WorkflowEdge } from "@/lib/workflow-types";

interface HistoryState {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
}

interface UseUndoRedoOptions {
	maxHistorySize?: number;
	onStateChange?: (nodes: WorkflowNode[], edges: WorkflowEdge[]) => void;
}

export function useUndoRedo({
	maxHistorySize = 50,
	onStateChange,
}: UseUndoRedoOptions = {}) {
	const [history, setHistory] = useState<HistoryState[]>([]);
	const [currentIndex, setCurrentIndex] = useState(-1);
	const isApplyingHistory = useRef(false);

	// Check if undo/redo is available
	const canUndo = currentIndex > 0;
	const canRedo = currentIndex < history.length - 1;

	// Save current state to history
	const saveState = useCallback(
		(nodes: WorkflowNode[], edges: WorkflowEdge[]) => {
			// Don't save if we're applying a history state
			if (isApplyingHistory.current) return;

			setHistory((prev) => {
				// Remove any future states if we're not at the end
				const newHistory = prev.slice(0, currentIndex + 1);

				// Add new state
				const updatedHistory = [
					...newHistory,
					{ nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
				];

				// Limit history size
				if (updatedHistory.length > maxHistorySize) {
					updatedHistory.shift();
					return updatedHistory;
				}

				return updatedHistory;
			});

			setCurrentIndex((prev) => {
				const newIndex = Math.min(prev + 1, maxHistorySize - 1);
				return newIndex;
			});
		},
		[currentIndex, maxHistorySize],
	);

	// Undo to previous state
	const undo = useCallback(() => {
		if (!canUndo) return;

		const newIndex = currentIndex - 1;
		const state = history[newIndex];

		if (state) {
			isApplyingHistory.current = true;
			setCurrentIndex(newIndex);
			onStateChange?.(state.nodes, state.edges);
			// Reset flag after a brief delay
			setTimeout(() => {
				isApplyingHistory.current = false;
			}, 0);
		}
	}, [canUndo, currentIndex, history, onStateChange]);

	// Redo to next state
	const redo = useCallback(() => {
		if (!canRedo) return;

		const newIndex = currentIndex + 1;
		const state = history[newIndex];

		if (state) {
			isApplyingHistory.current = true;
			setCurrentIndex(newIndex);
			onStateChange?.(state.nodes, state.edges);
			// Reset flag after a brief delay
			setTimeout(() => {
				isApplyingHistory.current = false;
			}, 0);
		}
	}, [canRedo, currentIndex, history, onStateChange]);

	// Clear history
	const clearHistory = useCallback(() => {
		setHistory([]);
		setCurrentIndex(-1);
	}, []);

	return {
		saveState,
		undo,
		redo,
		canUndo,
		canRedo,
		clearHistory,
		historySize: history.length,
		currentIndex,
	};
}
