#!/usr/bin/env node
// Headless benchmark of the live-tracking pipeline on fixed video frames.
// Mirrors web/src/lib/live-tracker.ts exactly (region -> coarse -> 2x RTMPose),
// timing each stage via onnxruntime-node. Stable, reproducible numbers for the
// autonomous optimization loop. NOT the browser WebGPU path — it's a consistent
// RELATIVE harness (CPU EP): use it to measure optimization DELTAS; the absolute
// browser-perf floor is the wasm Playwright run (bench-browser.mjs).
//
//   node scripts/bench-pipeline.mjs [--frames DIR] [--limit N] [--passes K]
import ort from "onnxruntime-node";
import fs from "node:fs";
import path from "node:path";
import { createCanvas, loadImage } from "@napi-rs/canvas";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => {
  if (v.startsWith("--")) a.push([v.slice(2), arr[i + 1]]);
  return a;
}, []));
const FRAMES_DIR = args.frames || "/tmp/bench_frames";
const LIMIT = args.limit ? parseInt(args.limit, 10) : 0;
const PASSES = args.passes ? parseInt(args.passes, 10) : 3;
const TRACK = path.resolve("public/tracking");

const REGION_PX = 96, CROP_PX = 128, GRID = 12, LM_GRID = 32, K = 21;
const RTM_PX = 256, RTM_BINS = 512;
const RTM_MEAN = [123.675, 116.28, 103.53], RTM_STD = [58.395, 57.12, 57.375];
const REGION_TARGETS = ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"];

function clamp(v, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, v)); }
function sigmoid(v) { return 1 / (1 + Math.exp(-v)); }
function orderBox(b) { const [x1, y1, x2, y2] = b.map((v) => clamp(v)); return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]; }
function expandCrop([x1, y1, x2, y2]) { const w = x2 - x1, h = y2 - y1; return [Math.max(0, x1 - 0.25 * w), Math.max(0, y1 - 0.35 * h), Math.min(1, x2 + 0.25 * w), Math.min(1, y2 + 0.12 * h)]; }

// area-weighted resampler — identical math to live-tracker.cropResizeRgbaArea
function cropResizeRgbaArea(img, sx, sy, sw, sh, dw, dh) {
  const src = img.data, W = img.width, H = img.height;
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const y0 = Math.max(0, sy + y * sh / dh), y1 = Math.min(H, sy + (y + 1) * sh / dh);
    const iy0 = Math.floor(y0), iy1 = Math.max(iy0 + 1, Math.ceil(y1));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.max(0, sx + x * sw / dw), x1 = Math.min(W, sx + (x + 1) * sw / dw);
      const ix0 = Math.floor(x0), ix1 = Math.max(ix0 + 1, Math.ceil(x1));
      let r = 0, g = 0, b = 0, area = 0;
      for (let iy = iy0; iy < iy1; iy++) {
        if (iy < 0 || iy >= H) continue;
        const oy = Math.max(0, Math.min(iy + 1, y1) - Math.max(iy, y0));
        if (oy <= 0) continue;
        for (let ix = ix0; ix < ix1; ix++) {
          if (ix < 0 || ix >= W) continue;
          const ox = Math.max(0, Math.min(ix + 1, x1) - Math.max(ix, x0));
          if (ox <= 0) continue;
          const wgt = ox * oy, p = (iy * W + ix) * 4;
          r += src[p] * wgt; g += src[p + 1] * wgt; b += src[p + 2] * wgt; area += wgt;
        }
      }
      const o = (y * dw + x) * 4;
      if (area > 0) { out[o] = r / area; out[o + 1] = g / area; out[o + 2] = b / area; }
      out[o + 3] = 255;
    }
  }
  return out;
}
function tensor5(rgba, size) {
  const plane = size * size, d = new Float32Array(5 * plane);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x, p = i * 4;
    d[i] = rgba[p] / 255; d[plane + i] = rgba[p + 1] / 255; d[2 * plane + i] = rgba[p + 2] / 255;
    d[3 * plane + i] = size > 1 ? x / (size - 1) : 0; d[4 * plane + i] = size > 1 ? y / (size - 1) : 0;
  }
  return d;
}
function decodeRegion(obj, boxes) {
  const d = {};
  for (let t = 0; t < 4; t++) {
    let best = 0, bs = -Infinity, base = t * GRID * GRID;
    for (let i = 0; i < GRID * GRID; i++) if (obj[base + i] > bs) { bs = obj[base + i]; best = i; }
    const gy = Math.floor(best / GRID), gx = best % GRID, box = [];
    for (let c = 0; c < 4; c++) box.push(boxes[((t * 4 + c) * GRID + gy) * GRID + gx]);
    d[REGION_TARGETS[t]] = { box: orderBox(box), score: bs };
  }
  return d;
}
function softArgmaxCoarse(hm, g, hands, kp) {
  const res = [];
  for (let h = 0; h < hands; h++) { const pts = [];
    for (let k = 0; k < kp; k++) { const base = (h * kp + k) * g * g; let mx = -Infinity;
      for (let i = 0; i < g * g; i++) mx = Math.max(mx, hm[base + i]);
      let z = 0, ex = 0, ey = 0;
      for (let y = 0; y < g; y++) for (let x = 0; x < g; x++) { const p = Math.exp(hm[base + y * g + x] - mx); z += p; ex += p * x; ey += p * y; }
      pts.push([ex / z / g, ey / z / g]); }
    res.push(pts); }
  return res;
}

