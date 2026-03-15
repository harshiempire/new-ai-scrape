import { useCallback } from "react";
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
import { InputSchemaDisplay, OutputSchemaEditor, TemplateTextWidget, JsonEditorWidget } from "./schema";
import type { SimpleSchema } from "@/lib/schemaTypes";
import { useMemo } from "react";
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

// Custom RJSF widgets with template autocomplete
const customWidgets = {
	templateText: TemplateTextWidget,
	jsonEditor: JsonEditorWidget,
};

interface PropertyInspectorProps {
	/** Optional callback when node is updated - triggers save */
	onNodeUpdate?: (nodeId: string, updates: Partial<WorkflowNode["data"]>) => void;
}

export function PropertyInspector({ onNodeUpdate }: PropertyInspectorProps) {
	// Read editing node from store (set on double-click)
	const editingNode = useWorkflowStore((state) => state.editingNode);
	const setEditingNode = useWorkflowStore((state) => state.setEditingNode);
	const updateNode = useWorkflowStore((state) => state.updateNode);
	const nodes = useWorkflowStore((state) => state.nodes);

	// Get latest node data (in case it was updated)
	const currentNode = editingNode
		? nodes.find((n) => n.id === editingNode.id)
		: null;
	const nodeType = currentNode?.type as string;

	// Fetch node definition for this type
	const { data: nodeDef } = useNodeDefinitionByType(nodeType || "");

	const handleLabelChange = useCallback(
		(value: string) => {
			if (editingNode) {
				const updates = { label: value };
				if (onNodeUpdate) {
					onNodeUpdate(editingNode.id, updates);
				} else {
					updateNode(editingNode.id, updates);
				}
			}
		},
		[editingNode, updateNode, onNodeUpdate],
	);

	const handleFormChange = useCallback(
		(data: { formData?: Record<string, any> }) => {
			if (editingNode && currentNode && data.formData) {
				const updates = { props: data.formData };
				if (onNodeUpdate) {
					onNodeUpdate(editingNode.id, updates);
				} else {
					updateNode(editingNode.id, updates);
				}
			}
		},
		[editingNode, currentNode, updateNode, onNodeUpdate],
	);

	const handleOutputSchemaChange = useCallback(
		(schema: SimpleSchema) => {
			if (editingNode) {
				const updates = { outputSchema: schema };
				if (onNodeUpdate) {
					onNodeUpdate(editingNode.id, updates);
				} else {
					updateNode(editingNode.id, updates);
				}
			}
		},
		[editingNode, updateNode, onNodeUpdate],
	);

	const handleClose = useCallback(() => {
		setEditingNode(null);
	}, [setEditingNode]);

	const isOpen = editingNode !== null && currentNode !== null;
	const nodeColor = nodeColorMap[nodeType] ?? "bg-gray-500";

	// Check if node has configurable props
	const hasPropsSchema =
		nodeDef?.propsSchema &&
		typeof nodeDef.propsSchema === "object" &&
		Object.keys(nodeDef.propsSchema).length > 0 &&
		nodeDef.propsSchema.properties &&
		Object.keys(nodeDef.propsSchema.properties).length > 0;

	// Build dynamic uiSchema with nodeId for template autocomplete
	const uiSchema = useMemo<UiSchema>(() => {
		if (!currentNode || !nodeDef?.propsSchema?.properties) return baseUiSchema;

		const schemaWithTemplates: UiSchema = { ...baseUiSchema };

		// Apply template widget to string fields (url, etc.)
		for (const [fieldName, fieldSchema] of Object.entries(
			nodeDef.propsSchema.properties as Record<string, any>
		)) {
			// Apply to string type fields (especially url)
			if (fieldSchema.type === "string" && fieldName !== "method") {
				schemaWithTemplates[fieldName] = {
					"ui:widget": "templateText",
					"ui:options": { nodeId: currentNode.id },
				};
			}
		}

		// Apply JSON editor widget to body field (defined in conditionals)
		schemaWithTemplates.body = {
			"ui:widget": "jsonEditor",
		};

		return schemaWithTemplates;
	}, [currentNode, nodeDef?.propsSchema?.properties]);

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
			<DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<div className={`w - 3 h - 3 rounded - full ${nodeColor} `} />
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
									<div className={`w - 3 h - 3 rounded - full ${nodeColor} `} />
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

						{/* Dynamic Properties Form from JSON Schema */}
						{hasPropsSchema && nodeDef?.propsSchema && (
							<div className="space-y-2">
								<Label>Properties</Label>
								<div className="rjsf-form-container border rounded-lg p-3">
									<Form
										schema={nodeDef.propsSchema as RJSFSchema}
										uiSchema={uiSchema}
										widgets={customWidgets}
										formData={
											currentNode.data.props || nodeDef?.defaultProps || {}
										}
										onChange={handleFormChange}
										validator={validator}
										liveValidate={false}
									/>
								</div>
							</div>
						)}

						{/* Schema Section - Split View */}
						<div className="border-t pt-4 mt-4">
							<Label className="text-sm font-semibold mb-3 block">Data Schemas</Label>
							<div className="grid grid-cols-2 gap-4">
								{/* Left: Input Schema (auto-inferred) */}
								<div className="border rounded-lg p-3 bg-muted/30">
									<InputSchemaDisplay nodeId={currentNode.id} />
								</div>
								{/* Right: Output Schema (user-defined) */}
								<div className="border rounded-lg p-3">
									<OutputSchemaEditor
										schema={currentNode.data.outputSchema as SimpleSchema | undefined}
										onChange={handleOutputSchemaChange}
									/>
								</div>
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
