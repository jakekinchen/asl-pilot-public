import { promises as fs } from "node:fs";
import path from "node:path";

const PROJECT_ROOT = path.resolve(process.cwd(), "..");
const CONTACT_SHEET_ROOT = path.join(
  PROJECT_ROOT,
  "docs",
  "validation",
  "asl-citizen-primarymath-remediation-roi-heuristic-128-f24-contact-sheets",
);
const ALLOWED_LABELS = new Set(["answer", "first", "small", "stop", "wait"]);

type RouteContext = {
  params: Promise<{ label: string }> | { label: string };
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const label = path.basename(params.label, ".png");
  if (!ALLOWED_LABELS.has(label) || label !== params.label.replace(/\.png$/, "")) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(CONTACT_SHEET_ROOT, `${label}.png`);
  if (!filePath.startsWith(`${CONTACT_SHEET_ROOT}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "cache-control": "no-store",
        "content-type": "image/png",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
