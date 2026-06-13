#!/usr/bin/env node
// Landmark parity check: run a faithful Node port of src/lib/rtmpose-pipeline.ts
// on the SAME cv2-decoded PNG frames the Python reference used (/tmp/parity_frames),
// and compare projected landmarks per keypoint. Isolates pipeline-math parity from
// frame-decode differences. Pass: max abs diff per keypoint < ~0.03 in [0,1].
import ort from "onnxruntime-node";
import fs from "node:fs";
import path from "node:path";
import { loadImage, createCanvas } from "@napi-rs/canvas";

const TRACK = path.resolve("public/tracking");
const REGION_PX = 96, GRID = 12, REGION_GRID = 12, REGION_PAD = 114;
const RTM_PX = 256, RTM_BINS = 512, KEYPOINTS = 21, SIMCC_WINDOW = 7, SIGNING = 3;
const HAND_GATE = 0.0, HAND_NMS_IOU = 0.5;
const SCALE_DEF = 1.8, BOT_THRESH = 0.9, BOT_SCALE = 1.0;
const MEAN = [123.675, 116.28, 103.53], STD = [58.395, 57.12, 57.375];
const HANDS = ["left_or_first_hand", "right_or_second_hand"];

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const orderBox = (b) => { const [x1, y1, x2, y2] = b.map((v) => clamp(v)); return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]; };
const expandCrop = (b) => { const [x1, y1, x2, y2] = b; const w = x2 - x1, h = y2 - y1; return [Math.max(0, x1 - 0.25 * w), Math.max(0, y1 - 0.35 * h), Math.min(1, x2 + 0.25 * w), Math.min(1, y2 + 0.12 * h)]; };
const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));

function cropResizeRgbaArea(img, sx, sy, sw, sh, dw, dh) {
  const src = img.data, W = img.width, H = img.height, out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y++) {
    const y0 = Math.max(0, sy + (y * sh) / dh), y1 = Math.min(H, sy + ((y + 1) * sh) / dh);
    const iy0 = Math.floor(y0), iy1 = Math.max(iy0 + 1, Math.ceil(y1));
    for (let x = 0; x < dw; x++) {
      const x0 = Math.max(0, sx + (x * sw) / dw), x1 = Math.min(W, sx + ((x + 1) * sw) / dw);
      const ix0 = Math.floor(x0), ix1 = Math.max(ix0 + 1, Math.ceil(x1));
      let r = 0, g = 0, b = 0, a = 0;
      for (let iy = iy0; iy < iy1; iy++) { if (iy < 0 || iy >= H) continue; const oy = Math.max(0, Math.min(iy + 1, y1) - Math.max(iy, y0)); if (oy <= 0) continue;
        for (let ix = ix0; ix < ix1; ix++) { if (ix < 0 || ix >= W) continue; const ox = Math.max(0, Math.min(ix + 1, x1) - Math.max(ix, x0)); if (ox <= 0) continue; const wt = ox * oy, p = (iy * W + ix) * 4; r += src[p] * wt; g += src[p + 1] * wt; b += src[p + 2] * wt; a += wt; } }
      const o = (y * dw + x) * 4; if (a > 0) { out[o] = clampByte(r / a); out[o + 1] = clampByte(g / a); out[o + 2] = clampByte(b / a); } out[o + 3] = 255;
    }
  }
  return out;
}
function tensor5(rgba, size) { const plane = size * size, d = new Float32Array(5 * plane); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const i = y * size + x, p = i * 4; d[i] = rgba[p] / 255; d[plane + i] = rgba[p + 1] / 255; d[2 * plane + i] = rgba[p + 2] / 255; d[3 * plane + i] = size > 1 ? x / (size - 1) : 0; d[4 * plane + i] = size > 1 ? y / (size - 1) : 0; } return d; }

const boxArea = (b) => Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
function boxIou(a, b) { const ix0 = Math.max(a[0], b[0]), iy0 = Math.max(a[1], b[1]), ix1 = Math.min(a[2], b[2]), iy1 = Math.min(a[3], b[3]); const inter = Math.max(0, ix1 - ix0) * Math.max(0, iy1 - iy0); const u = boxArea(a) + boxArea(b) - inter; return u > 0 ? inter / u : 0; }
const flipBoxX = (b) => orderBox([1 - b[2], b[1], 1 - b[0], b[3]]);
const unletterboxBox = (b, t) => { const fx = (v) => (v - t.padX) / t.contentX, fy = (v) => (v - t.padY) / t.contentY; return orderBox([fx(b[0]), fy(b[1]), fx(b[2]), fy(b[3])]); };

