/**
 * 🎓 END-TO-END (E2E) TESTING - Level 4
 *
 * You've learned:
 *   ✅ Level 1: Unit tests (pure functions)
 *   ✅ Level 2: Mocking (API calls)
 *   ✅ Level 3: Component tests (React)
 *   🎯 Level 4: E2E tests (THIS LESSON)
 *
 * E2E tests are DIFFERENT from all previous tests:
 *   - They run in a REAL browser (Chrome, Firefox, Safari)
 *   - They test the ENTIRE application (frontend + backend)
 *   - They simulate REAL user behavior (clicking, typing, navigating)
 *   - They are SLOWER but catch integration bugs
 *
 * Think of it like:
 *   - Unit tests: Testing car engine in isolation
 *   - Component tests: Testing dashboard display
 *   - E2E tests: Actually DRIVING the car on a road
 */

import { test, expect } from "@playwright/test";

// ============================================================================
// 📚 LESSON 1: BASIC NAVIGATION AND PAGE ASSERTIONS
// ============================================================================
/**
 * E2E tests always start with navigating to a page.
 * Then you interact with it and assert what you see.
 */

test.describe("Homepage", () => {
  test("loads successfully", async ({ page }) => {
    // 1️⃣ NAVIGATE: Go to the page
    await page.goto("/");

    // 2️⃣ WAIT: Playwright auto-waits for elements
    //    But you can be explicit for clarity
    await page.waitForLoadState("domcontentloaded");

    // 3️⃣ ASSERT: Check the page loaded correctly
    //    The page should have a title
    await expect(page).toHaveURL(/localhost:3000/);
  });

  test("has correct title", async ({ page }) => {
    await page.goto("/");

    // 💡 toHaveTitle checks the <title> tag
    // Use regex for partial matching
    await expect(page).toHaveTitle(/workflow|frontend/i);
  });
});

// ============================================================================
// 📚 LESSON 2: FINDING ELEMENTS (LOCATORS)
// ============================================================================
/**
 * Playwright uses "Locators" to find elements. Priority:
 *
 * | Locator                     | When to use                |
 * |-----------------------------|----------------------------|
 * | page.getByRole()            | Best! Accessibility-based  |
 * | page.getByText()            | Visible text content       |
 * | page.getByLabel()           | Form inputs by label       |
 * | page.getByPlaceholder()     | Inputs by placeholder      |
 * | page.getByTestId()          | Last resort                |
 * | page.locator('css-selector')| When nothing else works    |
 */

test.describe("Locators", () => {
  test("find elements by role", async ({ page }) => {
    await page.goto("/");

    // 💡 getByRole finds elements by their accessibility role
    // Common roles: button, link, heading, textbox, checkbox

    // Find all buttons on the page
    const buttons = page.getByRole("button");
    const buttonCount = await buttons.count();

    console.log(`Found ${buttonCount} buttons on the page`);

    // Find a specific link
    const links = page.getByRole("link");
    expect(await links.count()).toBeGreaterThanOrEqual(0);
  });

  test("find elements by text", async ({ page }) => {
    await page.goto("/");

    // 💡 getByText finds elements containing specific text
    // Useful for verifying content is displayed

    // Check if any heading exists
    const headings = page.getByRole("heading");
    const hasHeadings = (await headings.count()) > 0;

    if (hasHeadings) {
      // Get the first heading's text
      const firstHeading = headings.first();
      await expect(firstHeading).toBeVisible();
    }
  });
});

// ============================================================================
// 📚 LESSON 3: USER INTERACTIONS
// ============================================================================
/**
 * E2E tests simulate real user actions:
 *   - .click() - Click an element
 *   - .fill() - Type into an input
 *   - .press() - Press a key
 *   - .hover() - Hover over element
 *   - .selectOption() - Select dropdown option
 */

test.describe("User Interactions", () => {
  test("can click buttons", async ({ page }) => {
    await page.goto("/");

    // Find a clickable element
    const buttons = page.getByRole("button");

    if ((await buttons.count()) > 0) {
      const firstButton = buttons.first();

      // 💡 Playwright auto-waits for the element to be clickable
      await firstButton.click();

      // Add assertions based on what should happen after click
      // For example: expect(page).toHaveURL('/new-route');
    }
  });

  test("can type in input fields", async ({ page }) => {
    await page.goto("/");

    // Look for any text inputs
    const inputs = page.getByRole("textbox");

    if ((await inputs.count()) > 0) {
      const firstInput = inputs.first();

      // 💡 .fill() clears the input first, then types
      await firstInput.fill("Hello World");

      // Assert the value was entered
      await expect(firstInput).toHaveValue("Hello World");
    }
  });

  test("keyboard shortcuts work", async ({ page }) => {
    await page.goto("/");

    // 💡 .press() simulates keyboard events
    // Common uses: Escape to close modal, Enter to submit

    // Press Escape key
    await page.keyboard.press("Escape");

    // Press key combination
    await page.keyboard.press("Control+a");
  });
});

// ============================================================================
// 📚 LESSON 4: WAITING AND ASSERTIONS
// ============================================================================
/**
 * E2E tests deal with async operations. Playwright handles most waits
 * automatically, but sometimes you need explicit waits.
 */

