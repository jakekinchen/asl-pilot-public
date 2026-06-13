#!/usr/bin/env node
// Accuracy guard for the perf loop. Runs RTMPose-Hand (the current stage-2 model)
// on tight hand crops from the test video and compares decoded keypoints against
// a saved fp32 RTMPose baseline. Any perf change (model swap, quantization,
// pipeline change that alters the crop) must keep mean keypoint shift <= floor.
//
//   node scripts/accuracy-check.mjs --model public/tracking/rtmpose-hand-int8.onnx [--save-baseline] [--limit N]
//
// Writes/reads test-assets/accuracy-baseline.json (keypoints per sampled crop).
import ort from "onnxruntime-node";
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => { if (v.startsWith("--")) a.push([v.slice(2), arr[i + 1]?.startsWith("--") ? true : arr[i + 1] ?? true]); return a; }, []));
const FRAMES_DIR = args.frames || "/tmp/bench_frames";
const MODEL = args.model || "public/tracking/rtmpose-hand-int8.onnx";
const LIMIT = args.limit ? parseInt(args.limit, 10) : 40;
const SAVE = "save-baseline" in args;
const BASELINE = "test-assets/accuracy-baseline.json";
const TRACK = path.resolve("public/tracking");
const REGION_PX = 96, GRID = 12, RTM_PX = 256, RTM_BINS = 512, K = 21;
const MEAN = [123.675, 116.28, 103.53], STD = [58.395, 57.12, 57.375];
const TARGETS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"];

function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function orderBox(b) { const [x1, y1, x2, y2] = b.map((v) => clamp(v)); return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]; }
function area(img, sx, sy, sw, sh, dw, dh) {
  const src = img.data, W = img.width, H = img.height, out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) { const y0 = Math.max(0, sy + y * sh / dh), y1 = Math.min(H, sy + (y + 1) * sh / dh), iy0 = Math.floor(y0), iy1 = Math.max(iy0 + 1, Math.ceil(y1));
    for (let x = 0; x < dw; x++) { const x0 = Math.max(0, sx + x * sw / dw), x1 = Math.min(W, sx + (x + 1) * sw / dw), ix0 = Math.floor(x0), ix1 = Math.max(ix0 + 1, Math.ceil(x1)); let r = 0, g = 0, b = 0, a = 0;
      for (let iy = iy0; iy < iy1; iy++) { if (iy < 0 || iy >= H) continue; const oy = Math.max(0, Math.min(iy + 1, y1) - Math.max(iy, y0)); if (oy <= 0) continue;
        for (let ix = ix0; ix < ix1; ix++) { if (ix < 0 || ix >= W) continue; const ox = Math.max(0, Math.min(ix + 1, x1) - Math.max(ix, x0)); if (ox <= 0) continue; const wt = ox * oy, p = (iy * W + ix) * 4; r += src[p] * wt; g += src[p + 1] * wt; b += src[p + 2] * wt; a += wt; } }
      const o = (y * dw + x) * 4; if (a > 0) { out[o] = r / a; out[o + 1] = g / a; out[o + 2] = b / a; } out[o + 3] = 255; } }
  return out;
}
function tensor5(rgba, size) { const plane = size * size, d = new Float32Array(5 * plane); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x, p = i * 4; d[i] = rgba[p] / 255; d[plane + i] = rgba[p + 1] / 255; d[2 * plane + i] = rgba[p + 2] / 255; d[3 * plane + i] = x / (size - 1); d[4 * plane + i] = y / (size - 1); } return d; }
function decodeRegion(obj, boxes) { const d = {}; for (let t = 0; t < 4; t++) { let best = 0, bs = -Infinity, base = t * GRID * GRID; for (let i = 0; i < GRID * GRID; i++) if (obj[base + i] > bs) { bs = obj[base + i]; best = i; } const gy = (best / GRID) | 0, gx = best % GRID, box = []; for (let c = 0; c < 4; c++) box.push(boxes[((t * 4 + c) * GRID + gy) * GRID + gx]); d[TARGETS[t]] = { box: orderBox(box), score: bs }; } return d; }

