/**
 * 🎓 TESTING FUNDAMENTALS - A Learning Guide
 * 
 * This file demonstrates testing concepts using your actual code.
 * Each test includes comments explaining WHY we test things this way.
 */

import { describe, it, expect } from "vitest";
import {
  validateWorkflow,
  hasCycle,
  getValidationSummary,
  type ValidationError,
} from "./workflow-validation";
import type { WorkflowNode, WorkflowEdge } from "./workflow-types";

// ============================================================================
// 📚 LESSON 1: TEST STRUCTURE
// ============================================================================
// Tests follow the "AAA" pattern:
//   - Arrange: Set up test data
//   - Act: Call the function being tested
//   - Assert: Check the result is what we expect

describe("getValidationSummary", () => {
  // 💡 `describe` groups related tests together
  // 💡 `it` (or `test`) defines a single test case
  
  it("returns valid=true when no errors", () => {
    // Arrange: Create an empty error array
    const errors: ValidationError[] = [];
    
    // Act: Call the function
    const result = getValidationSummary(errors);
    
    // Assert: Check the output
    expect(result.isValid).toBe(true);
    expect(result.errorCount).toBe(0);
    expect(result.warningCount).toBe(0);
  });

  it("returns valid=false when there are errors", () => {
    // Arrange
    const errors: ValidationError[] = [
      { type: "error", message: "Something is wrong" },
    ];
    
    // Act
    const result = getValidationSummary(errors);
    
    // Assert
    expect(result.isValid).toBe(false);
    expect(result.errorCount).toBe(1);
  });

  it("counts warnings separately from errors", () => {
    // Arrange
    const errors: ValidationError[] = [
      { type: "error", message: "Error 1" },
      { type: "warning", message: "Warning 1" },
      { type: "warning", message: "Warning 2" },
    ];
    
    // Act
    const result = getValidationSummary(errors);
    
    // Assert
    expect(result.errorCount).toBe(1);
    expect(result.warningCount).toBe(2);
    expect(result.isValid).toBe(false); // Still false because of error
  });

  it("returns valid=true with only warnings (no errors)", () => {
    // 💡 This is an EDGE CASE - testing boundaries and special scenarios
    const errors: ValidationError[] = [
      { type: "warning", message: "Just a warning" },
    ];
    
    const result = getValidationSummary(errors);
    
    expect(result.isValid).toBe(true); // Warnings don't make it invalid!
    expect(result.warningCount).toBe(1);
  });
});

// ============================================================================
// 📚 LESSON 2: TESTING HELPER DATA (FIXTURES)
// ============================================================================
// Create reusable test data to avoid repetition

// Helper function to create a node (reduces boilerplate)
function createNode(
  id: string, 
  type: string, 
  label = `${type} node`
): WorkflowNode {
  return {
    id,
    type,
    position: { x: 0, y: 0 },
    data: { label, props: {} },
  };
}

// Helper to create an edge
function createEdge(source: string, target: string): WorkflowEdge {
  return {
    id: `${source}-${target}`,
    source,
    target,
  };
}

// ============================================================================
// 📚 LESSON 3: TESTING COMPLEX LOGIC
// ============================================================================

describe("hasCycle", () => {
  // 💡 This function detects cycles in a graph - critical business logic!
  // 💡 We test both "positive" (finds cycle) and "negative" (no cycle) cases
  
  it("returns false for an empty graph", () => {
    expect(hasCycle([], [])).toBe(false);
  });

  it("returns false for a simple linear workflow", () => {
    // Start → API → End (no cycle)
    const nodes = [
      createNode("1", "start"),
      createNode("2", "api"),
      createNode("3", "end"),
    ];
    const edges = [
      createEdge("1", "2"),
      createEdge("2", "3"),
    ];
    
    expect(hasCycle(nodes, edges)).toBe(false);
  });

  it("returns true when a cycle exists", () => {
    // 💡 This is the CRITICAL test - what happens when there IS a cycle?
    // A → B → C → A (cycle!)
    const nodes = [
      createNode("A", "api"),
      createNode("B", "api"),
      createNode("C", "api"),
    ];
    const edges = [
      createEdge("A", "B"),
      createEdge("B", "C"),
      createEdge("C", "A"), // This creates the cycle!
    ];
    
    expect(hasCycle(nodes, edges)).toBe(true);
  });

  it("returns true for a self-referencing node", () => {
    // 💡 Edge case: A → A
    const nodes = [createNode("A", "api")];
    const edges = [createEdge("A", "A")];
    
    expect(hasCycle(nodes, edges)).toBe(true);
  });

  it("returns false for a branching workflow without cycles", () => {
    // 💡 Test complex but valid structure
    //     → B →
    // A →      → D
    //     → C →
    const nodes = [
      createNode("A", "start"),
      createNode("B", "api"),
      createNode("C", "api"),
      createNode("D", "end"),
    ];
    const edges = [
      createEdge("A", "B"),
      createEdge("A", "C"),
      createEdge("B", "D"),
      createEdge("C", "D"),
    ];
    
    expect(hasCycle(nodes, edges)).toBe(false);
  });
});

