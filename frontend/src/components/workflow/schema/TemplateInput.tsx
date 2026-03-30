/**
 * TemplateInput - Input field with inline autocomplete for {{ }} templates
 * 
 * Shows a dropdown of available variables when cursor is inside {{ }}.
 * Supports keyboard navigation (up/down/enter/escape).
 */

import { useRef, useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useTemplateAutocomplete } from "@/hooks/useTemplateAutocomplete";
import { cn } from "@/lib/utils";
import type { VariableInfo } from "@/lib/schemaTypes";

interface TemplateInputProps {
    /** ID of the current node (for fetching available vars) - null if no suggestions needed */
    nodeId: string | null;
    /** Current value */
    value: string;
    /** Called when value changes */
    onChange: (value: string) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Additional className */
    className?: string;
    /** Disable input */
    disabled?: boolean;
}

/**
 * Color mapping for types in suggestions
 */
const typeColorMap: Record<string, string> = {
    string: "text-green-600 dark:text-green-400",
    number: "text-blue-600 dark:text-blue-400",
    boolean: "text-purple-600 dark:text-purple-400",
    any: "text-gray-500 dark:text-gray-400",
};

function getTypeColor(type: string): string {
    const baseType = type.replace("[]", "").replace("?", "");
    return typeColorMap[baseType] || typeColorMap.any;
}

export function TemplateInput({
    nodeId,
    value,
    onChange,
    placeholder,
    className,
    disabled = false,
}: TemplateInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

    const {
        context,
        suggestions,
        selectSuggestion,
        handleChange,
        handleSelect,
        setValueInternal,
    } = useTemplateAutocomplete(nodeId, value, onChange);

    // Sync external value changes (without triggering onChange back to parent)
    useEffect(() => {
        setValueInternal(value);
    }, [value, setValueInternal]);

    // Reset selected index when suggestions change
    useEffect(() => {
        setSelectedIndex(0);
    }, [suggestions]);

    // Calculate dropdown position based on cursor
    useEffect(() => {
        if (context.isInsideTemplate && inputRef.current) {
            const input = inputRef.current;
            const rect = input.getBoundingClientRect();

            // Approximate cursor position (rough estimate)
            const charWidth = 8; // Average character width in pixels
            const cursorX = charWidth * context.templateStart;

            setDropdownPosition({
                top: rect.height + 4,
                left: Math.min(cursorX, rect.width - 200), // Keep dropdown visible
            });
        }
    }, [context.isInsideTemplate, context.templateStart]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (!context.isInsideTemplate || suggestions.length === 0) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1));
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex((i) => Math.max(i - 1, 0));
                    break;
                case "Enter":
                case "Tab":
                    if (suggestions[selectedIndex]) {
                        e.preventDefault();
                        selectSuggestion(suggestions[selectedIndex].path);
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    inputRef.current?.blur();
                    break;
            }
        },
        [context.isInsideTemplate, suggestions, selectedIndex, selectSuggestion]
    );

    // Handle suggestion click
    const handleSuggestionClick = useCallback(
        (variable: VariableInfo) => {
            selectSuggestion(variable.path);
            inputRef.current?.focus();
        },
        [selectSuggestion]
    );

    const showDropdown = context.isInsideTemplate && suggestions.length > 0;

    return (
        <div className="relative">
            <Input
                ref={inputRef}
                value={value}
                onChange={handleChange}
                onSelect={handleSelect}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn("font-mono text-sm", className)}
                disabled={disabled}
                autoComplete="off"
            />

            {/* Suggestions Dropdown */}
            {showDropdown && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto min-w-[200px]"
                    style={{
                        top: dropdownPosition.top,
                        left: dropdownPosition.left,
                    }}
                >
                    {suggestions.map((variable, index) => (
                        <button
                            key={variable.path}
                            type="button"
                            className={cn(
                                "w-full px-3 py-1.5 text-left text-sm flex items-center justify-between gap-2 hover:bg-accent",
                                index === selectedIndex && "bg-accent"
                            )}
                            onMouseEnter={() => setSelectedIndex(index)}
                            onClick={() => handleSuggestionClick(variable)}
                        >
                            <span className="font-mono truncate">{variable.path}</span>
                            <span className={cn("text-xs", getTypeColor(variable.type))}>
                                {variable.type}
                            </span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
