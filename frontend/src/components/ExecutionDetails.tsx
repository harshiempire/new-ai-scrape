import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { WorkflowExecution } from "@/lib/types";
import { Info } from "./Info";

interface ExecutionDetailsProps {
	execution: WorkflowExecution | undefined;
	executionData: any;
	isLoading: boolean;
}

export function ExecutionDetails({
	execution,
	executionData,
	isLoading,
}: ExecutionDetailsProps) {
	return (
		<Card className="md:col-span-2 h-[75vh] flex flex-col overflow-hidden">
			<CardHeader>
				<CardTitle>Execution Details</CardTitle>
			</CardHeader>

			<CardContent className="flex-1 overflow-hidden space-y-4 relative">
				{!execution ? (
					<div className="flex h-full items-center justify-center text-muted-foreground text-sm">
						Select an execution to view details
					</div>
				) : isLoading ? (
					<div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
					</div>
				) : (
					<ScrollArea className="h-full pr-4">
						<div className="space-y-4">
							<h2 className="font-medium text-base">
								Run #{execution.runNumber}
							</h2>

							<Info label="Status" value={execution.status} />
							<Info
								label="Started At"
								value={new Date(execution.startedAt).toLocaleString()}
							/>
							<Info
								label="Completed At"
								value={
									execution.completedAt
										? new Date(execution.completedAt).toLocaleString()
										: "—"
								}
							/>
							<Info
								label="Execution Time"
								value={
									execution.executionTime
										? `${execution.executionTime} ms`
										: "—"
								}
							/>

							<div>
								<h3 className="font-medium mb-1">Initial Inputs</h3>
								<pre className="bg-muted p-3 rounded text-xs max-h-[200px] overflow-auto">
									{JSON.stringify(
										executionData?.executionData?.initialInputs,
										null,
										2,
									)}
								</pre>
							</div>

							<div>
								<h3 className="font-medium mb-1">Variable Pool</h3>
								<pre className="bg-muted p-3 rounded text-xs max-h-[300px] overflow-auto">
									{JSON.stringify(
										executionData?.executionData?.variablePool,
										null,
										2,
									)}
								</pre>
							</div>
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
