// RTMPose recognition pipeline for /analyze. Replicates the feasibility RTMPose
// landmark extraction EXACTLY (feasibility_extract_both.py + rtmpose_hand_teacher_runner.py)
// so the RTMPose recognizer (public/analyze/recognizer-rtmpose.onnx) sees the same
// landmark "dialect" it was trained on. Proven JS<->Python parity (see parity gate).
//
// Per frame: region (detector0-grid-big2) on a 96px INTER_AREA resize of the full
// frame -> signing-crop box (target index 3) -> expandCrop -> pixel crop `sc` ->
// detector_hands(hands2, sc)[:2] (letterbox 114 + mirror pass, NMS, top-2) ->
// crop_hand (256px square, scale 1.8) -> batched rtmpose -> SimCC soft-argmax ->
// project to signing-crop [0,1]. Landmarks end up in signing-crop space, so the
// scratch handFeature/frameFeature apply unchanged.

import {
  REGION_PX,
  GRID,
  KEYPOINTS,
  HANDS,
  type OrtModule,
  type OrtSession,
  type Hand,
  clamp,
  orderBox,
  expandCrop,
  cropResizeRgbaArea,
  tensorDataFromRgba,
} from "./scratch-pipeline";

// ---- constants (from rtmpose_hand_teacher_runner.py) ----------------------
const REGION_PAD = 114;
const REGION_GRID = 12; // hands2 output grid (objectness [b,3,12,12])
const HAND_GATE = 0.0;
const HAND_NMS_IOU = 0.5;
const HAND_DEFAULT_CROP_SCALE = 1.8;
const HAND_BOTTOM_EDGE_CROP_THRESHOLD = 0.9;
const HAND_BOTTOM_EDGE_CROP_SCALE = 1.0;
export const RTM_PX = 256;
const RTM_BINS = 512;
const RTM_MEAN = [123.675, 116.28, 103.53];
const RTM_STD = [58.395, 57.12, 57.375];
const SIMCC_WINDOW = 7;
const SIGNING_TARGET = 3; // upper_body_or_signing_space

export const REGION_URL = "/tracking/detector0-grid-big2.onnx";
export const HANDS_URL = "/tracking/detector0-hands2.onnx";
export const RTMPOSE_URL = "/tracking/rtmpose-hand-fp16.onnx";
export const RTMPOSE_INT8_URL = "/analyze/rtmpose-hand-int8.onnx";

export type RtmposeSessions = { region: OrtSession; hands: OrtSession; rtmpose: OrtSession };

type Candidate = { box: number[]; score: number };
type Transform = { padX: number; padY: number; contentX: number; contentY: number };

