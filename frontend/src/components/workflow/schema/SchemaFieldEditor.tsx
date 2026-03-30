/**
 * SchemaFieldEditor - Single row in the schema form builder
 *
 * Displays field name input, type dropdown, and delete button.
 * Supports nested fields for object[] types via recursion.
 */

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { getSchemaTypeOptions } from "@/lib/schemaUtils";
import type { SchemaType } from "@/lib/schemaTypes";
import type { FieldEntry } from "./OutputSchemaEditor";

interface SchemaFieldEditorProps {
  /** Unique ID for this field */
  fieldId: string;
  /** Field name */
  fieldName: string;
  /** Field type */
  fieldType: SchemaType;
  /** Item fields (for object[] types) */
  itemFields?: FieldEntry[];
  /** Update any field's name by ID (works at any depth) */
  updateFieldName: (id: string, name: string) => void;
  /** Update any field's type by ID (works at any depth) */
  updateFieldType: (id: string, type: SchemaType) => void;
  /** Delete any field by ID (works at any depth) */
  deleteField: (id: string) => void;
  /** Add item field to a parent by ID */
  addItemField: (parentId: string) => void;
  /** Disable editing (for read-only display) */
  disabled?: boolean;
}

const typeOptions = getSchemaTypeOptions();

export function SchemaFieldEditor({
  fieldId,
  fieldName,
  fieldType,
  itemFields,
  updateFieldName,
  updateFieldType,
  deleteField,
  addItemField,
  disabled = false,
}: SchemaFieldEditorProps) {
  return (
    <div>
      <div className="flex items-center gap-2">
        {/* Field Name Input */}
        <Input
          value={fieldName}
          onChange={(e) => updateFieldName(fieldId, e.target.value)}
          placeholder="field name"
          className="flex-1 h-8 text-sm"
          disabled={disabled}
        />

        {/* Type Dropdown */}
        <Select
          value={fieldType}
          onValueChange={(value) =>
            updateFieldType(fieldId, value as SchemaType)
          }
          disabled={disabled}
        >
          <SelectTrigger className="w-32 h-8 text-sm">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Delete Button */}
        {!disabled && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={() => deleteField(fieldId)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Nested fields for object[] type */}
      {(fieldType === "object[]" || fieldType === "object") && (
        <div className="ml-6 mt-2 pl-4 border-l-2 border-muted space-y-2">
          {itemFields && itemFields.length > 0 ? (
            itemFields.map((field) => (
              <SchemaFieldEditor
                key={field.id}
                fieldId={field.id}
                fieldName={field.name}
                fieldType={field.type}
                itemFields={field.itemFields}
                updateFieldName={updateFieldName}
                updateFieldType={updateFieldType}
                deleteField={deleteField}
                addItemField={addItemField}
                disabled={disabled}
              />
            ))
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No item fields defined
            </p>
          )}
          {!disabled && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={() => addItemField(fieldId)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add Item Field
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
