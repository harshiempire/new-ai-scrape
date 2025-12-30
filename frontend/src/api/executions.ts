import type {
  Execution,
  ExecutionListResponse,
  ExecutionDataResponse,
  CreateExecutionBody,
  UpdateExecutionBody,
} from "@/lib/types";
import api from ".";
import type { NodeDefinition } from "./nodeDefinitions";

// GET /api/executions
export async function getExecutions(params?: {
  workflowId?: string;
  status?: string;
}): Promise<ExecutionListResponse> {
  const res = await api.get("/executions", {
    params,
  });
  return res.data;
}

// GET /api/executions/:id
export async function getExecutionById(id: string): Promise<Execution> {
  const res = await api.get(`/executions/${id}`);
  return res.data;
}

// GET /api/execution/data/:id
export async function getExecutionData(
  id: string,
): Promise<ExecutionDataResponse> {
  const res = await api.get(`/executions/data/${id}`);
  return res.data;
}

// POST /api/executions
export async function createExecution(
  data: CreateExecutionBody,
): Promise<Execution> {
  const res = await api.post("/executions", data);
  return res.data;
}

// PUT /api/executions/:id
export async function updateExecution(
  id: string,
  data: UpdateExecutionBody,
): Promise<Execution> {
  const res = await api.put(`/executions/${id}`, data);
  return res.data;
}

export async function nodeDefinition(): Promise<NodeDefinition[]> {
  const res = await api.get("/node-definitions");
  return res.data;
}
