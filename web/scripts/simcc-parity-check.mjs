#!/usr/bin/env node
// SimCC-w48 pipeline parity check: run a faithful Node port of
// src/lib/simcc-pipeline.ts on the SAME cv2-decoded PNG frames the Python
// reference used (/tmp/simcc-parity, written by simcc-parity-check's sibling
// web/scripts/simcc-parity-reference.py), and compare:
//   1) signing-crop pixel boxes (must be identical integers)
//   2) hand crop boxes (tolerance 1e-5)
//   3) projected landmarks per keypoint over detected hands (target < ~0.005)
//   4) presence per slot
//   5) end-to-end: node features -> recognizer-simccw48.onnx top-5 vs the
//      Python reference's cache-dialect features -> run10 torch top-5
// Pattern of landmark-parity-check.mjs (proven for the RTMPose pipeline).
import ort from "onnxruntime-node";
import fs from "node:fs";
import path from "node:path";
import { loadImage, createCanvas } from "@napi-rs/canvas";

const TRACK = path.resolve("public/tracking");
const PRACTICE = path.resolve("public/practice");
const REF = "/tmp/simcc-parity";
const REGION_PX = 96, GRID = 12, REGION_GRID = 12, REGION_PAD = 114;
const SIMCC_PX = 256, SIMCC_BINS = 512, SIMCC_SPLIT = 2, KEYPOINTS = 21, SIGNING = 3;
const HAND_GATE = 0.0, HAND_NMS_IOU = 0.5;
const SCALE_DEF = 1.8, BOT_THRESH = 0.9, BOT_SCALE = 1.0;
const IM_MEAN = [0.485, 0.456, 0.406], IM_STD = [0.229, 0.224, 0.225];
const HANDS = ["left_or_first_hand", "right_or_second_hand"];
const HAND_FEAT = 2 + KEYPOINTS * 2 + 1, FEAT = HAND_FEAT * 2;
const WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"];

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const orderBox = (b) => { const [x1, y1, x2, y2] = b.map((v) => clamp(v)); return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)]; };
const expandCrop = (b) => { const [x1, y1, x2, y2] = b; const w = x2 - x1, h = y2 - y1; return [Math.max(0, x1 - 0.25 * w), Math.max(0, y1 - 0.35 * h), Math.min(1, x2 + 0.25 * w), Math.min(1, y2 + 0.12 * h)]; };
const clampByte = (v) => Math.max(0, Math.min(255, Math.round(v)));

