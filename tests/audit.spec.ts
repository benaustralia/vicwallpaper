// Playwright-driven audit over the live site. For every plate it loads
// /?photoId=N in a real browser and records:
//   - the main image's naturalWidth/Height (0 if it failed to decode),
//   - the Cloudinary master file size (Content-Length),
//   - the manifest title (for human readability).
// Outputs a sorted report to ./audit-report.json + console table.
// Run with:  npx playwright test tests/audit.spec.ts --reporter=line
import { test, expect } from "@playwright/test";
import manifest from "../utils/manifest.json";
import fs from "node:fs";

const BASE = "https://vicwallpaper.vercel.app";

interface Row {
  id: number;
  title: string;
  source: string;
  naturalWidth: number;
  naturalHeight: number;
  cldBytes: number;
  cldStatus: number;
  manifestW: number;
  manifestH: number;
  flag: string;
}

test("audit every plate over the live site", async ({ page }) => {
  test.setTimeout(15 * 60_000);
  const rows: Row[] = [];

  for (let i = 0; i < manifest.length; i++) {
    const m = manifest[i] as (typeof manifest)[number];

    // 1. HEAD the Cloudinary master to get true byte size + status
    const head = await page.request.fetch(m.cloudinary_url, { method: "HEAD" });
    const cldBytes = Number(head.headers()["content-length"] || "0");
    const cldStatus = head.status();

    // 2. Open the modal page and inspect the main rendered <img>
    await page.goto(`${BASE}/?photoId=${i}`, { waitUntil: "networkidle" });
    const { naturalWidth, naturalHeight } = await page.evaluate(() => {
      // The main plate is the priority/large img; pick the largest visible img.
      const imgs = [...document.querySelectorAll("img")] as HTMLImageElement[];
      const big = imgs
        .filter((el) => el.naturalWidth > 100)
        .sort((a, b) => b.naturalWidth - a.naturalWidth)[0];
      return {
        naturalWidth: big?.naturalWidth ?? 0,
        naturalHeight: big?.naturalHeight ?? 0,
      };
    });

    const flags: string[] = [];
    if (cldStatus !== 200) flags.push(`cld-${cldStatus}`);
    if (cldBytes < 30_000) flags.push(`tiny-${cldBytes}B`);
    if (naturalWidth === 0) flags.push("no-decode");
    if (
      Number(m.width_px) &&
      naturalWidth &&
      Math.abs(naturalWidth / naturalHeight - Number(m.width_px) / Number(m.height_px)) > 0.05
    ) {
      flags.push("aspect-mismatch");
    }

    rows.push({
      id: i,
      title: m.title,
      source: m.source,
      naturalWidth,
      naturalHeight,
      cldBytes,
      cldStatus,
      manifestW: Number(m.width_px),
      manifestH: Number(m.height_px),
      flag: flags.join(",") || "ok",
    });

    if (i % 10 === 0) console.log(`  …${i}/${manifest.length}`);
  }

  fs.writeFileSync(
    "audit-report.json",
    JSON.stringify(rows, null, 2),
  );

  const bad = rows.filter((r) => r.flag !== "ok");
  console.log("\nFlagged plates (" + bad.length + " / " + rows.length + "):");
  for (const r of bad) {
    console.log(
      `  [${r.id.toString().padStart(3)}] ${r.flag.padEnd(18)} ${r.cldBytes
        .toString()
        .padStart(8)}B  ${r.naturalWidth}×${r.naturalHeight}  ${r.title}`,
    );
  }

  // Sanity expectations
  expect(rows.length).toBe(manifest.length);
  // The build is healthy even with some "tiny" / aspect outliers — those are
  // surfaced for human review, not asserted as failures.
});