// Prefer WebGPU (much faster for the 256px RTMPose hand model) with a wasm
// fallback. Mirrors live-tracker.ts: headless / no-GPU / no-f16 -> wasm, so the
// fallback path is always available and headless tests exercise it.
export async function chooseExecutionProviders(): Promise<("webgpu" | "wasm")[]> {
  if (typeof navigator === "undefined") return ["wasm"];
  if (/\bHeadlessChrome\//.test(navigator.userAgent)) return ["wasm"];
  const gpu = (navigator as Navigator & {
    gpu?: { requestAdapter(): Promise<{ features?: { has(f: string): boolean } } | null> };
  }).gpu;
  if (!gpu) return ["wasm"];
  try {
    const adapter = await gpu.requestAdapter();
    return adapter?.features?.has("shader-f16") ? ["webgpu", "wasm"] : ["wasm"];
  } catch {
    return ["wasm"];
  }
}

export async function loadRtmposeSessions(
  ort: OrtModule,
  options?: { quantized?: boolean },
): Promise<RtmposeSessions> {
  const quantized = options?.quantized ?? false;
  // int8 is a wasm/CPU optimization (WebGPU has limited int8 support), so pin the
  // quantized variant to wasm; the fp16 variant uses WebGPU when available.
  const executionProviders: ("webgpu" | "wasm")[] = quantized
    ? ["wasm"]
    : await chooseExecutionProviders();
  const opts = { executionProviders, graphOptimizationLevel: "all" as const };
  // WebGPU EP forbids concurrent session creation — create sequentially.
  const region = await ort.InferenceSession.create(REGION_URL, opts);
  const hands = await ort.InferenceSession.create(HANDS_URL, opts);
  const rtmpose = await ort.InferenceSession.create(
    quantized ? RTMPOSE_INT8_URL : RTMPOSE_URL,
    opts,
  );
  return { region, hands, rtmpose };
}

// ---- box helpers (parity with rtmpose_hand_teacher_runner.py) -------------
function boxArea(b: number[]): number {
  return Math.max(0, b[2] - b[0]) * Math.max(0, b[3] - b[1]);
}
function boxIou(a: number[], b: number[]): number {
  const ix0 = Math.max(a[0], b[0]);
  const iy0 = Math.max(a[1], b[1]);
  const ix1 = Math.min(a[2], b[2]);
  const iy1 = Math.min(a[3], b[3]);
  const inter = Math.max(0, ix1 - ix0) * Math.max(0, iy1 - iy0);
  const union = boxArea(a) + boxArea(b) - inter;
  return union > 0 ? inter / union : 0;
}
function flipBoxX(b: number[]): number[] {
  return orderBox([1 - b[2], b[1], 1 - b[0], b[3]]);
}
function unletterboxBox(b: number[], t: Transform): number[] {
  const fx = (v: number) => (v - t.padX) / t.contentX;
  const fy = (v: number) => (v - t.padY) / t.contentY;
  return orderBox([fx(b[0]), fy(b[1]), fx(b[2]), fy(b[3])]);
}

// letterbox an RGBA region into a size x size pad-114 canvas (INTER_AREA content).
// Returns the padded RGBA (size*size*4) + transform. Matches letterbox_rgb.
function letterboxRgba(
  img: ImageData, size: number,
): { rgba: Uint8ClampedArray; transform: Transform } {
  const w = img.width;
  const h = img.height;
  const scale = Math.min(size / w, size / h);
  const contentW = Math.max(1, Math.min(size, Math.round(w * scale)));
  const contentH = Math.max(1, Math.min(size, Math.round(h * scale)));
  const offX = Math.floor((size - contentW) / 2);
  const offY = Math.floor((size - contentH) / 2);
  // INTER_AREA resize of the whole image into contentW x contentH
  const content = cropResizeRgbaArea(img, 0, 0, w, h, contentW, contentH);
  const out = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i += 1) {
    out[i * 4] = REGION_PAD;
    out[i * 4 + 1] = REGION_PAD;
    out[i * 4 + 2] = REGION_PAD;
    out[i * 4 + 3] = 255;
  }
  for (let y = 0; y < contentH; y += 1) {
    for (let x = 0; x < contentW; x += 1) {
      const s = (y * contentW + x) * 4;
      const d = ((offY + y) * size + (offX + x)) * 4;
      out[d] = content[s];
      out[d + 1] = content[s + 1];
      out[d + 2] = content[s + 2];
      out[d + 3] = 255;
    }
  }
  return {
    rgba: out,
    transform: { padX: offX / size, padY: offY / size, contentX: contentW / size, contentY: contentH / size },
  };
}

function mirrorRgbaX(rgba: Uint8ClampedArray, size: number): Uint8ClampedArray {
  const out = new Uint8ClampedArray(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const s = (y * size + x) * 4;
      const d = (y * size + (size - 1 - x)) * 4;
      out[d] = rgba[s];
      out[d + 1] = rgba[s + 1];
      out[d + 2] = rgba[s + 2];
      out[d + 3] = 255;
    }
  }
  return out;
}

