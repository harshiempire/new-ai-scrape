/**
 * 🎓 INTEGRATION TESTING - Testing API Routes
 *
 * This is the SECOND type of backend testing:
 *
 * | Type | What | Speed | Mocked |
 * |------|------|-------|--------|
 * | Unit ✅ | Functions | ⚡ 5ms | Everything |
 * | Integration 🎯 | API Routes | 🔄 100ms | Database only |
 * | E2E | Full flow | 🐢 1s+ | Nothing |
 *
 * Integration tests:
 *   - Send REAL HTTP requests to your routes
 *   - Test the FULL route handler logic
 *   - Mock only the DATABASE (Prisma)
 *   - Verify response status, headers, and body
 *
 * We use SUPERTEST - the industry standard for Express testing:
 *   - request(app).get("/api/workflows")
 *   - .expect(200)
 *   - .expect("Content-Type", /json/)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import app from "./app";
import { prisma } from "../prisma";

// ============================================================================
// 📚 LESSON 1: MOCKING PRISMA FOR INTEGRATION TESTS
// ============================================================================
/**
 * We mock Prisma BEFORE importing the routes.
 * This ensures all database calls go through our mock.
 */
vi.mock("../lib/prisma", () => ({
  prisma: {
    workflow: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    execution: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    executionData: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Import after mocking!

describe("Workflow API Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 📚 LESSON 2: TESTING GET REQUESTS
  // ============================================================================

  describe("GET /api/workflows", () => {
    it("returns empty array when no workflows exist", async () => {
      // Setup: Mock returns empty array
      vi.mocked(prisma.workflow.findMany).mockResolvedValue([]);

      // Act: Make real HTTP request
      const response = await request(app)
        .get("/api/workflows")
        .expect("Content-Type", /json/)
        .expect(200);

      // Assert: Check response body
      expect(response.body).toEqual({
        success: true,
        data: [],
      });

      // Verify Prisma was called correctly
      expect(prisma.workflow.findMany).toHaveBeenCalledTimes(1);
    });

    it("returns list of workflows", async () => {
      const mockWorkflows = [
        {
          id: "wf-1",
          name: "First Workflow",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-01"),
        },
        {
          id: "wf-2",
          name: "Second Workflow",
          createdAt: new Date("2024-01-02"),
          updatedAt: new Date("2024-01-02"),
        },
      ];

      vi.mocked(prisma.workflow.findMany).mockResolvedValue(
        mockWorkflows as any,
      );

      const response = await request(app).get("/api/workflows").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe("First Workflow");
    });
  });

  describe("GET /api/workflows/:id", () => {
    it("returns workflow by ID", async () => {
      const mockWorkflow = {
        id: "wf-123",
        name: "My Workflow",
        nodes: [{ id: "node-1", type: "start" }],
        edges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(
        mockWorkflow as any,
      );

      const response = await request(app)
        .get("/api/workflows/wf-123")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("wf-123");
      expect(response.body.data.name).toBe("My Workflow");
    });

    it("returns 404 when workflow not found", async () => {
      // Setup: Mock returns null (not found)
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/workflows/non-existent-id")
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("NOT_FOUND");
    });
  });

  // ============================================================================
  // 📚 LESSON 3: TESTING POST REQUESTS (Create)
  // ============================================================================

  describe("POST /api/workflows", () => {
    it("creates a new workflow with valid data", async () => {
      const newWorkflow = {
        name: "New Workflow",
        nodes: [],
        edges: [],
      };

      const createdWorkflow = {
        id: "wf-new-123",
        ...newWorkflow,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.workflow.create).mockResolvedValue(
        createdWorkflow as any,
      );

      const response = await request(app)
        .post("/api/workflows")
        .send(newWorkflow)
        .expect("Content-Type", /json/)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe("wf-new-123");
      expect(response.body.data.name).toBe("New Workflow");

      // Verify Prisma was called with correct data
      expect(prisma.workflow.create).toHaveBeenCalledWith({
        data: newWorkflow,
      });
    });

    it("returns 400 for invalid workflow data", async () => {
      // Send invalid data (missing required fields)
      const response = await request(app)
        .post("/api/workflows")
        .send({ invalid: "data" })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when name is missing", async () => {
      const response = await request(app)
        .post("/api/workflows")
        .send({ nodes: [], edges: [] })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  // ============================================================================
  // 📚 LESSON 4: TESTING PATCH REQUESTS (Update)
  // ============================================================================

  describe("PATCH /api/workflows/:id", () => {
    it("updates workflow name", async () => {
      const updatedWorkflow = {
        id: "wf-123",
        name: "Updated Name",
        nodes: [],
        edges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.workflow.update).mockResolvedValue(
        updatedWorkflow as any,
      );

      const response = await request(app)
        .patch("/api/workflows/wf-123")
        .send({ name: "Updated Name" })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe("Updated Name");
    });

    it("updates workflow nodes", async () => {
      const newNodes = [
        { id: "node-1", type: "start" },
        { id: "node-2", type: "api" },
      ];

      const updatedWorkflow = {
        id: "wf-123",
        name: "Workflow",
        nodes: newNodes,
        edges: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.workflow.update).mockResolvedValue(
        updatedWorkflow as any,
      );

      const response = await request(app)
        .patch("/api/workflows/wf-123")
        .send({ nodes: newNodes })
        .expect(200);

      expect(response.body.data.nodes).toHaveLength(2);
    });
  });

  // ============================================================================
  // 📚 LESSON 5: TESTING DELETE REQUESTS
  // ============================================================================

  describe("DELETE /api/workflows/:id", () => {
    it("deletes workflow successfully", async () => {
      vi.mocked(prisma.workflow.delete).mockResolvedValue({} as any);

      const response = await request(app)
        .delete("/api/workflows/wf-123")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.deleted).toBe(true);

      // Verify delete was called with correct ID
      expect(prisma.workflow.delete).toHaveBeenCalledWith({
        where: { id: "wf-123" },
      });
    });
  });

  // ============================================================================
  // 📚 LESSON 6: TESTING ERROR HANDLING
  // ============================================================================

  describe("Error Handling", () => {
    it("handles database errors gracefully", async () => {
      // Simulate database connection error
      vi.mocked(prisma.workflow.findMany).mockRejectedValue(
        new Error("Database connection failed"),
      );

      const response = await request(app).get("/api/workflows").expect(500);

      expect(response.body.success).toBe(false);
      // Error should be caught and formatted
    });

    it("returns JSON for all error responses", async () => {
      vi.mocked(prisma.workflow.findUnique).mockResolvedValue(null);

      const response = await request(app)
        .get("/api/workflows/not-found")
        .expect("Content-Type", /json/);

      expect(response.body).toHaveProperty("success", false);
      expect(response.body).toHaveProperty("error");
    });
  });
});

// ============================================================================
// 📚 LESSON 7: TESTING OTHER ROUTES
// ============================================================================

describe("Executions API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/executions", () => {
    it("returns list of executions", async () => {
      const mockExecutions = [
        { id: "exec-1", workflowId: "wf-1", status: "Completed" },
        { id: "exec-2", workflowId: "wf-1", status: "Running" },
      ];

      vi.mocked(prisma.execution.findMany).mockResolvedValue(
        mockExecutions as any,
      );

      const response = await request(app).get("/api/executions").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("filters executions by workflowId", async () => {
      vi.mocked(prisma.execution.findMany).mockResolvedValue([]);

      await request(app).get("/api/executions?workflowId=wf-123").expect(200);

      expect(prisma.execution.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            workflowId: "wf-123",
          }),
        }),
      );
    });
  });
});

// ============================================================================
// 📚 INTEGRATION TESTING BEST PRACTICES
// ============================================================================
/**
 * 1. SEPARATE APP FROM SERVER
 *    Export app without .listen() so tests can use supertest
 *
 * 2. MOCK DATABASE ONLY
 *    Let everything else run normally (middleware, validation, etc.)
 *
 * 3. TEST ALL HTTP METHODS
 *    GET, POST, PUT, PATCH, DELETE
 *
 * 4. TEST ALL RESPONSE CODES
 *    200, 201, 400, 404, 500
 *
 * 5. TEST BOTH SUCCESS AND ERROR PATHS
 *    Don't just test happy paths!
 *
 * 6. VERIFY REQUEST BODY HANDLING
 *    Test that your routes parse and validate input correctly
 *
 * 7. CHECK RESPONSE STRUCTURE
 *    Verify { success, data } or { success, error } format
 *
 * 🚀 RUN TESTS:
 *    cd backend
 *    npm run test
 */
