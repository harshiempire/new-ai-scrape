import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

// Helper functions
const errorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

const successResponse = (data: any, status: number = 200) => {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

const http = httpRouter();

// POST /workflows
http.route({
  path: "/workflows",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      if (!body.name || typeof body.name !== "string") {
        return errorResponse("Name is required and must be a string", 400);
      }

      const workflowId = await ctx.runMutation(api.workflows.createWorkflow, {
        name: body.name,
        nodes: body.nodes || [],
        edges: body.edges || [],
      });

      return successResponse({ id: workflowId }, 201);
    } catch (error) {
      console.error("Error creating workflow:", error);
      return errorResponse("Failed to create workflow", 500);
    }
  }),
});

// GET /workflows (list all)
http.route({
  path: "/workflows",
  method: "GET",
  handler: httpAction(async (ctx) => {
    try {
      const workflows = await ctx.runQuery(api.workflows.listWorkflows);
      return successResponse(workflows);
    } catch (error) {
      console.error("Error listing workflows:", error);
      return errorResponse("Failed to list workflows", 500);
    }
  }),
});

// Handle all /workflows/* dynamic routes (GET, PATCH, DELETE, POST /run)
http.route({
  pathPrefix: "/workflows/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname.replace("/workflows/", "");
    // Handle /workflows/{id}/run (should be POST, not GET, but included for completeness)
    if (path.endsWith("/run")) {
      return errorResponse(
        "Use POST /workflows/{id}/run to run a workflow",
        405
      );
    }
    // Handle /workflows/{id}
    const id = path;
    if (!id) return errorResponse("Workflow ID is required", 400);
    try {
      const workflow = await ctx.runQuery(api.workflows.getWorkflow, {
        id: id as any,
      });
      if (!workflow) return errorResponse("Workflow not found", 404);
      return successResponse(workflow);
    } catch (error) {
      console.error("Error fetching workflow:", error);
      return errorResponse("Invalid workflow ID", 400);
    }
  }),
});

http.route({
  pathPrefix: "/workflows/",
  method: "PATCH",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.replace("/workflows/", "");
    if (!id) return errorResponse("Workflow ID is required", 400);
    try {
      const body = await request.json();
      await ctx.runMutation(api.workflows.updateWorkflow, {
        id: id as any,
        ...body,
      });
      return successResponse({ success: true });
    } catch (error) {
      console.error("Error updating workflow:", error);
      return errorResponse("Failed to update workflow", 400);
    }
  }),
});

http.route({
  pathPrefix: "/workflows/",
  method: "DELETE",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const id = url.pathname.replace("/workflows/", "");
    if (!id) return errorResponse("Workflow ID is required", 400);
    try {
      await ctx.runMutation(api.workflows.deleteWorkflow, {
        id: id as any,
      });
      return successResponse({ success: true });
    } catch (error) {
      console.error("Error deleting workflow:", error);
      return errorResponse("Failed to delete workflow", 400);
    }
  }),
});

// POST /workflows/{id}/run
http.route({
  pathPrefix: "/workflows/",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const path = url.pathname.replace("/workflows/", "");
    if (path.endsWith("/run")) {
      const id = path.slice(0, -"/run".length);
      if (!id) return errorResponse("Workflow ID is required", 400);
      try {
        const body = await request.json();
        if (!body.initialInputs) {
          return errorResponse(
            "initialInputs is required and must contain city, latitude, and longitude",
            400
          );
        }
        const result = await ctx.runMutation(api.workflows.runWorkflow, {
          workflowId: id as any,
          initialInputs: body.initialInputs,
        });
        return successResponse({
          message: "Workflow executed successfully",
          result,
        });
      } catch (error) {
        console.error("Error running workflow:", error);
        return errorResponse("Failed to execute workflow", 500);
      }
    }
    // If not /run, do not handle here
    return errorResponse("Not found", 404);
  }),
});

// CORS preflight for /workflows and /workflows/*
for (const path of ["/workflows", "/workflows/"]) {
  http.route({
    path,
    method: "OPTIONS",
    handler: httpAction(async () => {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }),
  });
}

export default http;
