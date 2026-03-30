/**
 * 🎓 REACT COMPONENT TESTING - Level 3
 *
 * You've learned:
 *   ✅ Level 1: Unit tests (pure functions)
 *   ✅ Level 2: Mocking (API calls)
 *   🎯 Level 3: React component testing (THIS LESSON)
 *
 * Component testing answers:
 *   - Does the component RENDER correctly?
 *   - Does it display the RIGHT content?
 *   - Does it respond to USER INTERACTIONS?
 *   - Does it handle DIFFERENT PROPS correctly?
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Info } from "./Info";
import { Button } from "./ui/button";

// ============================================================================
// 📚 LESSON 1: THE RENDER → QUERY → ASSERT PATTERN
// ============================================================================
/**
 * Component testing follows a pattern similar to unit testing:
 *
 *   1. RENDER: Mount the component in a virtual DOM
 *   2. QUERY: Find elements in the rendered output
 *   3. ASSERT: Check that elements exist and have correct content
 */

describe("Info Component", () => {
    it("renders label and value correctly", () => {
        // 1️⃣ RENDER: Mount the component with props
        render(<Info label="Status" value="Active" />);

        // 2️⃣ QUERY: Find elements by their text content
        //    screen.getByText() finds an element containing this text
        const labelElement = screen.getByText("Status");
        const valueElement = screen.getByText("Active");

        // 3️⃣ ASSERT: Check the elements exist
        expect(labelElement).toBeInTheDocument();
        expect(valueElement).toBeInTheDocument();
    });

    it("renders numeric values correctly", () => {
        // 💡 Testing with different data types
        render(<Info label="Count" value={42} />);

        expect(screen.getByText("Count")).toBeInTheDocument();
        expect(screen.getByText("42")).toBeInTheDocument();
    });

    it("renders with different props correctly", () => {
        // 💡 Test multiple scenarios to ensure component is flexible
        const testCases = [
            { label: "Name", value: "John" },
            { label: "Age", value: 25 },
            { label: "Empty", value: "" },
            { label: "Long text", value: "This is a very long value that might wrap" },
        ];

        testCases.forEach(({ label, value }) => {
            const { unmount } = render(<Info label={label} value={value} />);
            expect(screen.getByText(label)).toBeInTheDocument();
            if (value !== "") {
                expect(screen.getByText(String(value))).toBeInTheDocument();
            }
            // Clean up before next iteration
            unmount();
        });
    });
});

// ============================================================================
// 📚 LESSON 2: QUERYING ELEMENTS
// ============================================================================
/**
 * There are multiple ways to find elements:
 *
 * | Method          | When to use                          |
 * |-----------------|--------------------------------------|
 * | getByText       | Find by visible text content         |
 * | getByRole       | Find by accessibility role           |
 * | getByLabelText  | Find form inputs by label            |
 * | getByTestId     | Find by data-testid attribute        |
 * | getByAltText    | Find images by alt text              |
 *
 * Priority (best → worst):
 *   1. getByRole (most accessible)
 *   2. getByLabelText (for forms)
 *   3. getByText (for content)
 *   4. getByTestId (last resort)
 */

describe("Button Component - Query Methods", () => {
    it("can be found by role", () => {
        render(<Button>Click Me</Button>);

        // 💡 getByRole is preferred - it queries like assistive technology does
        const button = screen.getByRole("button");
        expect(button).toBeInTheDocument();
    });

    it("can be found by text content", () => {
        render(<Button>Submit Form</Button>);

        const button = screen.getByText("Submit Form");
        expect(button).toBeInTheDocument();
    });

    it("can query by role AND text together", () => {
        // 💡 You can combine queries for precision
        render(
            <div>
                <span>Click Me</span>
                <Button>Click Me</Button>
            </div>
        );

        // This finds the BUTTON with text "Click Me", not the span
        const button = screen.getByRole("button", { name: "Click Me" });
        expect(button).toBeInTheDocument();
    });
});

// ============================================================================
// 📚 LESSON 3: TESTING USER INTERACTIONS
// ============================================================================
/**
 * Components respond to user actions. We can simulate:
 *   - Clicks (fireEvent.click)
 *   - Typing (fireEvent.change)
 *   - Form submissions (fireEvent.submit)
 *   - Keyboard events (fireEvent.keyDown)
 */

