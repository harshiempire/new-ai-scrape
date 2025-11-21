import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkflowExecution } from "@/lib/types";
import {
  workflowQueryOptions,
  executionsQueryOptions,
  executionDataQueryOptions,
} from "@/query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { WorkflowDetails } from "../../components/WorkflowDetails";
import { ExecutionsList } from "../../components/ExecutionsList";
import { ExecutionDetails } from "../../components/ExecutionDetails";

export const Route = createFileRoute("/workflow/$workflowId")({
  // 1. UPDATE: Only prefetch the Workflow details, NOT the executions
  loader: ({ context: { queryClient }, params: { workflowId } }) => {
    return queryClient.ensureQueryData(workflowQueryOptions(workflowId));
  },
  component: WorkflowDisplay,
  pendingComponent: () => (
    <div className="p-6 space-y-4">
      <div className="h-8 bg-muted animate-pulse rounded" />
      <div className="h-64 bg-muted animate-pulse rounded" />
    </div>
  ),

  errorComponent: ({ error, reset }) => (
    <div className="flex items-center justify-center h-screen p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <CardTitle>Error Loading Workflow</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {error.message || "An unexpected error occurred"}
          </p>
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 border rounded-md hover:bg-muted transition"
            >
              Go Back
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
});

function WorkflowDisplay() {
  const { workflowId } = Route.useParams();

  // 2. UPDATE: Track the active tab
  const [activeTab, setActiveTab] = useState("details");
  const [selectedExecution, setSelectedExecution] =
    useState<WorkflowExecution>();

  // Keep workflow as SuspenseQuery because it's prefetched in loader
  const { data: workflow } = useSuspenseQuery(workflowQueryOptions(workflowId));

  // 3. UPDATE: Use standard useQuery for executions with 'enabled' flag
  const { data: executions, isLoading: isLoadingExecutions } = useQuery({
    ...executionsQueryOptions(workflowId),
    enabled: activeTab === "executions", // Only fetch when tab is 'executions'
  });

  const { data: executionData, isLoading: isLoadingDetails } = useQuery(
    executionDataQueryOptions(selectedExecution?.id || "")
  );

  function handleSelectExecution(execution: WorkflowExecution) {
    setSelectedExecution(execution);
  }

  return (
    // 4. UPDATE: Bind value and onValueChange to state
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full p-6">
      <TabsList className="mb-4">
        <TabsTrigger value="details">Workflow Details</TabsTrigger>
        <TabsTrigger value="executions">Executions</TabsTrigger>
      </TabsList>

      {/* ================= WORKFLOW DETAILS ================= */}
      <TabsContent value="details">
        <WorkflowDetails workflow={workflow} />
      </TabsContent>

      {/* ================= EXECUTIONS TAB ================= */}
      <TabsContent value="executions">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* LEFT: Execution List */}
          <ExecutionsList
            executions={executions}
            isLoading={isLoadingExecutions}
            selectedExecutionId={selectedExecution?.id}
            onSelectExecution={handleSelectExecution}
          />

          {/* RIGHT: Execution Details */}
          <ExecutionDetails
            execution={selectedExecution}
            executionData={executionData}
            isLoading={isLoadingDetails}
          />
        </div>
      </TabsContent>
    </Tabs>
  );
}
