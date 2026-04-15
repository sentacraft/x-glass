import { test, expect } from "@playwright/test";

const LENS_A = "fujifilm-mkx-18-55mmt29-xf";
const LENS_B = "fujifilm-mkx-50-135mmt29-xf";

// Scrolls the app's custom scroll container (not window — the layout uses a
// div.overflow-y-auto instead of body scroll). Uses scrollBy() to ensure the
// browser fires a real scroll event (unlike setting scrollTop directly).
async function scrollBy(page: import("@playwright/test").Page, deltaY: number) {
  await page.evaluate((dy) => {
    const scroller = document.querySelector<HTMLElement>("div.overflow-y-auto");
    scroller?.scrollBy(0, dy);
  }, deltaY);
}

async function scrollToTop(page: import("@playwright/test").Page) {
  await page.evaluate(() => {
    const scroller = document.querySelector<HTMLElement>("div.overflow-y-auto");
    if (!scroller) return;
    scroller.scrollTop = 0;
    scroller.dispatchEvent(new Event("scroll", { bubbles: false }));
  });
}

// Waits until the scroll container has enough content height to allow scrolling.
async function waitForScrollable(page: import("@playwright/test").Page, minDelta = 200) {
  await page.waitForFunction(
    (minY) => {
      const el = document.querySelector<HTMLElement>("div.overflow-y-auto");
      return el ? el.scrollHeight > el.clientHeight + minY : false;
    },
    minDelta,
    { timeout: 10000 }
  );
}

test.describe("Nav auto-hide (mobile only)", () => {
  // Nav only hides on mobile viewports (< 640px). Skip on desktop Chromium.
  test.beforeEach(async ({ page }, testInfo) => {
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 640) {
      testInfo.skip();
      return;
    }
    await page.goto("/en/lenses");
    // Ensure the lens list has rendered enough content to be scrollable
    await waitForScrollable(page, 200);
  });

  test("nav is visible on page load", async ({ page }) => {
    const header = page.locator("header").first();
    const isOnScreen = await header.evaluate((el) => el.getBoundingClientRect().bottom > 0);
    expect(isOnScreen).toBe(true);
  });

  test("nav hides after scrolling down past threshold", async ({ page }) => {
    await scrollBy(page, 300);
    // Assert on data-hidden (React state) rather than getBoundingClientRect — avoids
    // waiting for the 300ms CSS transition and is unaffected by Playwright's synthetic
    // scroll event timing in mobile emulation.
    const header = page.locator("header").first();
    await expect(header).toHaveAttribute("data-hidden", "true", { timeout: 3000 });
  });

  test("nav reappears after scrolling back up", async ({ page }) => {
    const header = page.locator("header").first();

    await scrollBy(page, 300);
    await expect(header).toHaveAttribute("data-hidden", "true", { timeout: 3000 });

    await scrollBy(page, -400);
    await expect(header).toHaveAttribute("data-hidden", "false", { timeout: 3000 });
  });
});

test.describe("Compare table phantom header", () => {
  // The phantom header is a sticky h-0 div that mirrors column names and floats
  // up once the real <thead> scrolls out of view. It also locks the nav hidden
  // (via lockNav) so two top-chrome elements never compete on mobile.
  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/lenses/compare?ids=${LENS_A},${LENS_B}`);
    await page.locator('[data-testid="compare-phantom-header"]').waitFor({ state: "attached" });
    await waitForScrollable(page, 200);
  });

  test("phantom header is hidden when at the top of the page", async ({ page }) => {
    const phantom = page.locator('[data-testid="compare-phantom-header"]');
    await expect(phantom).toHaveAttribute("data-visible", "false");
  });

  test("phantom header appears after scrolling the table header out of view", async ({
    page,
  }) => {
    await scrollBy(page, 400);
    const phantom = page.locator('[data-testid="compare-phantom-header"]');
    await expect(phantom).toHaveAttribute("data-visible", "true", { timeout: 3000 });
  });

  test("phantom header hides again after scrolling back to top", async ({ page }) => {
    const phantom = page.locator('[data-testid="compare-phantom-header"]');

    await scrollBy(page, 400);
    await expect(phantom).toHaveAttribute("data-visible", "true", { timeout: 3000 });

    await scrollToTop(page);
    await expect(phantom).toHaveAttribute("data-visible", "false", { timeout: 3000 });
  });

  test("nav is locked hidden while phantom header is visible", async ({ page }) => {
    // On mobile, the phantom header locks the nav so they don't both occupy the top
    const viewport = page.viewportSize();
    if (!viewport || viewport.width >= 640) {
      // Nav auto-hide only applies on mobile — skip on desktop
      test.skip();
      return;
    }

    await scrollBy(page, 400);
    const phantom = page.locator('[data-testid="compare-phantom-header"]');
    await expect(phantom).toHaveAttribute("data-visible", "true", { timeout: 3000 });

    const header = page.locator("header").first();
    await expect(header).toHaveAttribute("data-hidden", "true", { timeout: 3000 });
  });
});

test.describe("Compare page share FAB", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/en/lenses/compare?ids=${LENS_A},${LENS_B}`);
    // Wait for the FAB to be rendered before any interaction
    await page.locator('[data-testid="compare-share-fab"]').waitFor({ state: "attached" });
  });

  test("FAB is hidden when header is in view", async ({ page }) => {
    const fab = page.locator('[data-testid="compare-share-fab"]');
    await expect(fab).toHaveAttribute("aria-hidden", "true");
  });

  test("FAB appears after scrolling header out of view", async ({ page }) => {
    await scrollBy(page, 300);

    const fab = page.locator('[data-testid="compare-share-fab"]');
    await expect(fab).toHaveAttribute("aria-hidden", "false", { timeout: 3000 });
  });

  test("FAB hides again after scrolling back to top", async ({ page }) => {
    // Show FAB
    await scrollBy(page, 300);
    const fab = page.locator('[data-testid="compare-share-fab"]');
    await expect(fab).toHaveAttribute("aria-hidden", "false", { timeout: 3000 });

    // Hide FAB by returning to top
    await scrollToTop(page);
    await expect(fab).toHaveAttribute("aria-hidden", "true", { timeout: 3000 });
  });
});