// decode_hand_candidates: channel 0 only. objectness [3,12,12], boxes [3,4,12,12].
function decodeHandCandidates(
  objectness: ArrayLike<number>, boxes: ArrayLike<number>, mirrored: boolean,
): Candidate[] {
  const out: Candidate[] = [];
  const cells = REGION_GRID * REGION_GRID;
  for (let cell = 0; cell < cells; cell += 1) {
    const gy = Math.floor(cell / REGION_GRID);
    const gx = cell % REGION_GRID;
    // boxes[0, c, gy, gx] for c in 0..3 — layout [channel,coord,gy,gx]
    const raw: number[] = [];
    for (let c = 0; c < 4; c += 1) {
      raw.push(boxes[((0 * 4 + c) * REGION_GRID + gy) * REGION_GRID + gx]);
    }
    let box = orderBox(raw);
    if (mirrored) box = flipBoxX(box);
    const score = objectness[(0 * REGION_GRID + gy) * REGION_GRID + gx];
    out.push({ box, score });
  }
  return out;
}

function pickHandCandidates(cands: Candidate[], topk = 2): Candidate[] {
  const sorted = [...cands].sort((a, b) => b.score - a.score);
  const picked: Candidate[] = [];
  for (const cand of sorted) {
    if (cand.score <= HAND_GATE) break;
    if (picked.some((p) => boxIou(cand.box, p.box) >= HAND_NMS_IOU)) continue;
    picked.push(cand);
    if (picked.length >= topk) break;
  }
  picked.sort((a, b) => (a.box[0] + a.box[2]) * 0.5 - (b.box[0] + b.box[2]) * 0.5);
  return picked;
}

// detector_hands: hands2 on letterboxed sc + its mirror, decode, NMS, top-2.
// `sc` is the pixel-crop ImageData (signing region).
export async function detectorHands(
  ort: OrtModule, session: OrtSession, sc: ImageData,
): Promise<Candidate[]> {
  const { rgba, transform } = letterboxRgba(sc, REGION_PX);
  const mirrored = mirrorRgbaX(rgba, REGION_PX);
  const tensor = tensorDataFromRgba(rgba, REGION_PX);
  const mTensor = tensorDataFromRgba(mirrored, REGION_PX);
  const out = await session.run({
    frames_xy: new ort.Tensor("float32", tensor, [1, 5, REGION_PX, REGION_PX]),
  });
  const mOut = await session.run({
    frames_xy: new ort.Tensor("float32", mTensor, [1, 5, REGION_PX, REGION_PX]),
  });
  const obj = out.objectness.data as Float32Array;
  const box = out.boxes.data as Float32Array;
  const mObj = mOut.objectness.data as Float32Array;
  const mBox = mOut.boxes.data as Float32Array;

  const raw = decodeHandCandidates(obj, box, false);
  raw.push(...decodeHandCandidates(mObj, mBox, true));
  const frameCands = raw.map((c) => ({ box: unletterboxBox(c.box, transform), score: c.score }));
  return pickHandCandidates(frameCands);
}

// crop_hand: square crop (scale 1.8 default), resize 256 INTER_AREA. Returns the
// 256px RGBA crop + crop_box in sc-norm. `sc` is the pixel-crop ImageData.
export function cropHand(sc: ImageData, box: number[]): { rgba: Uint8ClampedArray; cropBox: number[] } {
  const w = sc.width;
  const h = sc.height;
  const [x0, y0, x1, y1] = orderBox(box);
  const px0 = x0 * w;
  const py0 = y0 * h;
  const px1 = x1 * w;
  const py1 = y1 * h;
  const bw = Math.max(2, px1 - px0);
  const bh = Math.max(2, py1 - py0);
  const scale = y1 >= HAND_BOTTOM_EDGE_CROP_THRESHOLD ? HAND_BOTTOM_EDGE_CROP_SCALE : HAND_DEFAULT_CROP_SCALE;
  const side = Math.min(Math.max(bw, bh) * scale, Math.min(w, h));
  const cx = (px0 + px1) * 0.5;
  const cy = (py0 + py1) * 0.5;
  const cx0 = Math.min(Math.max(0, cx - side * 0.5), w - side);
  const cy0 = Math.min(Math.max(0, cy - side * 0.5), h - side);
  // integer pixel crop bounds (floor / ceil) matching numpy slice + cv2.resize
  const ix0 = Math.floor(cx0);
  const iy0 = Math.floor(cy0);
  const ix1 = Math.ceil(cx0 + side);
  const iy1 = Math.ceil(cy0 + side);
  const sw = ix1 - ix0;
  const sh = iy1 - iy0;
  const rgba = cropResizeRgbaArea(sc, ix0, iy0, sw, sh, RTM_PX, RTM_PX);
  return { rgba, cropBox: [cx0 / w, cy0 / h, (cx0 + side) / w, (cy0 + side) / h] };
}

