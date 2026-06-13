// All-scratch SimCC-w48 recognition pipeline for /practice. Replicates the
// ws1 recognizer feature extraction EXACTLY
// (/Users/kelly/ws1-recog-extract-ws/extract_simccw48.py — the dialect the
// run10 recognizer was trained on, session 962: test recall@FAR10 0.9209,
// top-1 0.5428) so recognizer-simccw48.onnx sees the landmark dialect it was
// trained on. No pretrained models anywhere in this path: region grid,
// hand detector, SimCC w48 landmark student, and recognizer are all
// trained-from-scratch.
//
// Per frame: region (detector0-grid-big2) on a 96px INTER_AREA resize of the
// full frame -> signing-crop box (target index 3) -> expandCrop -> pixel crop
// `sc` -> detector_hands(hands2, sc)[:2] (letterbox 114 + mirror pass, NMS,
// top-2) -> crop_hand (256px square, scale 1.8) -> batched SimCC w48 student
// ((B,3,256,256) imagenet-norm -> simcc_x/simcc_y (B,21,512) logits) ->
// decode_simcc_argmax (argmax/2/(256-1), score = sqrt(softmax peak x*y)) ->
// project to signing-crop [0,1] -> slots sorted by wrist x. Presence = mean
// decode score over the 21 keypoints (NOT the RTMPose raw-peak formula — see
// extract_simccw48.py's presence note). The scratch handFeature/frameFeature
// then apply unchanged.

import {
  KEYPOINTS,
  HANDS,
  type OrtModule,
  type OrtSession,
  type Hand,
  clamp,
  expandCrop,
  cropResizeRgbaArea,
  tensorDataFromRgba,
} from "./scratch-pipeline";
import { REGION_PX } from "./scratch-pipeline";
import {
  RTM_PX as SIMCC_PX, // same 256px hand crop convention as the RTMPose path
  REGION_URL,
  HANDS_URL,
  chooseExecutionProviders,
  detectorHands,
  cropHand,
  projectCropPointsToFrame,
  decodeSigningBox,
} from "./rtmpose-pipeline";

// ---- constants (from simcc_hand_student.py) --------------------------------
const SIMCC_BINS = 512; // x_bins = y_bins = round(256 * split_ratio)
const SIMCC_SPLIT_RATIO = 2;
// imagenet_normalize operates on RGB in [0,1] (crop/255 first).
const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

export const SIMCC_STUDENT_URL = "/practice/ws1-hand-simcc-student-w48-v1.onnx";

// Phantom-hand gate (2026-06-11). detectorHands keeps any candidate with raw
// objectness > 0 (top-2 + NMS), so hand-less frames still yield "hands" —
// measured ~1.4 on synthetic no-hands frames — whose garbage landmarks then
// contaminate the 90-dim feature. Real-hand evidence (10 held-out PopSign
// clips, 294 frames with detections): per-frame TOP det p5=0.75, p10=1.60,
// p50=4.50. Gate 1.5 kills the phantom class at the cost of the weakest ~10%
// of real-clip detections (mostly rest/transition frames; empty slots are
// in-distribution — 26/320 sampled training-style frames already had zero
// dets). Validated against the 40-clip near-live held-out eval before ship:
// true-accept / wrong-prompt must not regress vs the run10 deploy receipt.
// Gated-out candidates still appear in SimccFrameDebug.detections with their
// scores, so /practice localhost debug captures show what the gate removed.
export const HAND_DET_MIN_SCORE = 1.5;

export type SimccSessions = { region: OrtSession; hands: OrtSession; simcc: OrtSession };

export async function loadSimccSessions(ort: OrtModule): Promise<SimccSessions> {
  const executionProviders = await chooseExecutionProviders();
  // logSeverityLevel 3 = Error+: silences the benign per-session
  // "VerifyEachNodeIsAssignedToAnEp" WebGPU->WASM fallback warning.
  const opts = {
    executionProviders,
    graphOptimizationLevel: "all" as const,
    logSeverityLevel: 3 as const,
  };
  // WebGPU EP forbids concurrent session creation — create sequentially.
  const region = await ort.InferenceSession.create(REGION_URL, opts);
  const hands = await ort.InferenceSession.create(HANDS_URL, opts);
  const simcc = await ort.InferenceSession.create(SIMCC_STUDENT_URL, opts);
  return { region, hands, simcc };
}

