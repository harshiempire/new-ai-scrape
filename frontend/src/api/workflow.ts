import type {
  Workflow,
  WorkflowExecution,
  WorkflowListResponse,
} from "@/lib/types";

import api from ".";

export async function getWorkflows(): Promise<WorkflowListResponse> {
  const res = await api.get("/workflows");
  return res.data;
}

export async function getWorkflowsbyId(workflowId: string): Promise<Workflow> {
  const res = await api.get(`/workflows/${workflowId}`);
  return res.data;
}

export async function getWorkflowExecutions(
  workflowId: string,
): Promise<WorkflowExecution[]> {
  const res = await api.get(`/workflows/${workflowId}/executions`);
  return res.data;
}

export async function createWorkflow(name: string): Promise<Workflow> {
  const res = await api.post("/workflows", {
    name,
    nodes: [],
    edges: [],
  });
  return res.data;
}

export async function deleteWorkflowById(
  workflowId: string,
): Promise<{ success: boolean }> {
  const res = await api.delete(`/workflows/${workflowId}`);
  return res.data.success;
}