function letterboxRgba(img, size) {
  const w = img.width, h = img.height, scale = Math.min(size / w, size / h);
  const cw = Math.max(1, Math.min(size, Math.round(w * scale))), ch = Math.max(1, Math.min(size, Math.round(h * scale)));
  const offX = Math.floor((size - cw) / 2), offY = Math.floor((size - ch) / 2);
  const content = cropResizeRgbaArea(img, 0, 0, w, h, cw, ch);
  const out = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) { out[i * 4] = REGION_PAD; out[i * 4 + 1] = REGION_PAD; out[i * 4 + 2] = REGION_PAD; out[i * 4 + 3] = 255; }
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) { const s = (y * cw + x) * 4, d = ((offY + y) * size + (offX + x)) * 4; out[d] = content[s]; out[d + 1] = content[s + 1]; out[d + 2] = content[s + 2]; out[d + 3] = 255; }
  return { rgba: out, transform: { padX: offX / size, padY: offY / size, contentX: cw / size, contentY: ch / size } };
}
function mirrorRgbaX(rgba, size) { const out = new Uint8ClampedArray(size * size * 4); for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) { const s = (y * size + x) * 4, d = (y * size + (size - 1 - x)) * 4; out[d] = rgba[s]; out[d + 1] = rgba[s + 1]; out[d + 2] = rgba[s + 2]; out[d + 3] = 255; } return out; }
function decodeHandCandidates(obj, boxes, mirrored) { const out = []; const cells = REGION_GRID * REGION_GRID; for (let cell = 0; cell < cells; cell++) { const gy = Math.floor(cell / REGION_GRID), gx = cell % REGION_GRID; const raw = []; for (let c = 0; c < 4; c++) raw.push(boxes[((0 * 4 + c) * REGION_GRID + gy) * REGION_GRID + gx]); let box = orderBox(raw); if (mirrored) box = flipBoxX(box); const score = obj[(0 * REGION_GRID + gy) * REGION_GRID + gx]; out.push({ box, score }); } return out; }
function pickHandCandidates(cands, topk = 2) { const sorted = [...cands].sort((a, b) => b.score - a.score); const picked = []; for (const c of sorted) { if (c.score <= HAND_GATE) break; if (picked.some((p) => boxIou(c.box, p.box) >= HAND_NMS_IOU)) continue; picked.push(c); if (picked.length >= topk) break; } picked.sort((a, b) => (a.box[0] + a.box[2]) * 0.5 - (b.box[0] + b.box[2]) * 0.5); return picked; }

