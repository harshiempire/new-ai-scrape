import axios from "axios";
import type {
  Execution,
  ExecutionListResponse,
  ExecutionDataResponse,
  CreateExecutionBody,
  UpdateExecutionBody,
} from "@/lib/types";

// GET /api/executions
export async function getExecutions(params?: {
  workflowId?: string;
  status?: string;
}): Promise<ExecutionListResponse> {
  const res = await axios.get("http://localhost:5001/api/executions", {
    params,
  });
  return res.data;
}

// GET /api/executions/:id
export async function getExecutionById(id: string): Promise<Execution> {
  const res = await axios.get(`http://localhost:5001/api/executions/${id}`);
  return res.data;
}

// GET /api/execution/data/:id
export async function getExecutionData(
  id: string
): Promise<ExecutionDataResponse> {
  const res = await axios.get(
    `http://localhost:5001/api/executions/data/${id}`
  );
  return res.data;
}

// POST /api/executions
export async function createExecution(
  data: CreateExecutionBody
): Promise<Execution> {
  const res = await axios.post("http://localhost:5001/api/executions", data);
  return res.data;
}

// PUT /api/executions/:id
export async function updateExecution(
  id: string,
  data: UpdateExecutionBody
): Promise<Execution> {
  const res = await axios.put(
    `http://localhost:5001/api/executions/${id}`,
    data
  );
  return res.data;
}
