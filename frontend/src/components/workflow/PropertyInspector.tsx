import { useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useWorkflowStore } from "@/store/useWorkflowStore.ts";
import { useNodeDefinitionByType } from "@/hooks/useNodeDefinitions";
import Form from "@rjsf/core";
import validator from "@rjsf/validator-ajv8";
import type { RJSFSchema, UiSchema } from "@rjsf/utils";
import {
  InputSchemaDisplay,
  OutputSchemaEditor,
  TemplateTextWidget,
  JsonEditorWidget,
  KeyValueEditor,
} from "./schema";
import type { SimpleSchema } from "@/lib/schemaTypes";
import type { WorkflowNode } from "@/lib/workflow-types";

// Color mapping for node type indicator
const nodeColorMap: Record<string, string> = {
  start: "bg-green-500",
  api: "bg-blue-500",
  wait: "bg-purple-500",
  end: "bg-red-500",
};

// Custom UI schema for better form appearance
const baseUiSchema: UiSchema = {
  "ui:submitButtonOptions": { norender: true },
};

// Custom RJSF widgets — scalars only (object-type fields are rendered outside RJSF)
const customWidgets = {
  templateText: TemplateTextWidget,
  jsonEditor: JsonEditorWidget,
};

interface PropertyInspectorProps {
  /** Optional callback when node is updated - triggers save */
  onNodeUpdate?: (
    nodeId: string,
    updates: Partial<WorkflowNode["data"]>,
  ) => void;
}