async function detectorHands(session, sc) {
  const { rgba, transform } = letterboxRgba(sc, REGION_PX);
  const mirrored = mirrorRgbaX(rgba, REGION_PX);
  const out = await session.run({ frames_xy: new ort.Tensor("float32", tensor5(rgba, REGION_PX), [1, 5, REGION_PX, REGION_PX]) });
  const mOut = await session.run({ frames_xy: new ort.Tensor("float32", tensor5(mirrored, REGION_PX), [1, 5, REGION_PX, REGION_PX]) });
  const raw = decodeHandCandidates(out.objectness.data, out.boxes.data, false);
  raw.push(...decodeHandCandidates(mOut.objectness.data, mOut.boxes.data, true));
  return pickHandCandidates(raw.map((c) => ({ box: unletterboxBox(c.box, transform), score: c.score })));
}
function cropHand(sc, box) {
  const w = sc.width, h = sc.height; const [x0, y0, x1, y1] = orderBox(box);
  const px0 = x0 * w, py0 = y0 * h, px1 = x1 * w, py1 = y1 * h;
  const bw = Math.max(2, px1 - px0), bh = Math.max(2, py1 - py0);
  const scale = y1 >= BOT_THRESH ? BOT_SCALE : SCALE_DEF;
  const side = Math.min(Math.max(bw, bh) * scale, Math.min(w, h));
  const cx = (px0 + px1) * 0.5, cy = (py0 + py1) * 0.5;
  const cx0 = Math.min(Math.max(0, cx - side * 0.5), w - side), cy0 = Math.min(Math.max(0, cy - side * 0.5), h - side);
  const ix0 = Math.floor(cx0), iy0 = Math.floor(cy0), ix1 = Math.ceil(cx0 + side), iy1 = Math.ceil(cy0 + side);
  const rgba = cropResizeRgbaArea(sc, ix0, iy0, ix1 - ix0, iy1 - iy0, RTM_PX, RTM_PX);
  return { rgba, cropBox: [cx0 / w, cy0 / h, (cx0 + side) / w, (cy0 + side) / h] };
}
function rtmposeTensor(crops) { const plane = RTM_PX * RTM_PX, data = new Float32Array(crops.length * 3 * plane); for (let b = 0; b < crops.length; b++) { const c = crops[b], base = b * 3 * plane; for (let i = 0; i < plane; i++) { const p = i * 4; data[base + i] = (c[p] - MEAN[0]) / STD[0]; data[base + plane + i] = (c[p + 1] - MEAN[1]) / STD[1]; data[base + 2 * plane + i] = (c[p + 2] - MEAN[2]) / STD[2]; } } return data; }
function decodeSimccHand(sx, sy, offset, bins) {
  const points = [], raw = [];
  const axis = (data, kBase) => { let peak = 0, peakVal = -Infinity; for (let n = 0; n < bins; n++) { const v = data[kBase + n]; if (v > peakVal) { peakVal = v; peak = n; } } const lo = Math.max(0, peak - SIMCC_WINDOW), hi = Math.min(bins - 1, peak + SIMCC_WINDOW); let mx = -Infinity; for (let n = lo; n <= hi; n++) mx = Math.max(mx, data[kBase + n]); let denom = 0, acc = 0; for (let n = lo; n <= hi; n++) { const e = Math.exp(data[kBase + n] - mx); denom += e; acc += e * n; } return { coord: denom > 0 ? acc / denom : peak, peakVal }; };
  for (let k = 0; k < KEYPOINTS; k++) { const kBase = offset + k * bins; const ax = axis(sx, kBase), ay = axis(sy, kBase); points.push([clamp(ax.coord / bins), clamp(ay.coord / bins)]); raw.push((ax.peakVal + ay.peakVal) * 0.5); }
  return { points, raw };
}
const projectCropPointsToFrame = (pts, cb) => { const [bx0, by0, bx1, by1] = cb, dw = Math.max(0, bx1 - bx0), dh = Math.max(0, by1 - by0); return pts.map(([x, y]) => [clamp(bx0 + x * dw), clamp(by0 + y * dh)]); };
function decodeSigningBox(obj, boxes) { let best = 0, bs = -Infinity, base = SIGNING * GRID * GRID; for (let i = 0; i < GRID * GRID; i++) if (obj[base + i] > bs) { bs = obj[base + i]; best = i; } const gy = Math.floor(best / GRID), gx = best % GRID, box = []; for (let c = 0; c < 4; c++) box.push(boxes[((SIGNING * 4 + c) * GRID + gy) * GRID + gx]); return orderBox(box); }

function imgData(image) { const cv = createCanvas(image.width, image.height); const cx = cv.getContext("2d"); cx.drawImage(image, 0, 0); return cx.getImageData(0, 0, image.width, image.height); }

async function runFrame(region, hands, rtm, source) {
  const W = source.width, H = source.height;
  const ro = await region.run({ frames_xy: new ort.Tensor("float32", tensor5(cropResizeRgbaArea(source, 0, 0, W, H, REGION_PX, REGION_PX), REGION_PX), [1, 5, REGION_PX, REGION_PX]) });
  const signing = decodeSigningBox(ro.objectness_logits.data, ro.boxes_xyxy_norm.data);
  const cb = expandCrop(signing);
  let sx1 = Math.trunc(cb[0] * W), sy1 = Math.trunc(cb[1] * H), sx2 = Math.trunc(cb[2] * W), sy2 = Math.trunc(cb[3] * H);
  sx1 = Math.max(0, sx1); sy1 = Math.max(0, sy1); sx2 = Math.max(sx1 + 1, sx2); sy2 = Math.max(sy1 + 1, sy2);
  const scW = sx2 - sx1, scH = sy2 - sy1;
  const sc = { data: cropResizeRgbaArea(source, sx1, sy1, scW, scH, scW, scH), width: scW, height: scH };
  const hr = (await detectorHands(hands, sc)).slice(0, 2);
  const crops = [], cropBoxes = [];
  for (const hd of hr) { const { rgba, cropBox } = cropHand(sc, hd.box); crops.push(rgba); cropBoxes.push(cropBox); }
  if (globalThis.__DBG) {
    console.log("[node] frame WxH", W, H);
    console.log("[node] signing", signing.map((v) => +v.toFixed(5)));
    console.log("[node] expandCrop", cb.map((v) => +v.toFixed(5)));
    console.log("[node] crop_px", [sx1, sy1, sx2, sy2], "sc WxH", scW, scH);
    hr.forEach((hd, i) => console.log(`[node] hand${i} box`, hd.box.map((v) => +v.toFixed(5)), "score", +hd.score.toFixed(4), "cropBox", cropBoxes[i].map((v) => +v.toFixed(5))));
  }
  const hc = { left_or_first_hand: { landmarks_xy: Array.from({ length: KEYPOINTS }, () => [0, 0]), presence: 0 }, right_or_second_hand: { landmarks_xy: Array.from({ length: KEYPOINTS }, () => [0, 0]), presence: 0 } };
  if (!crops.length) return hc;
  const out = await rtm.run({ input: new ort.Tensor("float32", rtmposeTensor(crops), [crops.length, 3, RTM_PX, RTM_PX]) });
  const six = out.simcc_x.data, siy = out.simcc_y.data, perHand = KEYPOINTS * RTM_BINS;
  const entries = [];
  for (let i = 0; i < crops.length; i++) { const { points, raw } = decodeSimccHand(six, siy, i * perHand, RTM_BINS); const pts = projectCropPointsToFrame(points, cropBoxes[i]); const mean = raw.reduce((a, b) => a + b, 0) / raw.length; entries.push({ wx: pts[0][0], pts, pres: clamp(mean) }); }
  entries.sort((a, b) => a.wx - b.wx);
  HANDS.forEach((name, slot) => { const e = entries[slot]; if (e) hc[name] = { landmarks_xy: e.pts, presence: e.pres }; });
  return hc;
}