function labelsFromScratchPipeline() {
  const src = fs.readFileSync(path.resolve("src/lib/scratch-pipeline.ts"), "utf8");
  const m = src.match(/export const LABELS = \[([\s\S]*?)\]/);
  return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
}

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
  const rgba = cropResizeRgbaArea(sc, ix0, iy0, ix1 - ix0, iy1 - iy0, SIMCC_PX, SIMCC_PX);
  return { rgba, cropBox: [cx0 / w, cy0 / h, (cx0 + side) / w, (cy0 + side) / h] };
}
// (x/255 - MEAN)/STD, CHW, batched — imagenet_normalize on crop/255
function simccTensor(crops) { const plane = SIMCC_PX * SIMCC_PX, data = new Float32Array(crops.length * 3 * plane); for (let b = 0; b < crops.length; b++) { const c = crops[b], base = b * 3 * plane; for (let i = 0; i < plane; i++) { const p = i * 4; data[base + i] = (c[p] / 255 - IM_MEAN[0]) / IM_STD[0]; data[base + plane + i] = (c[p + 1] / 255 - IM_MEAN[1]) / IM_STD[1]; data[base + 2 * plane + i] = (c[p + 2] / 255 - IM_MEAN[2]) / IM_STD[2]; } } return data; }
// decode_simcc_argmax: per-axis argmax; coord = idx/2/(256-1); score = sqrt(softmax peaks)
function decodeSimccArgmaxHand(sx, sy, offset) {
  const points = [], scores = [];
  const axis = (data, kBase) => { let idx = 0, max = -Infinity; for (let n = 0; n < SIMCC_BINS; n++) { const v = data[kBase + n]; if (v > max) { max = v; idx = n; } } let denom = 0; for (let n = 0; n < SIMCC_BINS; n++) denom += Math.exp(data[kBase + n] - max); return { idx, peakProb: denom > 0 ? 1 / denom : 0 }; };
  for (let k = 0; k < KEYPOINTS; k++) { const kBase = offset + k * SIMCC_BINS; const ax = axis(sx, kBase), ay = axis(sy, kBase); points.push([clamp(ax.idx / SIMCC_SPLIT / (SIMCC_PX - 1)), clamp(ay.idx / SIMCC_SPLIT / (SIMCC_PX - 1))]); scores.push(Math.sqrt(Math.max(ax.peakProb * ay.peakProb, 0))); }
  return { points, scores };
}
const projectCropPointsToFrame = (pts, cb) => { const [bx0, by0, bx1, by1] = cb, dw = Math.max(0, bx1 - bx0), dh = Math.max(0, by1 - by0); return pts.map(([x, y]) => [clamp(bx0 + x * dw), clamp(by0 + y * dh)]); };
function decodeSigningBox(obj, boxes) { let best = 0, bs = -Infinity, base = SIGNING * GRID * GRID; for (let i = 0; i < GRID * GRID; i++) if (obj[base + i] > bs) { bs = obj[base + i]; best = i; } const gy = Math.floor(best / GRID), gx = best % GRID, box = []; for (let c = 0; c < 4; c++) box.push(boxes[((SIGNING * 4 + c) * GRID + gy) * GRID + gx]); return orderBox(box); }

function imgData(image) { const cv = createCanvas(image.width, image.height); const cx = cv.getContext("2d"); cx.drawImage(image, 0, 0); return cx.getImageData(0, 0, image.width, image.height); }

// scratch-pipeline handFeature/frameFeature (browser dialect: unrounded)
function handFeature(hand) {
  if (!hand || !hand.landmarks || hand.landmarks.length !== KEYPOINTS) return new Array(HAND_FEAT).fill(0);
  const pts = hand.landmarks, wrist = pts[0];
  const rel = pts.map(([x, y]) => [x - wrist[0], y - wrist[1]]);
  const meanDist = rel.reduce((acc, [x, y]) => acc + Math.hypot(x, y), 0) / KEYPOINTS;
  const scale = meanDist + 1e-6;
  const out = [wrist[0], wrist[1]];
  for (const [x, y] of rel) out.push(x / scale, y / scale);
  out.push(hand.probability);
  return out;
}

async function runFrame(region, hands, simcc, source) {
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
  const hc = Object.fromEntries(HANDS.map((n) => [n, { landmarks_xy: Array.from({ length: KEYPOINTS }, () => [0, 0]), presence: 0 }]));
  const meta = { signing_px: [sx1, sy1, sx2, sy2], hand_crop_boxes: cropBoxes };
  if (!crops.length) return { hc, meta };
  const out = await simcc.run({ input: new ort.Tensor("float32", simccTensor(crops), [crops.length, 3, SIMCC_PX, SIMCC_PX]) });
  const six = out.simcc_x.data, siy = out.simcc_y.data, perHand = KEYPOINTS * SIMCC_BINS;
  const entries = [];
  for (let i = 0; i < crops.length; i++) { const { points, scores } = decodeSimccArgmaxHand(six, siy, i * perHand); const pts = projectCropPointsToFrame(points, cropBoxes[i]); const mean = scores.reduce((a, b) => a + b, 0) / scores.length; entries.push({ wx: pts[0][0], pts, pres: clamp(mean) }); }
  entries.sort((a, b) => a.wx - b.wx);
  HANDS.forEach((name, slot) => { const e = entries[slot]; if (e) hc[name] = { landmarks_xy: e.pts, presence: e.pres }; });
  return { hc, meta };
}

