/**
 * 🎓 MOCKING FUNDAMENTALS - Level 2 Testing
 *
 * In the previous lesson, you tested PURE functions (input → output).
 * But real-world code has DEPENDENCIES:
 *   - API calls (axios, fetch)
 *   - Databases (Prisma, MongoDB)
 *   - External services (Stripe, AWS)
 *
 * You can't make real API calls in tests because:
 *   1. Tests would be SLOW (network latency)
 *   2. Tests would be UNRELIABLE (server down = test fails)
 *   3. Tests would have SIDE EFFECTS (creating real data)
 *
 * Solution: MOCKING - Replace real dependencies with fake versions you control.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getWorkflows,
  getWorkflowsbyId,
  createWorkflow,
  deleteWorkflowById,
} from "./workflow";
import api from "./index";
import type { Workflow, WorkflowListResponse } from "@/lib/types";

// ============================================================================
// 📚 LESSON 1: MOCKING A MODULE
// ============================================================================
/**
 * `vi.mock()` replaces the REAL module with a FAKE version.
 *
 * When workflow.ts does `import api from "./index"`,
 * it will get our MOCKED version, not the real axios instance.
 */
vi.mock("./index", () => ({
  default: {
    get: vi.fn(),    // vi.fn() creates a "spy" function we can control
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// ============================================================================
// 📚 LESSON 2: TEST LIFECYCLE HOOKS
// ============================================================================
/**
 * Hooks let you run code BEFORE or AFTER tests:
 *   - beforeEach: Runs before EACH test
 *   - afterEach: Runs after EACH test
 *   - beforeAll: Runs once before ALL tests in this file
 *   - afterAll: Runs once after ALL tests in this file
 */

describe("Workflow API", () => {
  // Reset all mocks before each test to avoid "pollution" between tests
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // 📚 LESSON 3: TESTING API GET REQUESTS
  // ============================================================================

  describe("getWorkflows", () => {
    it("fetches and returns workflow list", async () => {
      // 🎯 ARRANGE: Setup mock data and configure the mock function
      const mockWorkflows: WorkflowListResponse = [
        {
          id: "wf-1",
          name: "My First Workflow",
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "wf-2",
          name: "Another Workflow",
          createdAt: "2024-01-02T00:00:00Z",
          updatedAt: "2024-01-02T00:00:00Z",
        },
      ];

      /**
       * 💡 mockResolvedValue() tells the mock what to RETURN when called.
       *
       * Since api.get() returns a Promise, we use mockResolvedValue()
       * which is like: () => Promise.resolve(value)
       */
      vi.mocked(api.get).mockResolvedValue({ data: mockWorkflows });

      // 🎯 ACT: Call the function we're testing
      const result = await getWorkflows();

      // 🎯 ASSERT: Verify the result AND how the mock was called
      expect(result).toEqual(mockWorkflows);

      /**
       * 💡 toHaveBeenCalledWith() verifies the mock was called correctly.
       *
       * This is POWERFUL! We're not just checking the output,
       * we're verifying the function called the RIGHT endpoint.
       */
      expect(api.get).toHaveBeenCalledWith("/workflows");
      expect(api.get).toHaveBeenCalledTimes(1);
    });

    it("returns empty array when no workflows exist", async () => {
      // 💡 Different mock data for a different scenario
      vi.mocked(api.get).mockResolvedValue({ data: [] });

      const result = await getWorkflows();

      expect(result).toEqual([]);
      expect(api.get).toHaveBeenCalledWith("/workflows");
    });
  });

  describe("getWorkflowsbyId", () => {
    it("fetches a single workflow by ID", async () => {
      const mockWorkflow: Workflow = {
        id: "wf-123",
        name: "Test Workflow",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        nodes: [{ id: "node-1", type: "start" }],
        edges: [],
      };

      vi.mocked(api.get).mockResolvedValue({ data: mockWorkflow });

      const result = await getWorkflowsbyId("wf-123");

      expect(result).toEqual(mockWorkflow);
      // 💡 Verify it called the correct URL with the ID
      expect(api.get).toHaveBeenCalledWith("/workflows/wf-123");
    });

    it("passes different IDs correctly", async () => {
      // 💡 Testing with multiple IDs ensures the function is dynamic
      vi.mocked(api.get).mockResolvedValue({ data: { id: "abc" } });

      await getWorkflowsbyId("abc");
      expect(api.get).toHaveBeenCalledWith("/workflows/abc");

      await getWorkflowsbyId("xyz-789");
      expect(api.get).toHaveBeenCalledWith("/workflows/xyz-789");
    });
  });

  // ============================================================================
  // 📚 LESSON 4: TESTING API POST REQUESTS
  // ============================================================================

  describe("createWorkflow", () => {
    it("sends correct data when creating a workflow", async () => {
      const mockCreatedWorkflow: Workflow = {
        id: "new-wf-1",
        name: "New Workflow",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        nodes: [],
        edges: [],
      };

      vi.mocked(api.post).mockResolvedValue({ data: mockCreatedWorkflow });

      const result = await createWorkflow("New Workflow");

      expect(result).toEqual(mockCreatedWorkflow);
      /**
       * 💡 For POST requests, verify BOTH the endpoint AND the body.
       *
       * This catches bugs where:
       *   - Wrong endpoint is called
       *   - Request body is malformed
       *   - Required fields are missing
       */
      expect(api.post).toHaveBeenCalledWith("/workflows", {
        name: "New Workflow",
        nodes: [],
        edges: [],
      });
    });

    it("handles special characters in workflow name", async () => {
      // 💡 Edge case: What if the name has special characters?
      vi.mocked(api.post).mockResolvedValue({
        data: { id: "1", name: "Test & Demo <script>" },
      });

      await createWorkflow("Test & Demo <script>");

      expect(api.post).toHaveBeenCalledWith("/workflows", {
        name: "Test & Demo <script>",
        nodes: [],
        edges: [],
      });
    });
  });

  // ============================================================================
  // 📚 LESSON 5: TESTING API DELETE REQUESTS
  // ============================================================================

  describe("deleteWorkflowById", () => {
    it("deletes a workflow and returns success", async () => {
      vi.mocked(api.delete).mockResolvedValue({
        data: { success: true },
      });

      const result = await deleteWorkflowById("wf-to-delete");

      expect(result).toBe(true);
      expect(api.delete).toHaveBeenCalledWith("/workflows/wf-to-delete");
    });
  });

  // ============================================================================
  // 📚 LESSON 6: TESTING ERROR SCENARIOS
  // ============================================================================
  /**
   * 💡 CRITICAL: Always test what happens when things go WRONG!
   *
   * APIs can fail due to:
   *   - Network errors
   *   - Server errors (500)
   *   - Not found (404)
   *   - Unauthorized (401)
   *   - Validation errors (400)
   */

  describe("error handling", () => {
    it("throws error when API call fails", async () => {
      /**
       * 💡 mockRejectedValue() makes the mock THROW an error
       * (simulates Promise.reject())
       */
      const networkError = new Error("Network Error");
      vi.mocked(api.get).mockRejectedValue(networkError);

      /**
       * 💡 Use expect(...).rejects to test async errors
       *
       * This waits for the promise to reject and checks the error.
       */
      await expect(getWorkflows()).rejects.toThrow("Network Error");
    });

    it("handles 404 not found error", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: "Workflow not found" },
        },
      };
      vi.mocked(api.get).mockRejectedValue(notFoundError);

      await expect(getWorkflowsbyId("non-existent-id")).rejects.toEqual(
        notFoundError
      );
    });

    it("handles server error (500)", async () => {
      const serverError = new Error("Internal Server Error");
      vi.mocked(api.post).mockRejectedValue(serverError);

      await expect(createWorkflow("Test")).rejects.toThrow(
        "Internal Server Error"
      );
    });
  });
});

// ============================================================================
// 📚 LESSON 7: KEY MOCKING CONCEPTS SUMMARY
// ============================================================================
/**
 * MOCKING CHEAT SHEET:
 *
 * 1. vi.mock("./module")
 *    → Replace entire module with fake
 *
 * 2. vi.fn()
 *    → Create a spy function you can control
 *
 * 3. vi.mocked(fn).mockResolvedValue(data)
 *    → Make async function return specific data
 *
 * 4. vi.mocked(fn).mockRejectedValue(error)
 *    → Make async function throw an error
 *
 * 5. expect(fn).toHaveBeenCalledWith(args)
 *    → Verify function was called with correct arguments
 *
 * 6. expect(fn).toHaveBeenCalledTimes(n)
 *    → Verify function was called exactly n times
 *
 * 7. vi.clearAllMocks()
 *    → Reset all mocks between tests
 *
 * 🚀 TO RUN THESE TESTS:
 *    cd frontend
 *    npm run test
 *    npx vitest --watch    # Watch mode
 */
