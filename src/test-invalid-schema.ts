import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
  nodes: [
    {
      id: "start-1",
      type: "start",
      label: "Start",
      outputSchema: {
        userId: "number", // Expects number
      },
    },
    {
      id: "api-2",
      type: "api",
      label: "Get User",
      props: {
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/users/{{e1.userId}}",
      },
    },
    { id: "end-3", type: "end", label: "End" },
  ],
  edges: [
    { id: "e1", source: "start-1", target: "api-2" },
    { id: "e2", source: "api-2", target: "end-3" },
  ],
};

// INVALID: passing string instead of number
const initialInputs = {
  userId: "not-a-number", // ❌ Should fail validation
};

const executor = new WorkflowExecutor(
  workflow,
  initialInputs,
  "test-execution"
);
executor.execute().catch((error) => {
  console.error("Expected validation error:", error.message);
});
