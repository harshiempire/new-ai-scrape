import type {
  Workflow,
  WorkflowExecution,
  WorkflowListResponse,
} from "@/lib/types";
import axios from "axios";

export async function getWorkflows(): Promise<WorkflowListResponse> {
  const res = await axios.get("http://localhost:5001/api/workflows");
  return res.data;
}

export async function getWorkflowsbyId(workflowId: string): Promise<Workflow> {
  const res = await axios.get(
    `http://localhost:5001/api/workflows/${workflowId}`
  );
  return res.data;
}

export async function getWorkflowExecutions(
  workflowId: string
): Promise<WorkflowExecution[]> {
  const res = await axios.get(
    `http://localhost:5001/api/workflows/${workflowId}/executions`
  );
  return res.data;
}
