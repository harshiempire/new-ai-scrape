import { WorkflowDefinition } from "./types";

export class WorkflowBuilder {
  workflow: WorkflowDefinition;

  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
  }
}
