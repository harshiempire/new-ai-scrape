/**
 * 🎓 BACKEND TESTING - Express + Prisma
 *
 * Backend testing is DIFFERENT from frontend testing:
 *
 * | Frontend Tests | Backend Tests |
 * |----------------|---------------|
 * | Test UI rendering | Test API responses |
 * | Mock API calls | Mock DATABASE calls |
 * | Use jsdom | Use Node.js directly |
 * | Test components | Test routes & services |
 *
 * Backend testing has 3 main categories:
 *   1. UNIT TESTS: Test individual functions (like formatZodError)
 *   2. INTEGRATION TESTS: Test routes with mocked database
 *   3. E2E TESTS: Test routes with real database (usually in CI)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  successResponse,
  errorResponse,
  formatZodError,
  ErrorCode,
} from "./response";
import { AppError, NotFoundError, ValidationError, ExecutionError } from "./errors";
import { z } from "zod";

// ============================================================================
// 📚 LESSON 1: TESTING UTILITY FUNCTIONS
// ============================================================================
/**
 * Pure functions are the EASIEST to test.
 * No mocking needed - just input → output.
 */

describe("Response Utilities", () => {
  describe("successResponse", () => {
    it("returns correct structure with data", () => {
      // 💡 Create a mock Express response object
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      const testData = { id: "123", name: "Test Workflow" };

      successResponse(mockRes as any, testData);

      // Assert status was set to 200 (default)
      expect(mockRes.status).toHaveBeenCalledWith(200);

      // Assert JSON was called with correct structure
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: testData,
      });
    });

    it("allows custom status code", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      successResponse(mockRes as any, { created: true }, 201);

      expect(mockRes.status).toHaveBeenCalledWith(201);
    });
  });

  describe("errorResponse", () => {
    it("returns correct error structure", () => {
      const mockRes = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
      };

      errorResponse(
        mockRes as any,
        404,
        ErrorCode.NOT_FOUND,
        "Workflow not found",
        { id: "123" }
      );

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: ErrorCode.NOT_FOUND,
          message: "Workflow not found",
          details: { id: "123" },
        },
      });
    });
  });

  describe("formatZodError", () => {
    it("formats Zod validation errors correctly", () => {
      // Create a Zod schema and make it fail
      const schema = z.object({
        name: z.string().min(1),
        age: z.number().positive(),
      });

      const result = schema.safeParse({ name: "", age: -5 });

      if (!result.success) {
        const formatted = formatZodError(result.error);

        expect(formatted.code).toBe(ErrorCode.VALIDATION_ERROR);
        expect(formatted.message).toBe("Validation failed");
        expect(formatted.details).toBeInstanceOf(Array);
        expect((formatted.details as any[]).length).toBeGreaterThan(0);
      }
    });
  });
});

// ============================================================================
// 📚 LESSON 2: TESTING CUSTOM ERROR CLASSES
// ============================================================================
/**
 * Error classes are critical for API consistency.
 * Test that they have correct properties.
 */

describe("Error Classes", () => {
  describe("NotFoundError", () => {
    it("creates error with resource name and ID", () => {
      const error = new NotFoundError("Workflow", "wf-123");

      expect(error.message).toBe("Workflow with ID wf-123 not found");
      expect(error.statusCode).toBe(404);
      expect(error.code).toBe(ErrorCode.NOT_FOUND);
    });

    it("creates error without ID", () => {
      const error = new NotFoundError("User");

      expect(error.message).toBe("User not found");
    });
  });

  describe("ValidationError", () => {
    it("creates error with correct status code", () => {
      const error = new ValidationError("Invalid email format", {
        field: "email",
      });

      expect(error.statusCode).toBe(400);
      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR);
      expect(error.details).toEqual({ field: "email" });
    });
  });

  describe("ExecutionError", () => {
    it("creates error for workflow execution failures", () => {
      const error = new ExecutionError("Node failed to execute", {
        nodeId: "node-1",
      });

      expect(error.statusCode).toBe(409);
      expect(error.code).toBe(ErrorCode.EXECUTION_ERROR);
    });
  });

  describe("AppError base class", () => {
    it("is an instance of Error", () => {
      const error = new AppError(ErrorCode.INTERNAL_ERROR, 500, "Something broke");

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe("AppError");
    });
  });
});

