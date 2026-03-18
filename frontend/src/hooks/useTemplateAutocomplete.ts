/**
 * Hook for template autocomplete functionality
 *
 * Provides suggestions when cursor is inside {{ }} and handles
 * insertion of selected suggestions.
 */

import { useState, useCallback, useMemo } from "react";
import { useFlatVariables } from "./useAvailableVariables";
import {
  analyzeTemplateContext,
  insertSuggestion,
  filterSuggestions,
} from "@/lib/schemaUtils";
import type { VariableInfo, TemplateContext } from "@/lib/schemaTypes";

interface UseTemplateAutocompleteReturn {
  /** Current input value */
  value: string;
  /** Set input value (calls onChange) */
  setValue: (value: string) => void;
  /** Set input value internally (doesn't call onChange) */
  setValueInternal: (value: string) => void;
  /** Current cursor position */
  cursorPosition: number;
  /** Set cursor position */
  setCursorPosition: (pos: number) => void;
  /** Template context (whether inside {{, filter text, etc.) */
  context: TemplateContext;
  /** Filtered suggestions based on typed text */
  suggestions: VariableInfo[];
  /** Insert a suggestion and update value/cursor */
  selectSuggestion: (suggestion: string) => void;
  /** Handle input change event */
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle selection/cursor change */
  handleSelect: (e: React.SyntheticEvent<HTMLInputElement>) => void;
}

/**
 * Hook for managing template autocomplete state
 *
 * @param nodeId - ID of the current node (for fetching available vars)
 * @param initialValue - Initial input value
 * @param onChange - Callback when value changes
 */
export function useTemplateAutocomplete(
  nodeId: string | null,
  initialValue: string = "",
  onChange?: (value: string) => void,
): UseTemplateAutocompleteReturn {
  const [value, setValueInternal] = useState(initialValue);
  const [cursorPosition, setCursorPosition] = useState(initialValue.length);

  // Get all available variables for this node
  const allVariables = useFlatVariables(nodeId);

  // Analyze current template context
  const context = useMemo(
    () => analyzeTemplateContext(value, cursorPosition),
    [value, cursorPosition],
  );

  // Filter suggestions based on typed text
  const suggestions = useMemo(() => {
    if (!context.isInsideTemplate) return [];
    return filterSuggestions(context.filterText, allVariables);
  }, [context.isInsideTemplate, context.filterText, allVariables]);

  // Update value and notify parent
  const setValue = useCallback(
    (newValue: string) => {
      setValueInternal(newValue);
      onChange?.(newValue);
    },
    [onChange],
  );

  // Handle suggestion selection
  const selectSuggestion = useCallback(
    (suggestion: string) => {
      const result = insertSuggestion(value, cursorPosition, suggestion);
      setValueInternal(result.newValue);
      setCursorPosition(result.newCursorPosition);
      onChange?.(result.newValue);
    },
    [value, cursorPosition, onChange],
  );

  // Handle input change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValueInternal(newValue);
      onChange?.(newValue);
      // Cursor position is updated in handleSelect
    },
    [onChange],
  );

  // Handle cursor position change
  const handleSelect = useCallback(
    (e: React.SyntheticEvent<HTMLInputElement>) => {
      const input = e.target as HTMLInputElement;
      setCursorPosition(input.selectionStart ?? input.value.length);
    },
    [],
  );

  return {
    value,
    setValue,
    setValueInternal,
    cursorPosition,
    setCursorPosition,
    context,
    suggestions,
    selectSuggestion,
    handleChange,
    handleSelect,
  };
}
