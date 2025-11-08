import { mutation, internalQuery, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// Create
export const createWorkflow = mutation({
  args: {
    name: v.string(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const workflowId = await ctx.db.insert("workflows_entity", {
      name: args.name,
      nodes: args.nodes,
      edges: args.edges,
    });

    return workflowId;
  },
});

// Read - Get single workflow
export const getWorkflow = query({
  args: { id: v.id("workflows_entity") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    return workflow;
  },
});
// Read - List all workflows
export const listWorkflows = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("workflows_entity").collect();
  },
});

// Update
export const updateWorkflow = mutation({
  args: {
    id: v.id("workflows_entity"),
    name: v.optional(v.string()),
    nodes: v.optional(v.array(v.any())),
    edges: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Delete
export const deleteWorkflow = mutation({
  args: { id: v.id("workflows_entity") },
  handler: async (ctx, args) => {
    // Optional: Delete related executions first
    const executions = await ctx.db
      .query("executions_entity")
      .withIndex("by_workflow", (q) => q.eq("workflow_id", args.id))
      .collect();

    for (const execution of executions) {
      // Delete execution data
      const executionData = await ctx.db
        .query("execution_data")
        .withIndex("by_execution", (q) => q.eq("execution_id", execution._id))
        .collect();

      for (const data of executionData) {
        await ctx.db.delete(data._id);
      }

      // Delete execution
      await ctx.db.delete(execution._id);
    }

    // Delete workflow
    await ctx.db.delete(args.id);
  },
});

// Get workflow with executions
export const getWorkflowWithExecutions = query({
  args: { id: v.id("workflows_entity") },
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.id);
    if (!workflow) return null;

    const executions = await ctx.db
      .query("executions_entity")
      .withIndex("by_workflow", (q) => q.eq("workflow_id", args.id))
      .order("desc")
      .collect();

    return { ...workflow, executions };
  },
});

export const runWorkflow = mutation({
  args: {
    workflowId: v.id("workflows_entity"),
    initialInputs: v.any(),
  },
  handler: async (ctx, args) => {
    // ✅ Schedule the action to run after the mutation commits
    await ctx.scheduler.runAfter(
      0,
      internal.workflowActions.runWorkflowAction,
      args
    );
    // Note: The action runs asynchronously, so we can't return its result
  },
});