test.describe("Waiting", () => {
  test("auto-waits for elements", async ({ page }) => {
    await page.goto("/");

    // 💡 Playwright automatically waits for elements before interacting
    // This will wait up to 30 seconds (default timeout) for the element
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });

  test("wait for network requests", async ({ page }) => {
    // 💡 Wait for API calls to complete
    // Useful when page loads data

    // Start waiting for the request BEFORE triggering action
    const responsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/") && response.status() === 200,
      { timeout: 5000 }
    );

    await page.goto("/");

    // This will either get the response or timeout
    try {
      const response = await responsePromise;
      console.log("API response received:", response.url());
    } catch {
      console.log("No API calls made (or timed out)");
    }
  });
});

// ============================================================================
// 📚 LESSON 5: TESTING VISUAL STATES
// ============================================================================

test.describe("Visual States", () => {
  test("check element visibility", async ({ page }) => {
    await page.goto("/");

    const body = page.locator("body");

    // Various visibility assertions
    await expect(body).toBeVisible();
    await expect(body).toBeAttached();
  });

  test("check element is enabled/disabled", async ({ page }) => {
    await page.goto("/");

    const buttons = page.getByRole("button");

    if ((await buttons.count()) > 0) {
      const firstButton = buttons.first();

      // Check if button is enabled (can be clicked)
      await expect(firstButton).toBeEnabled();

      // 💡 Disabled buttons should NOT be clickable
      // await expect(disabledButton).toBeDisabled();
    }
  });
});

// ============================================================================
// 📚 LESSON 6: SCREENSHOTS AND DEBUGGING
// ============================================================================
/**
 * Playwright can capture screenshots and videos for debugging.
 * Incredibly useful when tests fail in CI!
 */

test.describe("Debugging", () => {
  test("take screenshot", async ({ page }) => {
    await page.goto("/");

    // 💡 Capture a screenshot
    await page.screenshot({
      path: "tests/screenshots/homepage.png",
      fullPage: true,
    });

    // The screenshot is saved and can be viewed for debugging
  });

  test("get page content for debugging", async ({ page }) => {
    await page.goto("/");

    // 💡 Get HTML content for debugging
    const html = await page.content();
    console.log("Page HTML length:", html.length);

    // 💡 Get text content of a specific element
    const body = page.locator("body");
    const text = await body.textContent();
    console.log("Body text:", text?.substring(0, 100));
  });
});

// ============================================================================
// 📚 LESSON 7: REAL WORKFLOW TEST EXAMPLE
// ============================================================================
/**
 * This is what a REAL E2E test looks like.
 * It tests an actual user flow in your workflow app.
 *
 * ⚠️ NOTE: This test requires your frontend AND backend to be running!
 *    Run: npm run dev (frontend)
 *    Run: npm run dev (backend)
 */

test.describe("Workflow App - Real User Flow", () => {
  // Skip this test by default (remove .skip when you're ready to run it)
  test.skip("user can view workflows page", async ({ page }) => {
    // Go to the workflows page
    await page.goto("/workflows");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Check if we're on the workflows page
    await expect(page).toHaveURL(/workflows/);

    // Look for workflow-related content
    const heading = page.getByRole("heading");
    await expect(heading.first()).toBeVisible();
  });

  test.skip("user can create a new workflow", async ({ page }) => {
    await page.goto("/workflows");

    // Find and click the "Create" or "New" button
    const createButton = page.getByRole("button", { name: /create|new/i });

    if (await createButton.isVisible()) {
      await createButton.click();

      // Fill in the workflow name
      const nameInput = page.getByRole("textbox");
      await nameInput.fill("My Test Workflow");

      // Submit the form
      const submitButton = page.getByRole("button", { name: /save|create/i });
      await submitButton.click();

      // Verify the workflow was created
      await expect(page.getByText("My Test Workflow")).toBeVisible();
    }
  });
});

// ============================================================================
// 📚 LESSON 8: E2E TESTING BEST PRACTICES
// ============================================================================
/**
 * 1. TEST CRITICAL USER PATHS
 *    Focus on the most important user journeys:
 *    - Login/logout
 *    - Main CRUD operations
 *    - Checkout process
 *
 * 2. KEEP TESTS INDEPENDENT
 *    Each test should set up its own data and clean up after
 *    Don't rely on other tests running first
 *
 * 3. USE REALISTIC DATA
 *    Test with data that looks like real user input
 *    Include edge cases (empty strings, special characters)
 *
 * 4. DON'T TEST EVERYTHING WITH E2E
 *    E2E tests are SLOW. Use them for critical paths only.
 *    Use unit/component tests for detailed logic testing.
 *
 * 5. RUN E2E IN CI/CD
 *    Run E2E tests before deploying to catch integration issues
 *
 * 🚀 COMMANDS TO RUN:
 *    npx playwright test                    # Run all tests
 *    npx playwright test --ui               # Interactive UI mode
 *    npx playwright test --project=chromium # Chrome only
 *    npx playwright test --debug            # Debug mode
 *    npx playwright show-report             # View test report
 *
 * 🎯 IMPORTANT:
 *    Before running E2E tests, start your dev server:
 *    cd frontend && npm run dev
 *    cd backend && npm run dev
 */