async function main() {
  const region = await ort.InferenceSession.create(path.join(TRACK, "detector0-grid-big2.onnx"));
  const rtm = await ort.InferenceSession.create(path.resolve(MODEL));
  let files = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".jpg")).sort();
  const step = Math.max(1, Math.floor(files.length / LIMIT));
  files = files.filter((_, i) => i % step === 0).slice(0, LIMIT);
  const samples = [];
  for (const f of files) {
    const img = await loadImage(path.join(FRAMES_DIR, f));
    const cv = createCanvas(img.width, img.height), cx = cv.getContext("2d"); cx.drawImage(img, 0, 0);
    const source = cx.getImageData(0, 0, img.width, img.height), w = img.width, h = img.height;
    const ro = await region.run({ frames_xy: new ort.Tensor("float32", tensor5(area(source, 0, 0, w, h, REGION_PX, REGION_PX), REGION_PX), [1, 5, REGION_PX, REGION_PX]) });
    const reg = decodeRegion(ro.objectness_logits.data, ro.boxes_xyxy_norm.data);
    for (const hand of ["left_or_first_hand", "right_or_second_hand"]) {
      if (reg[hand].score <= 1.0) continue;
      const box = reg[hand].box, px1 = box[0] * w, py1 = box[1] * h, px2 = box[2] * w, py2 = box[3] * h;
      const bw = Math.max(2, px2 - px1), bh = Math.max(2, py2 - py1); let side = Math.min(Math.max(bw, bh) * 1.8, Math.min(w, h));
      const cx0 = Math.min(Math.max(0, (px1 + px2) / 2 - side / 2), w - side), cy0 = Math.min(Math.max(0, (py1 + py2) / 2 - side / 2), h - side);
      const rgba = area(source, cx0, cy0, side, side, RTM_PX, RTM_PX), plane = RTM_PX * RTM_PX, data = new Float32Array(3 * plane);
      for (let q = 0; q < plane; q++) { const p = q * 4; data[q] = (rgba[p] - MEAN[0]) / STD[0]; data[plane + q] = (rgba[p + 1] - MEAN[1]) / STD[1]; data[2 * plane + q] = (rgba[p + 2] - MEAN[2]) / STD[2]; }
      const out = await rtm.run({ input: new ort.Tensor("float32", data, [1, 3, RTM_PX, RTM_PX]) });
      const ax = out.simcc_x.data, ay = out.simcc_y.data, kp = [];
      for (let k = 0; k < K; k++) { const base = k * RTM_BINS; let bx = 0, bxv = -Infinity, by = 0, byv = -Infinity; for (let b = 0; b < RTM_BINS; b++) { if (ax[base + b] > bxv) { bxv = ax[base + b]; bx = b; } if (ay[base + b] > byv) { byv = ay[base + b]; by = b; } } kp.push([bx / RTM_BINS, by / RTM_BINS]); }
      samples.push({ key: `${f}:${hand}`, kp });
    }
  }
  if (SAVE) { fs.mkdirSync("test-assets", { recursive: true }); fs.writeFileSync(BASELINE, JSON.stringify(samples)); console.log(`saved baseline: ${samples.length} crops -> ${BASELINE}`); return; }
  if (!fs.existsSync(BASELINE)) { console.error("no baseline; run with --save-baseline first"); process.exit(2); }
  const base = JSON.parse(fs.readFileSync(BASELINE, "utf8"));
  const bmap = new Map(base.map((s) => [s.key, s.kp]));
  let n = 0, sum = 0, mx = 0, matched = 0;
  for (const s of samples) { const b = bmap.get(s.key); if (!b) continue; matched++; for (let k = 0; k < K; k++) { const d = Math.hypot(s.kp[k][0] - b[k][0], s.kp[k][1] - b[k][1]); sum += d; mx = Math.max(mx, d); n++; } }
  const mean = n ? sum / n : 1;
  console.log(JSON.stringify({ model: MODEL, cropsNow: samples.length, baselineCrops: base.length, matchedCrops: matched, meanShift: +mean.toFixed(4), maxShift: +mx.toFixed(4), coverage: +(samples.length / base.length).toFixed(3) }, null, 2));
  console.log(`\nmeanShift ${mean.toFixed(4)} (floor 0.02)  maxShift ${mx.toFixed(4)}  coverage ${(samples.length / base.length * 100).toFixed(0)}%`);
  if (mean > 0.02) { console.log("ACCURACY FLOOR BREACHED"); process.exit(1); }
  console.log("accuracy OK");
}
main().catch((e) => { console.error(e); process.exit(1); });
