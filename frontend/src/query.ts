import { queryOptions } from "@tanstack/react-query";
import { getExecutionData, nodeDefinition } from "./api/executions";
import {
  getWorkflows,
  getWorkflowExecutions,
  getWorkflowsbyId,
} from "./api/workflow";

export const workflowsQueryOptions = () =>
  queryOptions({
    queryKey: ["workflows"],
    queryFn: getWorkflows,
  });

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

export const nodeDefitionsQueryOptions = () =>
  queryOptions({
    queryKey: ["nodeDefinitions"],
    queryFn: nodeDefinition,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
