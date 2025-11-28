import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { WorkflowEdge, WorkflowNode } from "@/lib/workflow-types";
import {
	getValidationSummary,
	type ValidationError,
	validateWorkflow,
} from "@/lib/workflow-validation";

interface ValidationPanelProps {
	nodes: WorkflowNode[];
	edges: WorkflowEdge[];
	className?: string;
}

export function ValidationPanel({
	nodes,
	edges,
	className,
}: ValidationPanelProps) {
	const [errors, setErrors] = useState<ValidationError[]>([]);

	useEffect(() => {
		const validationErrors = validateWorkflow(nodes, edges);
		setErrors(validationErrors);
	}, [nodes, edges]);

	const { isValid, errorCount, warningCount } = getValidationSummary(errors);

	return (
		<Card className={className}>
			<CardHeader>
				<CardTitle className="text-base flex items-center gap-2">
					{isValid ? (
						<>
							<CheckCircle className="w-4 h-4 text-green-600" />
							<span className="text-green-900">Workflow Valid</span>
						</>
					) : (
						<>
							<AlertCircle className="w-4 h-4 text-red-600" />
							<span className="text-red-900">Validation Issues</span>
						</>
					)}
				</CardTitle>
			</CardHeader>
			<CardContent>
				{errors.length === 0 ? (
					<div className="text-sm text-gray-600">✓ No issues detected</div>
				) : (
					<div className="space-y-2">
						<div className="text-xs text-gray-500 mb-3">
							{errorCount > 0 &&
								`${errorCount} error${errorCount > 1 ? "s" : ""}`}
							{errorCount > 0 && warningCount > 0 && ", "}
							{warningCount > 0 &&
								`${warningCount} warning${warningCount > 1 ? "s" : ""}`}
						</div>
						{errors.map((error, index) => (
							<div
								key={index}
								className={`
                  flex items-start gap-2 p-2 rounded text-sm
                  ${
										error.type === "error"
											? "bg-red-50 text-red-900"
											: "bg-amber-50 text-amber-900"
									}
                `}
							>
								{error.type === "error" ? (
									<AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
								) : (
									<AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
								)}
								<span className="flex-1">{error.message}</span>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
