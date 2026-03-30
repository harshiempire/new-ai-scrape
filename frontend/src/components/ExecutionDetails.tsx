import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronRight, AlertTriangle } from "lucide-react";
import type { WorkflowExecution } from "@/lib/types";

interface ExecutionDetailsProps {
  execution: WorkflowExecution | undefined;
  executionData: any;
  isLoading: boolean;
}

// ── Status badge ────────────────────────────────────────────────────────────

const statusConfig: Record<
  string,
  { label: string; variant: "default" | "destructive" | "secondary" | "outline"; icon: React.ReactNode }
> = {
  completed: {
    label: "Completed",
    variant: "default",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  failed: {
    label: "Failed",
    variant: "destructive",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  running: {
    label: "Running",
    variant: "secondary",
    icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />,
  },
  pending: {
    label: "Pending",
    variant: "outline",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, variant: "outline" as const, icon: null };
  return (
    <Badge variant={cfg.variant} className="flex items-center gap-1.5 w-fit text-xs px-2 py-0.5">
      {cfg.icon}
      {cfg.label}
    </Badge>
  );
}

// ── Variable pool entry ──────────────────────────────────────────────────────

function isErrorEntry(val: unknown): val is { message: string; stack?: string } {
  return (
    typeof val === "object" &&
    val !== null &&
    "message" in val &&
    typeof (val as any).message === "string"
  );
}

function VariablePoolEntry({ nodeId, value }: { nodeId: string; value: unknown }) {
  const [stackOpen, setStackOpen] = useState(false);
  const isError = isErrorEntry(value);

  return (
    <div
      className={`rounded-lg border text-xs overflow-hidden ${
        isError ? "border-destructive/50 bg-destructive/5" : "border-border bg-muted/30"
      }`}
    >
      {/* Node ID header */}
      <div
        className={`px-3 py-1.5 flex items-center gap-2 font-mono text-[11px] border-b ${
          isError
            ? "border-destructive/30 bg-destructive/10 text-destructive"
            : "border-border bg-muted/60 text-muted-foreground"
        }`}
      >
        {isError && <AlertTriangle className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate">{nodeId}</span>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {isError ? (
          <>
            <p className="text-destructive font-medium leading-snug">{value.message}</p>
            {value.stack && (
              <div>
                <button
                  type="button"
                  onClick={() => setStackOpen((o) => !o)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {stackOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                  Stack trace
                </button>
                {stackOpen && (
                  <pre className="mt-2 text-[11px] text-muted-foreground whitespace-pre-wrap break-all leading-relaxed">
                    {value.stack}
                  </pre>
                )}
              </div>
            )}
          </>
        ) : (
          <pre className="whitespace-pre-wrap break-all text-foreground leading-relaxed">
            {JSON.stringify(value, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function ExecutionDetails({
  execution,
  executionData,
  isLoading,
}: ExecutionDetailsProps) {
  const initialInputs = executionData?.executionData?.initialInputs;
  const variablePool = executionData?.executionData?.variablePool;
  const hasInputs =
    initialInputs && typeof initialInputs === "object" && Object.keys(initialInputs).length > 0;
  const poolEntries = variablePool ? Object.entries(variablePool) : [];

  return (
    <Card className="md:col-span-2 h-[75vh] flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle>Execution Details</CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden relative">
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
            <div className="space-y-5 pb-4">

              {/* Run header */}
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-base">Run #{execution.runNumber}</h2>
                <StatusBadge status={execution.status} />
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Started", value: new Date(execution.startedAt).toLocaleString() },
                  {
                    label: "Completed",
                    value: execution.completedAt
                      ? new Date(execution.completedAt).toLocaleString()
                      : "—",
                  },
                  {
                    label: "Duration",
                    value: execution.executionTime ? `${execution.executionTime} ms` : "—",
                  },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-lg border bg-muted/30 px-3 py-2.5">
                    <p className="text-[11px] text-muted-foreground mb-0.5">{label}</p>
                    <p className="text-sm font-medium leading-tight break-all">{value}</p>
                  </div>
                ))}
              </div>

              {/* Initial Inputs */}
              {hasInputs && (
                <div className="space-y-1.5">
                  <h3 className="text-sm font-medium">Initial Inputs</h3>
                  <pre className="bg-muted rounded-lg px-3 py-2.5 text-xs whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(initialInputs, null, 2)}
                  </pre>
                </div>
              )}

              {/* Variable Pool */}
              {poolEntries.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">
                    Variable Pool
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {poolEntries.length} node{poolEntries.length !== 1 ? "s" : ""}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {poolEntries.map(([nodeId, value]) => (
                      <VariablePoolEntry key={nodeId} nodeId={nodeId} value={value} />
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state for pool */}
              {!hasInputs && poolEntries.length === 0 && (
                <p className="text-sm text-muted-foreground italic">No execution data available.</p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
