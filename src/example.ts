import { WorkflowExecutor } from "./WorkflowExecutor";
import { WorkflowDefinition } from "./types";

const workflow: WorkflowDefinition = {
  nodes: [
    {
      id: "start-1",
      type: "start",
      label: "Start",
      outputSchema: {
        latitude: "number",
        longitude: "number",
        city: "string",
      },
    },
    {
      id: "api-2",
      type: "api",
      label: "Fetch Weather",
      props: {
        method: "GET",
        url: "https://api.open-meteo.com/v1/forecast?latitude={{e1.latitude}}&longitude={{e1.longitude}}&current_weather=true",
      },
      outputSchema: {
        status: "number",
        data: "any",
      },
    },
    {
      id: "end-3",
      type: "end",
      label: "End",
    },
  ],
  edges: [
    { id: "e1", source: "start-1", target: "api-2" },
    { id: "e2", source: "api-2", target: "end-3" },
  ],
};

const initialInputs = {
  latitude: 52.52,
  longitude: 13.41,
  city: "Berlin",
};

const executor = new WorkflowExecutor();
executor.execute(workflow, initialInputs).catch(console.error);
