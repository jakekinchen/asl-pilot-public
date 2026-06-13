#!/usr/bin/env node
// Headless Playwright smoke for /analyze. Drives each of the 8 bundled sample
// clips through the real RTMPose pipeline in the browser and reads back the
// top-5 predictions, so we can compare against the Python reference.
import { chromium } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3210";
const WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"];

async function main() {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push("console: " + m.text()); });

  await page.goto(`${BASE}/analyze`, { waitUntil: "networkidle" });
  // wait for models ready (dot.on)
  await page.waitForSelector(".an-dot.on", { timeout: 120000 });

  const results = {};
  const samples = await page.$$("button.an-sample");
  // map by text
  const byWord = {};
  for (const b of samples) byWord[(await b.innerText()).trim()] = b;

  for (const w of WORDS) {
    const btn = byWord[w];
    if (!btn) { results[w] = { error: "no sample button" }; continue; }
    await btn.click();
    // wait for the video to load (Analyze enabled)
    const go = page.locator("button.an-go");
    await page.waitForFunction(() => {
      const b = document.querySelector("button.an-go");
      return b && !b.disabled;
    }, { timeout: 30000 });
    await go.click();
    // wait until analysis finishes and a prediction shows
    await page.waitForSelector(".an-pred", { timeout: 180000 });
    // ensure not still analyzing
    await page.waitForFunction(() => {
      const b = document.querySelector("button.an-go");
      return b && !b.disabled;
    }, { timeout: 180000 });
    const pred = (await page.locator(".an-pred").innerText()).trim();
    const topk = await page.$$eval(".an-topk li", (lis) =>
      lis.map((li) => {
        const strong = li.querySelector("strong");
        const pct = strong ? strong.innerText.trim() : "";
        const label = li.firstChild ? li.firstChild.textContent.trim() : li.innerText.trim();
        return { label, pct };
      }),
    );
    results[w] = { pred, topk };
    console.error(`${w.padEnd(9)} -> ${pred}  | ${topk.map((t) => `${t.label} ${t.pct}`).join(", ")}`);
  }

  await browser.close();
  console.log(JSON.stringify({ results, errors }, null, 1));
  if (errors.length) console.error(`\nJS ERRORS (${errors.length}):\n` + errors.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
