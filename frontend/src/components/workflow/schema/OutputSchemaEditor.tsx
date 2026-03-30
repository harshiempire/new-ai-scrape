/**
 * OutputSchemaEditor - Form builder for defining output schema
 *
 * Allows users to add/remove fields and set their types.
 * Supports nested object[] schemas for array-of-objects patterns.
 */

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { SchemaFieldEditor } from "./SchemaFieldEditor";
import type {
    SimpleSchema,
    SchemaType,
    ArraySchemaDefinition,
} from "@/lib/schemaTypes";

interface OutputSchemaEditorProps {
    /** Current schema (can be undefined for new nodes) */
    schema: SimpleSchema | undefined;
    /** Called when schema changes */
    onChange: (schema: SimpleSchema) => void;
    /** Disable editing */
    disabled?: boolean;
}

export interface FieldEntry {
    id: string;
    name: string;
    type: SchemaType;
    itemFields?: FieldEntry[];
}

/**
 * Generate unique ID for field entries
 */
function generateId(): string {
    return `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Convert SimpleSchema to array of FieldEntry for editing
 */
function schemaToEntries(schema: SimpleSchema | undefined): FieldEntry[] {
    if (!schema) return [];
    return Object.entries(schema).map(([name, value]) => {
        // Handle { type: "array", items: {...} } format
        if (
            value &&
            typeof value === "object" &&
            "type" in value &&
            value.type === "array"
        ) {
            const arrDef = value as ArraySchemaDefinition;
            return {
                id: generateId(),
                name,
                type: "object[]" as SchemaType,
                itemFields: arrDef.items ? schemaToEntries(arrDef.items) : [],
            };
        }
        // Handle plain nested objects (not ArraySchemaDefinition)
        if (value && typeof value === "object" && !("type" in value)) {
            return {
                id: generateId(),
                name,
                type: "object" as SchemaType,
                itemFields: schemaToEntries(value as SimpleSchema),
            };
        }
        // Simple type string
        return {
            id: generateId(),
            name,
            type: (typeof value === "string" ? value : "any") as SchemaType,
        };
    });
}

/**
 * Convert array of FieldEntry back to SimpleSchema
 */
function entriesToSchema(entries: FieldEntry[]): SimpleSchema {
    const schema: SimpleSchema = {};
    for (const entry of entries) {
        if (entry.name.trim()) {
            if (entry.type === "object[]") {
                // Convert to { type: "array", items: {...} } format
                schema[entry.name.trim()] = {
                    type: "array",
                    items: entry.itemFields ? entriesToSchema(entry.itemFields) : {},
                };
            } else if (entry.type === "object") {
                // Plain object - save nested fields directly
                schema[entry.name.trim()] = entry.itemFields
                    ? entriesToSchema(entry.itemFields)
                    : {};
            } else {
                schema[entry.name.trim()] = entry.type;
            }
        }
    }
    return schema;
}

/**
 * Helper to deep update an entry at any nesting level
 */
function updateEntryById(
    entries: FieldEntry[],
    id: string,
    updater: (entry: FieldEntry) => FieldEntry,
): FieldEntry[] {
    return entries.map((entry) => {
        if (entry.id === id) {
            return updater(entry);
        }
        if (entry.itemFields) {
            return {
                ...entry,
                itemFields: updateEntryById(entry.itemFields, id, updater),
            };
        }
        return entry;
    });
}

/**
 * Helper to delete an entry at any nesting level
 */
function deleteEntryById(entries: FieldEntry[], id: string): FieldEntry[] {
    return entries
        .filter((entry) => entry.id !== id)
        .map((entry) => {
            if (entry.itemFields) {
                return {
                    ...entry,
                    itemFields: deleteEntryById(entry.itemFields, id),
                };
            }
            return entry;
        });
}

/**
 * Helper to add an item field to a parent entry
 */
function addItemFieldToEntry(
    entries: FieldEntry[],
    parentId: string,
): FieldEntry[] {
    return entries.map((entry) => {
        if (entry.id === parentId) {
            return {
                ...entry,
                itemFields: [
                    ...(entry.itemFields || []),
                    { id: generateId(), name: "", type: "string" as SchemaType },
                ],
            };
        }
        if (entry.itemFields) {
            return {
                ...entry,
                itemFields: addItemFieldToEntry(entry.itemFields, parentId),
            };
        }
        return entry;
    });
}

export function OutputSchemaEditor({
    schema,
    onChange,
    disabled = false,
}: OutputSchemaEditorProps) {
    // Convert schema to editable entries
    const [entries, setEntries] = useState<FieldEntry[]>(() =>
        schemaToEntries(schema),
    );

    // Update schema when entries change
    const updateSchema = useCallback(
        (newEntries: FieldEntry[]) => {
            setEntries(newEntries);
            onChange(entriesToSchema(newEntries));
        },
        [onChange],
    );

    // Add new top-level field
    const addField = useCallback(() => {
        const newEntry: FieldEntry = {
            id: generateId(),
            name: "",
            type: "string",
        };
        updateSchema([...entries, newEntry]);
    }, [entries, updateSchema]);

    // Update field name (works at any nesting level)
    const updateFieldName = useCallback(
        (id: string, name: string) => {
            updateSchema(updateEntryById(entries, id, (e) => ({ ...e, name })));
        },
        [entries, updateSchema],
    );

    // Update field type (works at any nesting level)
    const updateFieldType = useCallback(
        (id: string, type: SchemaType) => {
            updateSchema(
                updateEntryById(entries, id, (e) => ({
                    ...e,
                    type,
                    // Initialize itemFields when changing to object[]
                    itemFields: type === "object[]" ? e.itemFields || [] : undefined,
                })),
            );
        },
        [entries, updateSchema],
    );

    // Delete field (works at any nesting level)
    const deleteField = useCallback(
        (id: string) => {
            updateSchema(deleteEntryById(entries, id));
        },
        [entries, updateSchema],
    );

    // Add item field to a parent entry
    const addItemField = useCallback(
        (parentId: string) => {
            updateSchema(addItemFieldToEntry(entries, parentId));
        },
        [entries, updateSchema],
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Output Schema</Label>
                {!disabled && (
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={addField}
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add Field
                    </Button>
                )}
            </div>

            <p className="text-xs text-muted-foreground">
                Define what this node outputs
            </p>

            {entries.length === 0 ? (
                <div className="text-sm text-muted-foreground italic py-2">
                    No output schema defined
                </div>
            ) : (
                <div className="space-y-2">
                    {entries.map((entry) => (
                        <SchemaFieldEditor
                            key={entry.id}
                            fieldId={entry.id}
                            fieldName={entry.name}
                            fieldType={entry.type}
                            itemFields={entry.itemFields}
                            updateFieldName={updateFieldName}
                            updateFieldType={updateFieldType}
                            deleteField={deleteField}
                            addItemField={addItemField}
                            disabled={disabled}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
