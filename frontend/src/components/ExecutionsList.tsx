import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { WorkflowExecution } from "@/lib/types";
import { Loader2 } from "lucide-react";

interface ExecutionsListProps {
  executions: WorkflowExecution[] | undefined;
  isLoading: boolean;
  selectedExecutionId?: string;
  onSelectExecution: (execution: WorkflowExecution) => void;
}

export function ExecutionsList({
  executions,
  isLoading,
  selectedExecutionId,
  onSelectExecution,
}: ExecutionsListProps) {
  return (
    <Card className="md:col-span-1 h-[75vh] flex flex-col overflow-hidden">
      <CardHeader>
        <CardTitle>Executions</CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden relative">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="divide-y">
              {executions && executions.length > 0 ? (
                executions.map((exe) => (
                  <div
                    key={exe.id}
                    onClick={() => onSelectExecution(exe)}
                    className={cn(
                      "p-4 cursor-pointer hover:bg-muted transition",
                      selectedExecutionId === exe.id && "bg-muted"
                    )}
                  >
                    <div className="font-medium flex items-center gap-2">
                      Run #{exe.runNumber}
                      <Badge
                        variant={
                          exe.status === "Started" ? "secondary" : "default"
                        }
                        className="capitalize"
                      >
                        {exe.status}
                      </Badge>
                    </div>

                    <div className="text-xs text-muted-foreground">
                      {new Date(exe.startedAt).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  No executions found.
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
