#!/usr/bin/env node
// Headless Playwright smoke for /analyze?simcc — the ALL-SCRATCH pipeline
// (SimCC w48 landmarks + run10 recognizer, the exact /practice configuration).
// Drives each of the 8 bundled sample clips through the real browser pipeline
// (onnxruntime-web) and reads back the top-5 predictions, so we can compare
// against the Python reference (simcc-parity-reference.py) and the RTMPose
// pipeline's 7/8 reference. Pattern of analyze-parity-smoke.mjs.
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

  await page.goto(`${BASE}/analyze?simcc`, { waitUntil: "networkidle" });
  // wait for models ready (dot.on)
  await page.waitForSelector(".an-dot.on", { timeout: 120000 });

  const results = {};
  const samples = await page.$$("button.an-sample");
  // map by text
  const byWord = {};
  for (const b of samples) byWord[(await b.innerText()).trim()] = b;

  let top1 = 0, top5 = 0;
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
    const inTop5 = topk.some((t) => t.label === w);
    top1 += pred === w;
    top5 += inTop5;
    results[w] = { pred, topk, top1: pred === w, top5: inTop5 };
    console.error(`${w.padEnd(9)} -> ${pred}${pred === w ? " ✓" : ""}  | ${topk.map((t) => `${t.label} ${t.pct}`).join(", ")}${inTop5 ? "" : "  [target NOT in top-5]"}`);
  }

  await browser.close();
  console.error(`\ntop-1 ${top1}/${WORDS.length} | top-5 ${top5}/${WORDS.length} (RTMPose pipeline reference: 7/8)`);
  console.log(JSON.stringify({ top1, top5, results, errors }, null, 1));
  if (errors.length) console.error(`\nJS ERRORS (${errors.length}):\n` + errors.join("\n"));
}

main().catch((e) => { console.error(e); process.exit(1); });