describe("Button Component - User Interactions", () => {
    it("calls onClick handler when clicked", () => {
        // 1️⃣ Create a mock function to track calls
        const handleClick = vi.fn();

        // 2️⃣ Render button with the mock handler
        render(<Button onClick={handleClick}>Click Me</Button>);

        // 3️⃣ Find and click the button
        const button = screen.getByRole("button");
        fireEvent.click(button);

        // 4️⃣ Assert the handler was called
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("calls onClick multiple times when clicked multiple times", () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Click</Button>);

        const button = screen.getByRole("button");

        // Click 3 times
        fireEvent.click(button);
        fireEvent.click(button);
        fireEvent.click(button);

        expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it("does not call onClick when disabled", () => {
        const handleClick = vi.fn();
        render(
            <Button onClick={handleClick} disabled>
                Disabled Button
            </Button>
        );

        const button = screen.getByRole("button");
        fireEvent.click(button);

        // 💡 Disabled buttons should NOT trigger handlers
        expect(handleClick).not.toHaveBeenCalled();
    });
});

// ============================================================================
// 📚 LESSON 4: TESTING COMPONENT VARIANTS
// ============================================================================
/**
 * Components often have variants (different styles/behaviors based on props).
 * Test that each variant renders correctly.
 */

describe("Button Component - Variants", () => {
    it("renders default variant with correct styles", () => {
        render(<Button variant="default">Default</Button>);

        const button = screen.getByRole("button");
        // 💡 Check that CSS classes are applied correctly
        expect(button).toHaveClass("bg-primary");
    });

    it("renders destructive variant for dangerous actions", () => {
        render(<Button variant="destructive">Delete</Button>);

        const button = screen.getByRole("button");
        expect(button).toHaveClass("bg-destructive");
    });

    it("renders different sizes correctly", () => {
        const { rerender } = render(<Button size="sm">Small</Button>);
        expect(screen.getByRole("button")).toHaveClass("h-8");

        // 💡 rerender() updates the component with new props
        rerender(<Button size="lg">Large</Button>);
        expect(screen.getByRole("button")).toHaveClass("h-10");
    });
});

// ============================================================================
// 📚 LESSON 5: TESTING ACCESSIBILITY
// ============================================================================
/**
 * Good tests verify accessibility features:
 *   - Proper ARIA labels
 *   - Keyboard navigation
 *   - Screen reader support
 */

describe("Button Component - Accessibility", () => {
    it("has correct aria attributes", () => {
        render(
            <Button aria-label="Close dialog" aria-pressed={false}>
                ×
            </Button>
        );

        const button = screen.getByRole("button", { name: "Close dialog" });
        expect(button).toHaveAttribute("aria-pressed", "false");
    });

    it("is focusable via keyboard", () => {
        render(<Button>Focus Me</Button>);

        const button = screen.getByRole("button");

        // Simulate focus (like when user tabs to element)
        button.focus();
        expect(button).toHaveFocus();
    });

    it("disabled buttons are not focusable for keyboard navigation", () => {
        render(<Button disabled>Cannot Focus</Button>);

        const button = screen.getByRole("button");
        expect(button).toBeDisabled();
    });
});

// ============================================================================
// 📚 LESSON 6: ASYNC QUERIES
// ============================================================================
/**
 * Sometimes content appears AFTER rendering (loading states, API calls).
 * Use async queries:
 *
 *   - findByText (waits for element to appear)
 *   - waitFor (waits for condition to be true)
 *   - queryByText (returns null if not found, instead of throwing)
 */

describe("Query Types", () => {
    it("getBy throws if element not found", () => {
        render(<Info label="Test" value="Value" />);

        // 💡 getByText THROWS if element doesn't exist
        expect(() => screen.getByText("Non-existent")).toThrow();
    });

    it("queryBy returns null if element not found", () => {
        render(<Info label="Test" value="Value" />);

        // 💡 queryByText returns NULL instead of throwing
        const element = screen.queryByText("Non-existent");
        expect(element).toBeNull();
    });

    // 💡 This is useful for testing that something does NOT exist:
    it("element does not exist in document", () => {
        render(<Info label="Name" value="John" />);

        expect(screen.queryByText("Jane")).not.toBeInTheDocument();
    });
});

// ============================================================================
// 📚 LESSON 7: COMPONENT TESTING BEST PRACTICES
// ============================================================================
/**
 * 1. TEST USER BEHAVIOR, NOT IMPLEMENTATION
 *    ❌ Bad:  expect(component.state.isOpen).toBe(true)
 *    ✅ Good: expect(screen.getByRole("dialog")).toBeVisible()
 *
 * 2. USE ACCESSIBLE QUERIES
 *    ❌ Bad:  screen.getByTestId("submit-button")
 *    ✅ Good: screen.getByRole("button", { name: "Submit" })
 *
 * 3. ONE CONCEPT PER TEST
 *    Each test should verify one specific behavior
 *
 * 4. TEST EDGE CASES
 *    - Empty props
 *    - Very long text
 *    - Missing optional props
 *
 * 5. DON'T TEST IMPLEMENTATION DETAILS
 *    - Don't test internal state
 *    - Don't test CSS class names (unless necessary for variants)
 *    - Test WHAT the user sees, not HOW it's built
 *
 * 🚀 TO RUN THESE TESTS:
 *    cd frontend
 *    npm run test
 */
