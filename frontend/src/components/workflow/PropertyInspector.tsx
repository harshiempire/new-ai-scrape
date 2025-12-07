import { X } from "lucide-react";
import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useWorkflowStore } from "@/store/useWorkflowStore.ts";

export function PropertyInspector() {
	// Read from store
	const selectedNode = useWorkflowStore((state) => state.selectedNode);
	const updateNode = useWorkflowStore((state) => state.updateNode);
	const clearSelection = useWorkflowStore((state) => state.clearSelection);

	const handleLabelChange = useCallback(
		(value: string) => {
			if (selectedNode) {
				updateNode(selectedNode.id, { label: value });
			}
		},
		[selectedNode, updateNode],
	);

	const handlePropsChange = useCallback(
		(key: string, value: string | number) => {
			if (selectedNode) {
				updateNode(selectedNode.id, {
					props: {
						...selectedNode.data.props,
						[key]: value,
					},
				});
			}
		},
		[selectedNode, updateNode],
	);

	if (!selectedNode) {
		return (
			<div className="w-80 border-l bg-muted/30 p-4">
				<p className="text-sm text-muted-foreground text-center mt-8">
					Select a node to view its properties
				</p>
			</div>
		);
	}

	const nodeType = selectedNode.type as string;

	return (
		<div className="w-80 border-l bg-background flex flex-col h-full">
			<div className="p-4 border-b flex items-center justify-between">
				<h3 className="font-semibold">Node Properties</h3>
				<Button variant="ghost" size="icon-sm" onClick={clearSelection}>
					<X className="h-4 w-4" />
				</Button>
			</div>

			<ScrollArea className="flex-1">
				<div className="p-4 space-y-6">
					{/* Node Type Card */}
					<Card>
						<CardHeader>
							<CardTitle className="text-sm">Node Type</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center gap-2">
								<div
									className={`w-3 h-3 rounded-full ${
										nodeType === "start"
											? "bg-green-500"
											: nodeType === "api"
												? "bg-blue-500"
												: nodeType === "wait"
													? "bg-purple-500"
													: "bg-red-500"
									}`}
								/>
								<span className="text-sm font-medium capitalize">{nodeType}</span>
							</div>
						</CardContent>
					</Card>

					{/* Label Input */}
					<div className="space-y-2">
						<Label htmlFor="node-label">Label</Label>
						<Input
							id="node-label"
							value={selectedNode.data.label}
							onChange={(e) => handleLabelChange(e.target.value)}
							placeholder="Enter node label"
						/>
					</div>

					{/* Node-Specific Properties */}
					{nodeType === "api" && (
						<>
							<div className="space-y-2">
								<Label htmlFor="api-method">HTTP Method</Label>
								<Select
									value={selectedNode.data.props?.method || "GET"}
									onValueChange={(value: string) => handlePropsChange("method", value)}
								>
									<SelectTrigger id="api-method">
										<SelectValue placeholder="Select method" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GET">GET</SelectItem>
										<SelectItem value="POST">POST</SelectItem>
										<SelectItem value="PUT">PUT</SelectItem>
										<SelectItem value="DELETE">DELETE</SelectItem>
										<SelectItem value="PATCH">PATCH</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label htmlFor="api-url">URL</Label>
								<Input
									id="api-url"
									value={selectedNode.data.props?.url || ""}
									onChange={(e) => handlePropsChange("url", e.target.value)}
									placeholder="https://api.example.com/endpoint"
								/>
							</div>
						</>
					)}

					{nodeType === "wait" && (
						<div className="space-y-2">
							<Label htmlFor="wait-duration">Duration (ms)</Label>
							<Input
								id="wait-duration"
								type="number"
								value={selectedNode.data.props?.duration || 1000}
								onChange={(e) =>
									handlePropsChange("duration", parseInt(e.target.value) || 1000)
								}
								placeholder="1000"
								min="0"
								step="100"
							/>
							<p className="text-xs text-muted-foreground">
								{((selectedNode.data.props?.duration || 1000) / 1000).toFixed(1)}{" "}
								seconds
							</p>
						</div>
					)}

					{/* Node ID (Read-only) */}
					<div className="space-y-2">
						<Label htmlFor="node-id">Node ID</Label>
						<Input
							id="node-id"
							value={selectedNode.id}
							readOnly
							className="bg-muted"
						/>
						<p className="text-xs text-muted-foreground">
							Read-only unique identifier
						</p>
					</div>
				</div>
			</ScrollArea>
		</div>
	);
}