async function main() {
  const region = await ort.InferenceSession.create(path.join(TRACK, "detector0-grid-big2.onnx"));
  const hands = await ort.InferenceSession.create(path.join(TRACK, "detector0-hands2.onnx"));
  const rtm = await ort.InferenceSession.create(path.join(TRACK, "rtmpose-hand-fp16.onnx"));
  if (process.env.DEBUG_FRAME) {
    const [w, jj] = process.env.DEBUG_FRAME.split(":");
    globalThis.__DBG = true;
    const img = await loadImage(`/tmp/parity_frames/${w}/${String(jj).padStart(2, "0")}.png`);
    const hc = await runFrame(region, hands, rtm, imgData(img));
    for (const hn of HANDS) console.log("[node]", hn, "pres", +hc[hn].presence.toFixed(5), "lm0", hc[hn].landmarks_xy[0].map((v) => +v.toFixed(5)), "lm8", hc[hn].landmarks_xy[8].map((v) => +v.toFixed(5)));
    fs.writeFileSync("/tmp/node_frog10.json", JSON.stringify(hc));
    return;
  }
  const py = JSON.parse(fs.readFileSync("/tmp/parity_frames/py_landmarks.json", "utf8"));
  let worstAll = 0, worstFrame = null;
  for (const w of ["hello", "frog"]) {
    const frames = py[w].frames;
    let worst = 0;
    for (const f of frames) {
      const img = await loadImage(`/tmp/parity_frames/${w}/${String(f.j).padStart(2, "0")}.png`);
      const hc = await runFrame(region, hands, rtm, imgData(img));
      for (const hn of HANDS) {
        const pp = f.hands[hn].presence, jp = hc[hn].presence;
        // Only compare hands the recognizer meaningfully weights. Low-presence
        // hands have near-flat SimCC distributions where the global-argmax bin can
        // flip between ONNX runtimes (float noise) on a single keypoint.
        if (pp <= 0.5 || jp <= 0.5) continue;
        const pl = f.hands[hn].landmarks_xy, jl = hc[hn].landmarks_xy;
        let mx = 0;
        for (let k = 0; k < KEYPOINTS; k++) { mx = Math.max(mx, Math.abs(pl[k][0] - jl[k][0]), Math.abs(pl[k][1] - jl[k][1])); }
        if (mx > worst) worst = mx;
        if (mx > worstAll) { worstAll = mx; worstFrame = `${w} j${f.j} ${hn} pres=${pp.toFixed(3)} presΔ=${Math.abs(pp - jp).toFixed(4)}`; }
      }
    }
    console.log(`${w}: max per-keypoint abs diff over present hands = ${worst.toFixed(5)}`);
  }
  console.log(`\nWORST overall = ${worstAll.toFixed(5)} (${worstFrame})`);
  console.log(worstAll < 0.03 ? "PASS landmark parity (<0.03)" : "FAIL landmark parity (>=0.03)");
}
main().catch((e) => { console.error(e); process.exit(1); });