const now = () => Number(process.hrtime.bigint()) / 1e6;

const REGION_HAND_SCORE_GATE = 0.5;

async function main() {
  const region = await ort.InferenceSession.create(path.join(TRACK, "detector0-grid-big2.onnx"));
  const rtm = await ort.InferenceSession.create(path.join(TRACK, "rtmpose-hand-fp16.onnx"));

  let files = fs.readdirSync(FRAMES_DIR).filter((f) => f.endsWith(".jpg")).sort();
  if (LIMIT) files = files.slice(0, LIMIT);
  // preload frames -> ImageData-like
  const frames = [];
  for (const f of files) {
    const img = await loadImage(path.join(FRAMES_DIR, f));
    const cv = createCanvas(img.width, img.height), cx = cv.getContext("2d");
    cx.drawImage(img, 0, 0);
    frames.push(cx.getImageData(0, 0, img.width, img.height));
  }
  console.log(`loaded ${frames.length} frames (${frames[0].width}x${frames[0].height}), ${PASSES} passes`);

  const acc = { resize: [], infer: [], decode: [], total: [] };
  let handsSeen = 0;
  for (let pass = 0; pass < PASSES; pass++) {
    for (const source of frames) {
      const w = source.width, h = source.height;
      const t0 = now();
      let tr = now();
      const regionRgba = cropResizeRgbaArea(source, 0, 0, w, h, REGION_PX, REGION_PX);
      const regionInput = new ort.Tensor("float32", tensor5(regionRgba, REGION_PX), [1, 5, REGION_PX, REGION_PX]);
      let resizeMs = now() - tr;
      let ti = now();
      const ro = await region.run({ frames_xy: regionInput });
      let inferMs = now() - ti;
      const regions = decodeRegion(ro.objectness_logits.data, ro.boxes_xyxy_norm.data);
      let decodeMs = 0;
      // stage 2: RTMPose per present hand — gated on region hand-box score
      for (let i = 0; i < 2; i++) {
        if (regions[REGION_TARGETS[i]].score <= REGION_HAND_SCORE_GATE) continue;
        handsSeen++;
        const box = regions[REGION_TARGETS[i]].box;
        const px1 = box[0] * w, py1 = box[1] * h, px2 = box[2] * w, py2 = box[3] * h;
        const bw = Math.max(2, px2 - px1), bh = Math.max(2, py2 - py1);
        let side = Math.min(Math.max(bw, bh) * 1.8, Math.min(w, h));
        const cx = (px1 + px2) / 2, cy = (py1 + py2) / 2;
        const cx0 = Math.min(Math.max(0, cx - side / 2), w - side), cy0 = Math.min(Math.max(0, cy - side / 2), h - side);
        tr = now();
        const rgba = cropResizeRgbaArea(source, cx0, cy0, side, side, RTM_PX, RTM_PX);
        const plane = RTM_PX * RTM_PX, data = new Float32Array(3 * plane);
        for (let q = 0; q < plane; q++) { const p = q * 4; data[q] = (rgba[p] - RTM_MEAN[0]) / RTM_STD[0]; data[plane + q] = (rgba[p + 1] - RTM_MEAN[1]) / RTM_STD[1]; data[2 * plane + q] = (rgba[p + 2] - RTM_MEAN[2]) / RTM_STD[2]; }
        resizeMs += now() - tr;
        ti = now();
        const out = await rtm.run({ input: new ort.Tensor("float32", data, [1, 3, RTM_PX, RTM_PX]) });
        inferMs += now() - ti;
        const td = now();
        const ax = out.simcc_x.data, ay = out.simcc_y.data;
        for (let k = 0; k < K; k++) { const base = k * RTM_BINS; let bx = 0, bxv = -Infinity, by = 0, byv = -Infinity;
          for (let b = 0; b < RTM_BINS; b++) { if (ax[base + b] > bxv) { bxv = ax[base + b]; bx = b; } if (ay[base + b] > byv) { byv = ay[base + b]; by = b; } } }
        decodeMs += now() - td;
      }
      const total = now() - t0;
      acc.resize.push(resizeMs); acc.infer.push(inferMs); acc.decode.push(decodeMs); acc.total.push(total);
    }
  }
  const stat = (xs) => { const s = [...xs].sort((a, b) => a - b); const avg = xs.reduce((a, b) => a + b, 0) / xs.length; return { avg, p50: s[(s.length / 2) | 0], p95: s[(s.length * 0.95) | 0], max: s[s.length - 1] }; };
  const r = { frames: frames.length, passes: PASSES, handsPerFrame: handsSeen / acc.total.length, stages: {} };
  for (const k of ["resize", "infer", "decode", "total"]) r.stages[k] = stat(acc[k]);
  r.fps = 1000 / r.stages.total.avg;
  console.log(JSON.stringify(r, null, 2));
  console.log(`\nTOTAL avg ${r.stages.total.avg.toFixed(1)}ms  p95 ${r.stages.total.p95.toFixed(1)}ms  => ${r.fps.toFixed(1)} fps (node CPU EP)`);
  console.log(`  resize(JS) ${r.stages.resize.avg.toFixed(1)} | infer(ORT) ${r.stages.infer.avg.toFixed(1)} | decode ${r.stages.decode.avg.toFixed(1)} | hands/frame ${r.handsPerFrame.toFixed(2)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
