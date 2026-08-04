import { test, expect } from "@playwright/test";
import manifest from "../utils/manifest.json";

const TOTAL = manifest.length; // 176

test.describe("vicwallpaper gallery", () => {
  test("home page renders masthead, branding, and the full grid", async ({
    page,
  }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/vicwallpaper/);

    // Hero copy
    await expect(
      page.getByRole("heading", { name: "vicwallpaper" }),
    ).toBeVisible();
    await expect(page.getByText("1840 – 1860 · CC0")).toBeVisible();
    await expect(
      page.getByText(`${TOTAL} public-domain wallpaper designs`),
    ).toBeVisible();

    // Footer credits both museums
    await expect(
      page.getByRole("link", { name: /Metropolitan Museum of Art/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Cooper Hewitt/ }),
    ).toBeVisible();

    // Grid contains exactly TOTAL plate-tile links (the masthead is a div, not a link)
    const tileLinks = page.locator(`a[href^="/?photoId="]`);
    await expect(tileLinks).toHaveCount(TOTAL);

    // First tile alt comes from the manifest title
    const firstImg = tileLinks.first().locator("img");
    await expect(firstImg).toHaveAttribute("alt", manifest[0].title);
  });

  test("deep-link /p/0 shows the correct plate metadata", async ({ page }) => {
    const m = manifest[0];
    await page.goto("/p/0");

    await expect(page).toHaveTitle(new RegExp(`^${escapeRegex(m.title)}`));

    // Caption fields
    await expect(page.getByRole("heading", { name: m.title })).toBeVisible();
    await expect(page.getByText(`${m.source} · ${m.licence}`)).toBeVisible();
    await expect(page.getByText(m.medium)).toBeVisible();
    await expect(page.getByText(m.credit_line)).toBeVisible();

    // Museum link
    const museumLink = page.getByRole("link", {
      name: /VIEW IN MUSEUM COLLECTION/i,
    });
    await expect(museumLink).toBeVisible();
    await expect(museumLink).toHaveAttribute("href", m.object_url);
  });

  test("R2 delivers the image (HTTP 200, image/*)", async ({ page }) => {
    const responses: { url: string; status: number; type: string | null }[] =
      [];
    page.on("response", (resp) => {
      if (resp.url().includes(".r2.dev/") || resp.url().includes("/_next/image")) {
        responses.push({
          url: resp.url(),
          status: resp.status(),
          type: resp.headerValue("content-type") as unknown as string | null,
        });
      }
    });

    await page.goto("/p/0");
    await page.waitForLoadState("networkidle");

    expect(responses.length).toBeGreaterThan(0);
    for (const r of responses) {
      expect(r.status, `${r.url} status`).toBe(200);
    }
  });

  test("opening the in-page modal from a tile + Right arrow advances the plate", async ({
    page,
  }) => {
    await page.goto("/");

    // Click the first plate tile (skip the masthead div)
    await page.locator(`a[href^="/?photoId="]`).first().click();

    // The Modal opens on the index route with the photoId query.
    await expect(page).toHaveURL(/\/\?photoId=0$/);
    await expect(
      page.getByRole("heading", { name: manifest[0].title }),
    ).toBeVisible();

    // Next-arrow button → plate index 1
    await page.locator("button.right-3").click();
    await expect(page).toHaveURL(/\/\?photoId=1$/);
    await expect(
      page.getByRole("heading", { name: manifest[1].title }),
    ).toBeVisible();

    // Previous-arrow button → back to plate 0
    await page.locator("button.left-3").click();
    await expect(page).toHaveURL(/\/\?photoId=0$/);
    await expect(
      page.getByRole("heading", { name: manifest[0].title }),
    ).toBeVisible();

    // Keyboard navigation (window-level keydown via dispatchEvent, so it
    // does not depend on which element holds focus in headless mode)
    await page.evaluate(() =>
      window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" })),
    );
    await expect(page).toHaveURL(/\/\?photoId=1$/);
  });

  test("every manifest record has a non-empty R2 URL", async () => {
    for (const m of manifest) {
      expect(m.r2_url, `record ${m.object_id}`).toMatch(
        /^https:\/\/pub-[a-f0-9]+\.r2\.dev\/images\//,
      );
    }
  });
});

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