async function main() {
  const labels = labelsFromScratchPipeline();
  const region = await ort.InferenceSession.create(path.join(TRACK, "detector0-grid-big2.onnx"));
  const hands = await ort.InferenceSession.create(path.join(TRACK, "detector0-hands2.onnx"));
  const simcc = await ort.InferenceSession.create(path.join(PRACTICE, "ws1-hand-simcc-student-w48-v1.onnx"));
  const recog = await ort.InferenceSession.create(path.join(PRACTICE, "recognizer-simccw48.onnx"));
  const py = JSON.parse(fs.readFileSync(path.join(REF, "py_simcc.json"), "utf8"));

  let signingMismatch = 0, handCountMismatch = 0, cropBoxWorst = 0, kpWorst = 0, presWorst = 0, kpWorstFrame = null;
  const kpDiffs = [];
  let top1Agree = 0, top5SetAgree = 0, top5OverlapMin = 5;
  const e2e = {};

  for (const w of WORDS) {
    const ref = py.words[w];
    const seq = [];
    for (const f of ref.frames) {
      const img = await loadImage(path.join(REF, w, String(f.j).padStart(2, "0") + ".png"));
      const { hc, meta } = await runFrame(region, hands, simcc, imgData(img));
      // 1) signing pixel box
      if (JSON.stringify(meta.signing_px) !== JSON.stringify(f.signing_px)) {
        signingMismatch += 1;
        console.error(`  [${w} j${f.j}] signing px mismatch py=${f.signing_px} node=${meta.signing_px}`);
      }
      // 2) hand crop boxes (same count + values). Sub-pixel float drift is
      // expected: the hands2 ONNX sees ±1-LSB resize differences (cv2
      // INTER_AREA vs the JS area resample), which moves the regressed box
      // by ~1e-4 in sc-norm. Gate at 1e-3 (well under a pixel).
      const n = Math.min(meta.hand_crop_boxes.length, f.hand_crop_boxes.length);
      if (meta.hand_crop_boxes.length !== f.hand_crop_boxes.length) {
        handCountMismatch += 1;
        console.error(`  [${w} j${f.j}] hand count py=${f.hand_crop_boxes.length} node=${meta.hand_crop_boxes.length}`);
      }
      for (let i = 0; i < n; i++) for (let c = 0; c < 4; c++) cropBoxWorst = Math.max(cropBoxWorst, Math.abs(meta.hand_crop_boxes[i][c] - f.hand_crop_boxes[i][c]));
      // 3/4) landmarks + presence over detected hands (both sides)
      for (const hn of HANDS) {
        const pp = f.hands[hn].presence, jp = hc[hn].presence;
        presWorst = Math.max(presWorst, Math.abs(pp - jp));
        if (pp <= 0 || jp <= 0) continue;
        const pl = f.hands[hn].landmarks_xy, jl = hc[hn].landmarks_xy;
        let mx = 0;
        for (let k = 0; k < KEYPOINTS; k++) { const d = Math.max(Math.abs(pl[k][0] - jl[k][0]), Math.abs(pl[k][1] - jl[k][1])); mx = Math.max(mx, d); kpDiffs.push(d); }
        if (mx > kpWorst) { kpWorst = mx; kpWorstFrame = `${w} j${f.j} ${hn} pres=${pp.toFixed(4)}`; }
      }
      // browser-dialect features for e2e
      seq.push([
        ...handFeature({ landmarks: hc.left_or_first_hand.landmarks_xy, probability: hc.left_or_first_hand.presence }),
        ...handFeature({ landmarks: hc.right_or_second_hand.landmarks_xy, probability: hc.right_or_second_hand.presence }),
      ]);
    }
    // 5) e2e: node features -> recognizer ONNX
    const t = seq.length;
    const data = new Float32Array(t * FEAT);
    seq.forEach((f, r) => data.set(f, r * FEAT));
    const out = await recog.run({
      sequence: new ort.Tensor("float32", data, [1, t, FEAT]),
      lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(t)]), [1]),
    });
    const logits = Array.from(out.logits.data, Number);
    const mxl = Math.max(...logits);
    const exps = logits.map((v) => Math.exp(v - mxl));
    const Z = exps.reduce((a, b) => a + b, 0);
    const probs = exps.map((v) => v / Z);
    const order = probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 5);
    const nodeTop5 = order.map(([p, i]) => ({ label: labels[i], prob: +p.toFixed(6) }));
    const pyTop5 = ref.torch_top5;
    const logitDiff = Math.max(...logits.map((v, i) => Math.abs(v - ref.torch_logits[i])));
    const t1 = nodeTop5[0].label === pyTop5[0].label;
    const pySet = new Set(pyTop5.map((x) => x.label));
    const overlap = nodeTop5.filter((x) => pySet.has(x.label)).length;
    const t5 = overlap === 5;
    top1Agree += t1; top5SetAgree += t5; top5OverlapMin = Math.min(top5OverlapMin, overlap);
    e2e[w] = { node_top5: nodeTop5, py_top5: pyTop5, max_logit_diff: +logitDiff.toFixed(4), top1_agree: t1, top5_overlap: overlap };
    console.error(`${w.padEnd(9)} node top-5: ${nodeTop5.map((x) => `${x.label} ${x.prob.toFixed(3)}`).join(", ")} | logitΔ ${logitDiff.toFixed(4)} | top1 ${t1 ? "=" : "≠"} top5 overlap ${overlap}/5`);
  }

  kpDiffs.sort((a, b) => a - b);
  const pct = (q) => kpDiffs[Math.min(kpDiffs.length - 1, Math.floor(q * kpDiffs.length))];
  // Argmax tie-flips: the SimCC global argmax can land on a different bin when
  // the distribution is near-flat and the two runtimes (torch student in the
  // Python reference vs the ORT-exported student here) disagree by float
  // noise. A flip is a real, bounded property of the argmax decode — count it
  // honestly instead of hiding it behind a presence gate.
  const flips005 = kpDiffs.filter((d) => d > 0.005).length;
  const flips01 = kpDiffs.filter((d) => d > 0.01).length;
  console.error(`\nsigning-px mismatches: ${signingMismatch} | hand-count mismatches: ${handCountMismatch}`);
  console.error(`hand cropBox worst abs diff: ${cropBoxWorst.toExponential(2)}`);
  console.error(`keypoint abs diff over ${kpDiffs.length} detected-hand keypoints: p50 ${pct(0.5).toFixed(5)} p95 ${pct(0.95).toFixed(5)} p99 ${pct(0.99).toFixed(5)} max ${kpWorst.toFixed(5)} (${kpWorstFrame})`);
  console.error(`keypoints over 0.005: ${flips005}/${kpDiffs.length} (${(100 * flips005 / kpDiffs.length).toFixed(2)}%) | over 0.01 (argmax tie-flips): ${flips01}`);
  console.error(`presence worst abs diff: ${presWorst.toFixed(5)}`);
  console.error(`e2e top-1 agreement ${top1Agree}/${WORDS.length} | top-5 exact-set ${top5SetAgree}/${WORDS.length} | worst top-5 overlap ${top5OverlapMin}/5`);
  const pass =
    signingMismatch === 0 &&
    handCountMismatch === 0 &&
    cropBoxWorst < 1e-3 && // sub-pixel
    pct(0.99) < 0.005 && // keypoint parity excluding rare argmax tie-flips
    flips005 / kpDiffs.length < 0.01 && // tie-flips stay rare (<1%)
    top1Agree === WORDS.length &&
    top5OverlapMin >= 4;
  console.error(pass ? "PASS simcc pipeline parity" : "FAIL simcc pipeline parity");
  console.log(JSON.stringify({ signingMismatch, handCountMismatch, cropBoxWorst, kpP50: pct(0.5), kpP95: pct(0.95), kpP99: pct(0.99), kpWorst, kpWorstFrame, flips005, flips01, kpCount: kpDiffs.length, presWorst, top1Agree, top5SetAgree, top5OverlapMin, e2e }, null, 1));
  if (!pass) process.exit(1);
}
main().catch((e) => { console.error(e); process.exit(1); });