// ============================================================================
// 📚 LESSON 4: TESTING VALIDATION RULES
// ============================================================================

describe("validateWorkflow", () => {
  // 💡 This is your main validation function - test all the rules!

  describe("start node validation", () => {
    it("returns error when no start node exists", () => {
      const nodes = [createNode("1", "end")];
      const errors = validateWorkflow(nodes, []);
      
      // 💡 Use `expect.arrayContaining` to check if array contains an item
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            message: "Workflow must have at least one Start node",
          }),
        ])
      );
    });

    it("returns warning when multiple start nodes exist", () => {
      const nodes = [
        createNode("1", "start"),
        createNode("2", "start"),
        createNode("3", "end"),
      ];
      const edges = [
        createEdge("1", "3"),
        createEdge("2", "3"),
      ];
      
      const errors = validateWorkflow(nodes, edges);
      
      const multiStartWarning = errors.find(
        e => e.message.includes("Multiple Start nodes")
      );
      expect(multiStartWarning).toBeDefined();
      expect(multiStartWarning?.type).toBe("warning");
      expect(multiStartWarning?.nodeIds).toHaveLength(2);
    });
  });

  describe("end node validation", () => {
    it("returns error when no end node exists", () => {
      const nodes = [createNode("1", "start")];
      const errors = validateWorkflow(nodes, []);
      
      expect(errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: "error",
            message: "Workflow must have at least one End node",
          }),
        ])
      );
    });
  });

  describe("orphaned nodes detection", () => {
    it("warns about nodes not connected to anything", () => {
      const nodes = [
        createNode("1", "start"),
        createNode("2", "api"),     // connected
        createNode("3", "api"),     // orphaned!
        createNode("4", "end"),
      ];
      const edges = [
        createEdge("1", "2"),
        createEdge("2", "4"),
        // Note: node "3" has no edges
      ];
      
      const errors = validateWorkflow(nodes, edges);
      
      const orphanWarning = errors.find(
        e => e.message.includes("orphaned")
      );
      expect(orphanWarning).toBeDefined();
      expect(orphanWarning?.nodeIds).toContain("3");
    });
  });

  describe("valid workflow", () => {
    it("returns no errors for a valid simple workflow", () => {
      // 💡 HAPPY PATH test - the normal, expected use case
      // 
      // 🎓 LESSON: This test originally FAILED because the API node
      // requires a URL. Tests help us discover validation rules we forgot!
      // The API node needs `props: { url: "..." }` to pass validation.
      const nodes: WorkflowNode[] = [
        createNode("1", "start"),
        {
          id: "2",
          type: "api",
          position: { x: 0, y: 0 },
          data: { 
            label: "API Node", 
            props: { url: "https://api.example.com" } // Required!
          },
        },
        createNode("3", "end"),
      ];
      const edges = [
        createEdge("1", "2"),
        createEdge("2", "3"),
      ];
      
      const errors = validateWorkflow(nodes, edges);
      
      // Only errors (not warnings) should fail validation
      const actualErrors = errors.filter(e => e.type === "error");
      expect(actualErrors).toHaveLength(0);
    });
  });
});

// ============================================================================
// 📚 LESSON 5: KEY TESTING PRINCIPLES
// ============================================================================
/*
 * 1. TEST BEHAVIOR, NOT IMPLEMENTATION
 *    - Test what the function DOES, not HOW it does it
 *    - If you refactor the code, tests should still pass
 *
 * 2. ONE ASSERTION CONCEPT PER TEST
 *    - Each test should verify one specific behavior
 *    - Makes it clear what broke when a test fails
 *
 * 3. TEST EDGE CASES
 *    - Empty arrays, null values, boundary conditions
 *    - These are where bugs often hide!
 *
 * 4. USE DESCRIPTIVE TEST NAMES
 *    - "returns error when no start node exists"
 *    - NOT "test1" or "validates stuff"
 *
 * 5. TESTS ARE DOCUMENTATION
 *    - A new developer can read tests to understand the code
 *    - Tests show expected inputs and outputs
 *
 * 🚀 TO RUN THESE TESTS:
 *    cd frontend
 *    npm run test                # Run once
 *    npx vitest                  # Watch mode (re-runs on file changes)
 *    npx vitest --ui             # Visual UI in browser
 */
