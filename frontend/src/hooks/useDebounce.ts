import { useCallback, useEffect, useRef } from "react";

/**
 * Custom hook for debouncing function calls
 *
 * @param callback - Function to debounce
 * @param delay - Delay in milliseconds
 * @returns Debounced version of the callback
 */
export function useDebounce<T extends (...args: any[]) => void>(
	callback: T,
	delay: number,
): T {
	const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const callbackRef = useRef(callback);

	// Update callback ref when callback changes
	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, []);

	const debouncedCallback = useCallback(
		(...args: Parameters<T>) => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}

			timeoutRef.current = setTimeout(() => {
				callbackRef.current(...args);
			}, delay);
		},
		[delay],
	) as T;

	return debouncedCallback;
}
