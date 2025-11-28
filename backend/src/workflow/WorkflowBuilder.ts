import { WorkflowDefinition } from "../lib/types";

export class WorkflowBuilder {
  workflow: WorkflowDefinition;

  constructor(workflow: WorkflowDefinition) {
    this.workflow = workflow;
  }
}
