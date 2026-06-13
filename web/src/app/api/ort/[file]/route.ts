import fs from "node:fs/promises";
import path from "node:path";

const ORT_DIST_DIR = path.join(process.cwd(), "node_modules", "onnxruntime-web", "dist");
const ALLOWED_ORT_FILE = /^ort[-.\w]+\.(?:mjs|wasm)$/;

type RouteContext = {
  params: Promise<{ file: string }> | { file: string };
};

export const runtime = "nodejs";

export async function GET(_request: Request, context: RouteContext) {
  const params = await context.params;
  const fileName = path.basename(params.file);
  if (!ALLOWED_ORT_FILE.test(fileName) || fileName !== params.file) {
    return new Response("Not found", { status: 404 });
  }

  const filePath = path.join(ORT_DIST_DIR, fileName);
  if (!filePath.startsWith(`${ORT_DIST_DIR}${path.sep}`)) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await fs.readFile(filePath);
    return new Response(bytes, {
      headers: {
        "cache-control": "public, max-age=31536000, immutable",
        "content-type": fileName.endsWith(".wasm") ? "application/wasm" : "text/javascript",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
