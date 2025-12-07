import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";

interface InitialInputsDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onExecute: (inputs: Record<string, any>) => void;
	isExecuting?: boolean;
}

export function InitialInputsDialog({
	open,
	onOpenChange,
	onExecute,
	isExecuting = false,
}: InitialInputsDialogProps) {
	const [inputs, setInputs] = useState<Array<{ key: string; value: string }>>([
		{ key: "", value: "" },
	]);

	const addInput = () => {
		setInputs([...inputs, { key: "", value: "" }]);
	};

	const removeInput = (index: number) => {
		setInputs(inputs.filter((_, i) => i !== index));
	};

	const updateInput = (
		index: number,
		field: "key" | "value",
		newValue: string,
	) => {
		const newInputs = [...inputs];
		newInputs[index][field] = newValue;
		setInputs(newInputs);
	};

	const handleExecute = () => {
		// Convert array to object, filtering out empty keys
		const inputsObject = inputs
			.filter((input) => input.key.trim() !== "")
			.reduce(
				(acc, input) => {
					// Try to parse as JSON, otherwise keep as string
					try {
						acc[input.key] = JSON.parse(input.value);
					} catch {
						acc[input.key] = input.value;
					}
					return acc;
				},
				{} as Record<string, any>,
			);

		onExecute(inputsObject);
		onOpenChange(false);
		// Reset inputs
		setInputs([{ key: "", value: "" }]);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[525px]">
				<DialogHeader>
					<DialogTitle>Initial Inputs</DialogTitle>
					<DialogDescription>
						Provide initial inputs for the workflow execution. Values are parsed
						as JSON if possible.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-4 max-h-[400px] overflow-y-auto">
					{inputs.map((input, index) => (
						<div key={index} className="flex items-end gap-2">
							<div className="flex-1">
								<Label htmlFor={`key-${index}`} className="text-xs">
									Key
								</Label>
								<Input
									id={`key-${index}`}
									placeholder="e.g., url"
									value={input.key}
									onChange={(e) => updateInput(index, "key", e.target.value)}
									className="mt-1"
								/>
							</div>

							<div className="flex-1">
								<Label htmlFor={`value-${index}`} className="text-xs">
									Value
								</Label>
								<Input
									id={`value-${index}`}
									placeholder='e.g., "https://api.example.com"'
									value={input.value}
									onChange={(e) => updateInput(index, "value", e.target.value)}
									className="mt-1"
								/>
							</div>

							<Button
								type="button"
								variant="outline"
								size="icon"
								onClick={() => removeInput(index)}
								disabled={inputs.length === 1}
								className="shrink-0"
							>
								<Trash2 className="w-4 h-4" />
							</Button>
						</div>
					))}

					<Button
						type="button"
						variant="outline"
						size="sm"
						onClick={addInput}
						className="w-full"
					>
						<Plus className="w-4 h-4 mr-2" />
						Add Input
					</Button>
				</div>

				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleExecute}
						disabled={isExecuting}
						className="bg-green-600 hover:bg-green-700"
					>
						{isExecuting ? "Executing..." : "Execute Workflow"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