// ============================================================================
// 📚 LESSON 3: TESTING ZOD SCHEMAS
// ============================================================================
/**
 * Validation schemas are critical for API security.
 * Test both valid and invalid inputs!
 */

describe("Zod Schema Validation", () => {
  // Your workflow schema
  const workflowSchema = z.object({
    name: z.string(),
    nodes: z.array(z.any()),
    edges: z.array(z.any()),
  });

  it("accepts valid workflow data", () => {
    const validData = {
      name: "My Workflow",
      nodes: [{ id: "1", type: "start" }],
      edges: [{ source: "1", target: "2" }],
    };

    const result = workflowSchema.safeParse(validData);

    expect(result.success).toBe(true);
  });

  it("rejects workflow without name", () => {
    const invalidData = {
      nodes: [],
      edges: [],
    };

    const result = workflowSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("rejects workflow with wrong types", () => {
    const invalidData = {
      name: 123, // Should be string
      nodes: "not an array", // Should be array
      edges: [],
    };

    const result = workflowSchema.safeParse(invalidData);

    expect(result.success).toBe(false);
  });
});

// ============================================================================
// 📚 LESSON 4: MOCKING PRISMA (Database)
// ============================================================================
/**
 * 💡 KEY CONCEPT: We mock Prisma to avoid hitting the real database.
 *
 * This is the BACKEND equivalent of mocking axios on the frontend.
 *
 * Benefits:
 *   - Tests run FAST (no DB connection)
 *   - Tests are ISOLATED (no shared state)
 *   - Tests are PREDICTABLE (you control the data)
 */

// Mock the Prisma client
vi.mock("../prisma", () => ({
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

import { prisma } from "../prisma";

describe("Prisma Mocking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("can mock workflow.findMany", async () => {
    const mockWorkflows = [
      { id: "1", name: "Workflow 1" },
      { id: "2", name: "Workflow 2" },
    ];

    // Setup mock to return our data
    vi.mocked(prisma.workflow.findMany).mockResolvedValue(mockWorkflows as any);

    // Call the mock
    const result = await prisma.workflow.findMany();

    // Assert
    expect(result).toEqual(mockWorkflows);
    expect(prisma.workflow.findMany).toHaveBeenCalledTimes(1);
  });

  it("can mock workflow.findUnique", async () => {
    const mockWorkflow = {
      id: "wf-123",
      name: "Test Workflow",
      nodes: [],
      edges: [],
    };

    vi.mocked(prisma.workflow.findUnique).mockResolvedValue(mockWorkflow as any);

    const result = await prisma.workflow.findUnique({
      where: { id: "wf-123" },
    });

    expect(result).toEqual(mockWorkflow);
    expect(prisma.workflow.findUnique).toHaveBeenCalledWith({
      where: { id: "wf-123" },
    });
  });

  it("can mock null for not found", async () => {
    // Return null to simulate "not found"
    vi.mocked(prisma.workflow.findUnique).mockResolvedValue(null);

    const result = await prisma.workflow.findUnique({
      where: { id: "non-existent" },
    });

    expect(result).toBeNull();
  });

  it("can mock database errors", async () => {
    // Simulate database connection error
    vi.mocked(prisma.workflow.findMany).mockRejectedValue(
      new Error("Database connection failed")
    );

    await expect(prisma.workflow.findMany()).rejects.toThrow(
      "Database connection failed"
    );
  });
});

// ============================================================================
// 📚 LESSON 5: BACKEND TESTING BEST PRACTICES
// ============================================================================
/**
 * 1. TEST ALL RESPONSE CODES
 *    - 200 OK (success)
 *    - 201 Created (new resource)
 *    - 400 Bad Request (validation error)
 *    - 404 Not Found
 *    - 500 Internal Error
 *
 * 2. TEST EDGE CASES
 *    - Empty arrays
 *    - Missing fields
 *    - Invalid types
 *    - Very long strings
 *
 * 3. MOCK THE DATABASE
 *    - Never hit the real DB in unit tests
 *    - Use a test database for integration tests
 *
 * 4. TEST ERROR HANDLING
 *    - Verify errors are caught and formatted correctly
 *    - Never expose internal errors to users
 *
 * 5. VALIDATE REQUEST BODIES
 *    - Use Zod schemas
 *    - Test both valid and invalid inputs
 *
 * 🚀 RUN BACKEND TESTS:
 *    cd backend
 *    npm run test           # Run once
 *    npm run test:watch     # Watch mode
 */
