import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

/**
 * GET /api/model/active-vocabulary-claim
 *
 * Serves docs/model/active-vocabulary-claim.json from the repo root so the
 * browser can derive activeLabels[] for the prompt-selector UI without
 * loading the model card every time. Per ARCHITECTURE.md#arch-active-module
 * the UI must not ask the model to pass/fail a sign outside activeLabels;
 * this endpoint is the canonical source.
 *
 * Cache-Control: no-store so a freshly promoted active-vocabulary-claim is
 * picked up on the next page load without bundler invalidation.
 */
const RELATIVE_CLAIM_PATH = path.join("docs", "model", "active-vocabulary-claim.json");

/**
 * Walks up from process.cwd() until it finds a directory containing
 * docs/model/active-vocabulary-claim.json. Robust to whether `next start` is
 * launched from web/ (the typical smoke harness pattern) or from the repo
 * root (less common but possible). Returns null when not found.
 */
async function locateClaim(): Promise<string | null> {
  let dir = process.cwd();
  for (let depth = 0; depth < 6; depth += 1) {
    const candidate = path.join(dir, RELATIVE_CLAIM_PATH);
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try the next ancestor.
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

export async function GET() {
  try {
    const claimPath = await locateClaim();
    if (!claimPath) {
      return NextResponse.json(
        { error: `active-vocabulary-claim not found under cwd ${process.cwd()}` },
        { status: 500 },
      );
    }
    const raw = await fs.readFile(claimPath, "utf8");
    const json = JSON.parse(raw);
    return new NextResponse(JSON.stringify(json), {
      status: 200,
      headers: {
        "content-type": "application/json",
        "cache-control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load active-vocabulary-claim.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
