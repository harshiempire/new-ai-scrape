import { queryOptions } from "@tanstack/react-query";
import { getWorkflowsbyId, getWorkflowExecutions } from "./api/workflow";
import { getExecutionData } from "./api/executions";

export const workflowQueryOptions = (workflowId: string) =>
  queryOptions({
    queryKey: ["workflow", workflowId],
    queryFn: () => getWorkflowsbyId(workflowId),
  });

export const executionsQueryOptions = (workflowId: string) =>
  queryOptions({
    queryKey: ["executions", workflowId],
    queryFn: () => getWorkflowExecutions(workflowId),
  });

export const executionDataQueryOptions = (executionId: string) =>
  queryOptions({
    queryKey: ["executionData", executionId],
    queryFn: () => getExecutionData(executionId),
    enabled: !!executionId,
  });