export function PropertyInspector({ onNodeUpdate }: PropertyInspectorProps) {
  const editingNode = useWorkflowStore((state) => state.editingNode);
  const setEditingNode = useWorkflowStore((state) => state.setEditingNode);
  const updateNode = useWorkflowStore((state) => state.updateNode);
  const nodes = useWorkflowStore((state) => state.nodes);

  const currentNode = editingNode
    ? nodes.find((n) => n.id === editingNode.id)
    : null;
  const nodeType = currentNode?.type as string;

  const { data: nodeDef } = useNodeDefinitionByType(nodeType || "");

  const handleLabelChange = useCallback(
    (value: string) => {
      if (editingNode) {
        const updates = { label: value };
        if (onNodeUpdate) onNodeUpdate(editingNode.id, updates);
        else updateNode(editingNode.id, updates);
      }
    },
    [editingNode, updateNode, onNodeUpdate],
  );

  // Called by RJSF when scalar fields (method, url, body) change
  const handleFormChange = useCallback(
    (data: { formData?: Record<string, any> }) => {
      if (editingNode && currentNode && data.formData) {
        // Preserve any record-type fields (headers etc.) that RJSF doesn't manage
        const preserved: Record<string, any> = {};
        if (nodeDef?.propsSchema?.properties) {
          for (const [name, schema] of Object.entries(
            nodeDef.propsSchema.properties as Record<string, any>,
          )) {
            if (schema.type === "object" && schema.additionalProperties) {
              const existing = currentNode.data.props?.[name];
              if (existing !== undefined) preserved[name] = existing;
            }
          }
        }
        const updates = { props: { ...data.formData, ...preserved } };
        if (onNodeUpdate) onNodeUpdate(editingNode.id, updates);
        else updateNode(editingNode.id, updates);
      }
    },
    [
      editingNode,
      currentNode,
      nodeDef?.propsSchema?.properties,
      updateNode,
      onNodeUpdate,
    ],
  );

  // Called directly by KeyValueEditor (bypasses RJSF) when record fields change
  const handleRecordFieldChange = useCallback(
    (fieldName: string, value: Record<string, string>) => {
      if (editingNode && currentNode) {
        const newProps = {
          ...(currentNode.data.props ?? {}),
          [fieldName]: value,
        };
        const updates = { props: newProps };
        if (onNodeUpdate) onNodeUpdate(editingNode.id, updates);
        else updateNode(editingNode.id, updates);
      }
    },
    [editingNode, currentNode, updateNode, onNodeUpdate],
  );

  const handleOutputSchemaChange = useCallback(
    (schema: SimpleSchema) => {
      if (editingNode) {
        const updates = { outputSchema: schema };
        if (onNodeUpdate) onNodeUpdate(editingNode.id, updates);
        else updateNode(editingNode.id, updates);
      }
    },
    [editingNode, updateNode, onNodeUpdate],
  );

  const handleClose = useCallback(() => setEditingNode(null), [setEditingNode]);

  const isOpen = editingNode !== null && currentNode !== null;
  const nodeColor = nodeColorMap[nodeType] ?? "bg-gray-500";

  // Identify record-type fields (Record<string,string>) — these are rendered outside RJSF
  // to avoid RJSF 6 custom-field onChange replacing the entire form data
  const recordFieldEntries = useMemo<Array<[string, any]>>(() => {
    if (!nodeDef?.propsSchema?.properties) return [];
    return Object.entries(
      nodeDef.propsSchema.properties as Record<string, any>,
    ).filter(
      ([, schema]) => schema.type === "object" && schema.additionalProperties,
    );
  }, [nodeDef?.propsSchema?.properties]);

  // Filtered propsSchema — record fields excluded so RJSF doesn't render them
  const filteredPropsSchema = useMemo(() => {
    if (!nodeDef?.propsSchema || recordFieldEntries.length === 0)
      return nodeDef?.propsSchema;
    const recordNames = new Set(recordFieldEntries.map(([name]) => name));
    const props = {
      ...(nodeDef.propsSchema.properties as Record<string, any>),
    };
    for (const name of recordNames) delete props[name];
    return { ...nodeDef.propsSchema, properties: props };
  }, [nodeDef?.propsSchema, recordFieldEntries]);

  const hasPropsSchema =
    filteredPropsSchema &&
    typeof filteredPropsSchema === "object" &&
    Object.keys(filteredPropsSchema).length > 0 &&
    filteredPropsSchema.properties &&
    Object.keys(filteredPropsSchema.properties).length > 0;

  // Build uiSchema — skip record fields (they're gone from the schema)
  const uiSchema = useMemo<UiSchema>(() => {
    if (!currentNode || !nodeDef?.propsSchema?.properties) return baseUiSchema;

    const recordNames = new Set(recordFieldEntries.map(([name]) => name));
    const ui: UiSchema = { ...baseUiSchema };

    for (const [fieldName, fieldSchema] of Object.entries(
      nodeDef.propsSchema.properties as Record<string, any>,
    )) {
      if (recordNames.has(fieldName)) continue; // rendered separately
      if (fieldSchema.type === "string" && fieldName !== "method") {
        ui[fieldName] = {
          "ui:widget": "templateText",
          "ui:options": { nodeId: currentNode.id },
        };
      }
    }

    // body is in the conditional (if/then), not in properties directly
    // Pass nodeId via ui:options so JsonEditorWidget can resolve variables
    ui.body = {
      "ui:widget": "jsonEditor",
      "ui:options": { nodeId: currentNode.id },
    };

    return ui;
  }, [currentNode, nodeDef?.propsSchema?.properties, recordFieldEntries]);

  // formData for RJSF — strip record fields to avoid RJSF managing them
  const rjsfFormData = useMemo(() => {
    const props = currentNode?.data.props ?? nodeDef?.defaultProps ?? {};
    if (recordFieldEntries.length === 0) return props;
    const recordNames = new Set(recordFieldEntries.map(([name]) => name));
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !recordNames.has(k)),
    );
  }, [currentNode?.data.props, nodeDef?.defaultProps, recordFieldEntries]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${nodeColor}`} />
            <span className="capitalize">{nodeType}</span> Node Properties
          </DialogTitle>
          <DialogDescription>
            Configure the properties for this node
          </DialogDescription>
        </DialogHeader>

        {currentNode && (
          <div className="space-y-6 py-4">
            {/* Node Type Card */}
            <Card>
              <CardHeader className="py-3">
                <CardTitle className="text-sm">Node Type</CardTitle>
              </CardHeader>
              <CardContent className="py-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${nodeColor}`} />
                  <span className="text-sm font-medium capitalize">
                    {nodeType}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Label Input */}
            <div className="space-y-2">
              <Label htmlFor="node-label">Label</Label>
              <Input
                id="node-label"
                value={currentNode.data.label}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="Enter node label"
              />
            </div>

            {/* RJSF form — scalar/enum fields only (method, url, body…) */}
            {hasPropsSchema && filteredPropsSchema && (
              <div className="space-y-2">
                <Label>Properties</Label>
                <div className="rjsf-form-container border rounded-lg p-3">
                  <Form
                    schema={filteredPropsSchema as RJSFSchema}
                    uiSchema={uiSchema}
                    widgets={customWidgets}
                    formData={rjsfFormData}
                    onChange={handleFormChange}
                    validator={validator}
                    liveValidate={false}
                    formContext={{ nodeId: currentNode.id }}
                  />
                </div>
              </div>
            )}

            {/* Record-type fields (headers etc.) rendered outside RJSF */}
            {recordFieldEntries.map(([fieldName, fieldSchema]) => (
              <div key={fieldName} className="space-y-2">
                <Label className="capitalize">
                  {fieldSchema.title ?? fieldName}
                </Label>
                <div className="border rounded-lg p-3">
                  <KeyValueEditor
                    nodeId={currentNode.id}
                    value={currentNode.data.props?.[fieldName] ?? {}}
                    onChange={(val) => handleRecordFieldChange(fieldName, val)}
                  />
                </div>
              </div>
            ))}

            {/* Schema Section - Stacked */}
            <div className="border-t pt-4 mt-4 space-y-4">
              <Label className="text-sm font-semibold block">
                Data Schemas
              </Label>
              <div className="border rounded-lg p-3 bg-muted/30">
                <InputSchemaDisplay nodeId={currentNode.id} />
              </div>
              <div className="border rounded-lg p-3">
                <OutputSchemaEditor
                  schema={
                    currentNode.data.outputSchema as SimpleSchema | undefined
                  }
                  onChange={handleOutputSchemaChange}
                />
              </div>
            </div>

            {/* Node ID (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="node-id">Node ID</Label>
              <Input
                id="node-id"
                value={currentNode.id}
                readOnly
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Read-only unique identifier
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
