import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  workflows_entity: defineTable({
    name: v.string(),
    nodes: v.array(v.any()),
    edges: v.array(v.any()),
  }),

  executions_entity: defineTable({
    workflow_id: v.id("workflows_entity"), // Use v.id() for relations
    status: v.string(),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    execution_time: v.optional(v.number()),
  })
    .index("by_workflow", ["workflow_id"]) // Index for efficient queries
    .index("by_status", ["status"])
    .index("by_workflow_and_status", ["workflow_id", "status"]),

  execution_data: defineTable({
    execution_id: v.id("executions_entity"), // Reference to execution
    variable_pool: v.any(), // More flexible than v.object({})
  }).index("by_execution", ["execution_id"]), // Index for lookup
});
