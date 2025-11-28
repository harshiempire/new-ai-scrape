import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { WorkflowExecution } from "@/lib/types";
import {
  workflowQueryOptions,
  executionsQueryOptions,
  executionDataQueryOptions,
} from "@/query";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { WorkflowDetails } from "../../components/WorkflowDetails";
import { ExecutionsList } from "../../components/ExecutionsList";
import { ExecutionDetails } from "../../components/ExecutionDetails";
import WorkflowBuilder from "@/components/WorkflowBuilder";

export const Route = createFileRoute("/workflow/$workflowId")({
  // 1. UPDATE: Only prefetch the Workflow details, NOT the executions
  loader: ({ context: { queryClient }, params: { workflowId } }) => {
    return queryClient.ensureQueryData(workflowQueryOptions(workflowId));
  },
  component: WorkflowDisplay,
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
        <TabsTrigger value="builder">Builder</TabsTrigger>
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="executions">Executions</TabsTrigger>
      </TabsList>

      <TabsContent value="builder" style={{ height: "100%", width: "100%" }}>
        <WorkflowBuilder
          initialNodes={workflow.nodes}
          initialEdges={workflow.edges}
        />
      </TabsContent>

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