// rtmpose_tensor: (x-MEAN)/STD, CHW, batched. crops: array of 256px RGBA.
function rtmposeTensor(crops: Uint8ClampedArray[]): Float32Array {
  const plane = RTM_PX * RTM_PX;
  const data = new Float32Array(crops.length * 3 * plane);
  for (let b = 0; b < crops.length; b += 1) {
    const c = crops[b];
    const base = b * 3 * plane;
    for (let i = 0; i < plane; i += 1) {
      const p = i * 4;
      data[base + i] = (c[p] - RTM_MEAN[0]) / RTM_STD[0];
      data[base + plane + i] = (c[p + 1] - RTM_MEAN[1]) / RTM_STD[1];
      data[base + 2 * plane + i] = (c[p + 2] - RTM_MEAN[2]) / RTM_STD[2];
    }
  }
  return data;
}

// decode_simcc_vectorized for one hand: soft-argmax (window 7) over x and y bins.
// simccX/simccY are length KEYPOINTS*BINS for this hand. Returns landmarks (crop-norm)
// and raw peak scores per keypoint.
function decodeSimccHand(
  simccX: Float32Array, simccY: Float32Array, offset: number, bins: number,
): { points: number[][]; raw: number[] } {
  const points: number[][] = [];
  const raw: number[] = [];
  const axis = (data: Float32Array, kBase: number): { coord: number; peakVal: number } => {
    let peak = 0;
    let peakVal = -Infinity;
    for (let n = 0; n < bins; n += 1) {
      const v = data[kBase + n];
      if (v > peakVal) {
        peakVal = v;
        peak = n;
      }
    }
    const lo = Math.max(0, peak - SIMCC_WINDOW);
    const hi = Math.min(bins - 1, peak + SIMCC_WINDOW);
    let mx = -Infinity;
    for (let n = lo; n <= hi; n += 1) mx = Math.max(mx, data[kBase + n]);
    let denom = 0;
    let acc = 0;
    for (let n = lo; n <= hi; n += 1) {
      const e = Math.exp(data[kBase + n] - mx);
      denom += e;
      acc += e * n;
    }
    const coord = denom > 0 ? acc / denom : peak;
    return { coord, peakVal };
  };
  for (let k = 0; k < KEYPOINTS; k += 1) {
    const kBase = offset + k * bins;
    const ax = axis(simccX, kBase);
    const ay = axis(simccY, kBase);
    const x = clamp(ax.coord / bins, 0, 1);
    const y = clamp(ay.coord / bins, 0, 1);
    points.push([x, y]);
    raw.push((ax.peakVal + ay.peakVal) * 0.5);
  }
  return { points, raw };
}

export function projectCropPointsToFrame(points: number[][], cropBox: number[]): number[][] {
  const [bx0, by0, bx1, by1] = cropBox;
  const dw = Math.max(0, bx1 - bx0);
  const dh = Math.max(0, by1 - by0);
  return points.map(([x, y]) => [clamp(bx0 + x * dw, 0, 1), clamp(by0 + y * dh, 0, 1)]);
}

// decode the region model signing box from a 96px region tensor output.
export function decodeSigningBox(objectness: Float32Array, boxes: Float32Array): number[] {
  let best = 0;
  let bestScore = -Infinity;
  const objBase = SIGNING_TARGET * GRID * GRID;
  for (let i = 0; i < GRID * GRID; i += 1) {
    const s = objectness[objBase + i];
    if (s > bestScore) {
      bestScore = s;
      best = i;
    }
  }
  const gy = Math.floor(best / GRID);
  const gx = best % GRID;
  const box: number[] = [];
  for (let c = 0; c < 4; c += 1) {
    box.push(boxes[((SIGNING_TARGET * 4 + c) * GRID + gy) * GRID + gx]);
  }
  return orderBox(box);
}