// simcc student tensor: (x/255 - MEAN) / STD, CHW, batched. crops: 256px RGBA.
function simccTensor(crops: Uint8ClampedArray[]): Float32Array {
  const plane = SIMCC_PX * SIMCC_PX;
  const data = new Float32Array(crops.length * 3 * plane);
  for (let b = 0; b < crops.length; b += 1) {
    const c = crops[b];
    const base = b * 3 * plane;
    for (let i = 0; i < plane; i += 1) {
      const p = i * 4;
      data[base + i] = (c[p] / 255 - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
      data[base + plane + i] = (c[p + 1] / 255 - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
      data[base + 2 * plane + i] = (c[p + 2] / 255 - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
    }
  }
  return data;
}

// decode_simcc_argmax for one hand: per-axis argmax over the 512 bins,
// coord = argmax / split_ratio / (256 - 1) clamped to [0,1]; per-keypoint
// score = sqrt(softmax_x_peak * softmax_y_peak). The softmax peak equals
// 1 / sum(exp(v - max)) so no full softmax array is needed.
function decodeSimccArgmaxHand(
  simccX: Float32Array, simccY: Float32Array, offset: number,
): { points: number[][]; scores: number[] } {
  const points: number[][] = [];
  const scores: number[] = [];
  const axis = (data: Float32Array, kBase: number): { idx: number; peakProb: number } => {
    let idx = 0;
    let max = -Infinity;
    for (let n = 0; n < SIMCC_BINS; n += 1) {
      const v = data[kBase + n];
      if (v > max) {
        max = v;
        idx = n;
      }
    }
    let denom = 0;
    for (let n = 0; n < SIMCC_BINS; n += 1) denom += Math.exp(data[kBase + n] - max);
    return { idx, peakProb: denom > 0 ? 1 / denom : 0 };
  };
  for (let k = 0; k < KEYPOINTS; k += 1) {
    const kBase = offset + k * SIMCC_BINS;
    const ax = axis(simccX, kBase);
    const ay = axis(simccY, kBase);
    const x = clamp(ax.idx / SIMCC_SPLIT_RATIO / (SIMCC_PX - 1), 0, 1);
    const y = clamp(ay.idx / SIMCC_SPLIT_RATIO / (SIMCC_PX - 1), 0, 1);
    points.push([x, y]);
    scores.push(Math.sqrt(Math.max(ax.peakProb * ay.peakProb, 0)));
  }
  return { points, scores };
}

// Per-frame internals exposed for the localhost debug capture on /practice.
// Cheap to assemble (no extra inference) — everything here is already computed.
export type SimccFrameDebug = {
  // ALL hands2 detector candidates on the signing crop (boxes in sc-norm
  // [0,1], raw objectness scores), PRE-gate — so phantom detections that
  // HAND_DET_MIN_SCORE removed are still visible here with their scores.
  detections: { box: number[]; score: number }[];
  // 256px hand crop boxes (sc-norm) for the KEPT (gate-passing) hands only.
  cropBoxes: number[][];
  // For each output hand slot (sorted by wrist x): the index into
  // `detections` that fed it, or -1 for an empty slot.
  slotDetection: number[];
};

// Run the full SimCC w48 landmark path for one full-frame RGBA image.
// Returns hands with landmarks in signing-crop [0,1] space + the signing
// cropBox, plus the per-frame `debug` internals (detector boxes/scores).
export async function runSimccFrame(
  ort: OrtModule, sessions: SimccSessions, sourceImage: ImageData,
): Promise<{ hands: Hand[]; cropBox: number[]; debug: SimccFrameDebug }> {
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
  // pixel-space signing crop, matching int() truncation in extract_simccw48.py
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

  // 2) hand detection on the signing crop, phantom-gated (see
  // HAND_DET_MIN_SCORE). keptIdx maps kept hands back to allDets indices so
  // the debug payload can show gated-out candidates too.
  const allDets = await detectorHands(ort, sessions.hands, sc);
  const keptIdx: number[] = [];
  for (let i = 0; i < allDets.length && keptIdx.length < 2; i += 1) {
    if (allDets[i].score >= HAND_DET_MIN_SCORE) keptIdx.push(i);
  }
  const handRegions = keptIdx.map((i) => allDets[i]);

  // 3) crop each hand to 256px, batched SimCC student
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
    return {
      hands: emptyHands,
      cropBox,
      debug: {
        detections: allDets.map((r) => ({ box: r.box.slice(), score: r.score })),
        cropBoxes: [],
        slotDetection: HANDS.map(() => -1),
      },
    };
  }

  const simccOut = await sessions.simcc.run({
    input: new ort.Tensor("float32", simccTensor(crops), [crops.length, 3, SIMCC_PX, SIMCC_PX]),
  });
  const simccX = simccOut.simcc_x.data as Float32Array;
  const simccY = simccOut.simcc_y.data as Float32Array;
  const perHand = KEYPOINTS * SIMCC_BINS;

  // 4) decode + project + presence, assign 2 slots sorted by wrist x.
  // Presence = clip(mean decode score, 0, 1) — the student's native confidence.
  type Entry = { wristX: number; pts: number[][]; pres: number; src: number };
  const entries: Entry[] = [];
  for (let i = 0; i < crops.length; i += 1) {
    const { points, scores } = decodeSimccArgmaxHand(simccX, simccY, i * perHand);
    const pts = projectCropPointsToFrame(points, cropBoxes[i]);
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const pres = clamp(mean, 0, 1);
    entries.push({ wristX: pts[0][0], pts, pres, src: i });
  }
  entries.sort((a, b) => a.wristX - b.wristX);

  const hands: Hand[] = HANDS.map((name, slot) => {
    const e = entries[slot];
    if (!e) {
      return { name, landmarks: Array.from({ length: KEYPOINTS }, () => [0, 0]), probability: 0 };
    }
    return { name, landmarks: e.pts, probability: e.pres };
  });
  return {
    hands,
    cropBox,
    debug: {
      detections: allDets.map((r) => ({ box: r.box.slice(), score: r.score })),
      cropBoxes: cropBoxes.map((b) => b.slice()),
      slotDetection: HANDS.map((_, slot) => {
        const e = entries[slot];
        return e ? keptIdx[e.src] : -1;
      }),
    },
  };
}
