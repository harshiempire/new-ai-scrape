"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { WorkflowExecutor } from "../src/WorkflowExecutor";
import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { api } from "./_generated/api";

type WorkflowEntity = {
  _id: Id<"workflows_entity">;
  _creationTime: number;
  name: string;
  nodes: any[];
  edges: any[];
};

export const runWorkflowAction = internalAction({
  args: {
    workflowId: v.id("workflows_entity"),
    initialInputs: v.any(),
  },
  handler: async (ctx, args): Promise<any> => {
    const workflow: WorkflowEntity | null = await ctx.runQuery(
      api.workflows.getWorkflow,
      {
        id: args.workflowId,
      }
    );

    if (!workflow) throw new Error("Workflow not found");

    const executor = new WorkflowExecutor();
    const result = await executor.execute(workflow, args.initialInputs);
    return result;
  },
});