// Run the full RTMPose landmark path for one full-frame RGBA image.
// Returns hands with landmarks in signing-crop [0,1] space + the signing cropBox.
export async function runRtmposeFrame(
  ort: OrtModule, sessions: RtmposeSessions, sourceImage: ImageData,
): Promise<{ hands: Hand[]; cropBox: number[] }> {
  const W = sourceImage.width;
  const H = sourceImage.height;

  // 1) region on 96px INTER_AREA full frame -> signing box -> expandCrop -> pixel crop sc
  const regionRgba = cropResizeRgbaArea(sourceImage, 0, 0, W, H, REGION_PX, REGION_PX);
  const regionOut = await sessions.region.run({
    frames_xy: new ort.Tensor("float32", tensorDataFromRgba(regionRgba, REGION_PX), [1, 5, REGION_PX, REGION_PX]),
  });
  const signingBox = decodeSigningBox(
    regionOut.objectness_logits.data as Float32Array,
    regionOut.boxes_xyxy_norm.data as Float32Array,
  );
  const cropBox = expandCrop(signingBox);
  // pixel-space signing crop, matching int() truncation in feasibility
  let sx1 = Math.trunc(cropBox[0] * W);
  let sy1 = Math.trunc(cropBox[1] * H);
  let sx2 = Math.trunc(cropBox[2] * W);
  let sy2 = Math.trunc(cropBox[3] * H);
  sx1 = Math.max(0, sx1);
  sy1 = Math.max(0, sy1);
  sx2 = Math.max(sx1 + 1, sx2);
  sy2 = Math.max(sy1 + 1, sy2);
  const scW = sx2 - sx1;
  const scH = sy2 - sy1;
  // build the signing-crop ImageData at native pixel resolution (no resample)
  const scRgba = cropResizeRgbaArea(sourceImage, sx1, sy1, scW, scH, scW, scH);
  const sc: ImageData = { data: scRgba, width: scW, height: scH } as ImageData;

  // 2) hand detection on the signing crop
  const handRegions = (await detectorHands(ort, sessions.hands, sc)).slice(0, 2);

  // 3) crop each hand to 256px, batched rtmpose
  const crops: Uint8ClampedArray[] = [];
  const cropBoxes: number[][] = [];
  for (const hand of handRegions) {
    const { rgba, cropBox: cb } = cropHand(sc, hand.box);
    crops.push(rgba);
    cropBoxes.push(cb);
  }

  const emptyHands: Hand[] = HANDS.map((name) => ({
    name,
    landmarks: Array.from({ length: KEYPOINTS }, () => [0, 0]),
    probability: 0,
  }));

  if (crops.length === 0) {
    return { hands: emptyHands, cropBox };
  }

  const rtmOut = await sessions.rtmpose.run({
    input: new ort.Tensor("float32", rtmposeTensor(crops), [crops.length, 3, RTM_PX, RTM_PX]),
  });
  const simccX = rtmOut.simcc_x.data as Float32Array;
  const simccY = rtmOut.simcc_y.data as Float32Array;
  const bins = RTM_BINS;
  const perHand = KEYPOINTS * bins;

  // 4) decode + project + presence, assign 2 slots sorted by wrist x
  type Entry = { wristX: number; pts: number[][]; pres: number };
  const entries: Entry[] = [];
  for (let i = 0; i < crops.length; i += 1) {
    const { points, raw } = decodeSimccHand(simccX, simccY, i * perHand, bins);
    const pts = projectCropPointsToFrame(points, cropBoxes[i]);
    const mean = raw.reduce((a, b) => a + b, 0) / raw.length;
    const pres = clamp(mean, 0, 1);
    entries.push({ wristX: pts[0][0], pts, pres });
  }
  entries.sort((a, b) => a.wristX - b.wristX);

  const hands: Hand[] = HANDS.map((name, slot) => {
    const e = entries[slot];
    if (!e) {
      return { name, landmarks: Array.from({ length: KEYPOINTS }, () => [0, 0]), probability: 0 };
    }
    return { name, landmarks: e.pts, probability: e.pres };
  });
  return { hands, cropBox };
}
