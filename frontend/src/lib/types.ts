export interface Workflow {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  nodes: any[];
  edges: any[];
}
export type WorkflowListResponse = Omit<Workflow, "nodes" | "edges">[];

export interface ExecutionData {
  id: string;
  executionId: string;
  initialInputs: Record<string, any>;
  variablePool: Record<string, any>;
}

export type WorkflowExecution = Omit<Execution, "workflow" | "executionData">;

export interface Execution {
  id: string;
  workflowId: string;
  status: string;
  startedAt: string;
  createdAt: string;
  updatedAt: string;
  runNumber: number;
  completedAt?: string | null;
  executionTime?: number | null;
  workflow: Workflow;
  executionData: ExecutionData | null;
}

export type ExecutionListResponse = Execution[];

export interface ExecutionDataResponse {
  executionData: ExecutionData | null;
}

export interface CreateExecutionBody {
  workflowId: string;
  status: string;
}

export interface UpdateExecutionBody {
  status?: string;
  completedAt?: string | null;
  executionTime?: number | null;
  variablePool?: Record<string, any>;
}
