import { useState, useCallback } from "react";

/**
 * Custom hook for managing dialog/modal state
 * Provides consistent API across all dialog components
 *
 * @param initialState - Initial open/closed state (default: false)
 * @returns Dialog state and control functions
 *
 * @example
 * const inputsDialog = useDialogState();
 * <Dialog open={inputsDialog.isOpen} onOpenChange={inputsDialog.setIsOpen}>
 *   <Button onClick={inputsDialog.open}>Open</Button>
 * </Dialog>
 */
export function useDialogState(initialState = false) {
	const [isOpen, setIsOpen] = useState(initialState);

	const open = useCallback(() => setIsOpen(true), []);
	const close = useCallback(() => setIsOpen(false), []);
	const toggle = useCallback(() => setIsOpen((prev: boolean) => !prev), []);

	return {
		isOpen,
		setIsOpen,
		open,
		close,
		toggle,
	};
}
