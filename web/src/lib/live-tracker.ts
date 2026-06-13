"use client";

// Live hand/region tracking for the lesson camera (PREVIEW / demonstration only).
//
// This is a faithful TypeScript port of the verified browser inference in
// tools/detector0-annotator/web-pilot/pipeline.js (region detector +
// per-frame hand-landmark model, area-resampled crops for cv2.INTER_AREA
// parity). It runs OUR from-scratch ONNX models entirely in-browser:
//   - detector0-hands2.onnx             -> multi-instance hand + head/body boxes
//   - rtmpose-hand-fp16.onnx            -> single-hand RTMPose x 21 keypoints
//   - rtmpose-body-fp16.onnx            -> COCO body/head RTMPose x 17 keypoints
// No pretrained model ships at runtime; these are our trained artifacts. This
// path is a visual tracking overlay only and does NOT touch the promoted
// model-card / recognition gate.

type OrtModule = typeof import("onnxruntime-web/webgpu");
type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;
type OrtExecutionProvider = "webgpu" | "wasm";

const ORT_WASM_PATH = "/api/ort/"; // keep in sync with client-model.ts
const TRACKING_BASE = "/tracking/";
const REGION_MODEL = "detector0-hands2.onnx";
const LANDMARK2_MODEL = "rtmpose-hand-fp16.onnx"; // RTMPose-Hand (Hand5, public GT), SimCC, stage 2 (fp16: near-lossless, WebGPU-native)
const BODY_MODEL = "rtmpose-body-fp16.onnx"; // RTMPose-Body, SimCC, portrait 192x256 (fp16)
const RTM_PX = 256; // RTMPose input size
const RTM_BINS = 512; // SimCC bins per axis (256px * split_ratio 2.0)
// Soft-argmax: instead of taking the raw argmax bin, softmax a small window of
// logits centered on the peak and use the probability-weighted expected bin.
// This gives sub-bin precision and noticeably less frame-to-frame jitter while
// staying local to the peak (so a distant secondary mode can't drag the result).
const SIMCC_SOFT_WINDOW = 7; // +-7 bins around the argmax peak
const RTM_MEAN = [123.675, 116.28, 103.53]; // ImageNet mean (RGB, 0-255)
const RTM_STD = [58.395, 57.12, 57.375];
const BODY_W = 192;
const BODY_H = 256;
const BODY_X_BINS = 384;
const BODY_Y_BINS = 512;
const BODY_KEYPOINTS = 17;
const BODY_CROP_ASPECT = BODY_W / BODY_H;
const BODY_CROP_HEIGHT_SCALE = 2.4; // tuned: grid-swept on the test video for best body-wrist<->detected-hand alignment (0.21->0.177)
const BODY_CROP_CENTER_Y_SHIFT = 0.1; // box-height units; +0.1 keeps shoulders/torso in the crop so the pose isn't compressed
const BODY_SIMCC_MIN_CONFIDENCE = 0.01;
const BODY_LANDMARK_DEAD_ZONE = 0.004;
const BODY_RENDER_EDGE_MARGIN = 0.002;
const HAND_GATE = 0.0; // hand objectness logit gate: sigmoid(logit) > 0.5
const HAND_NMS_IOU = 0.5; // M3JA eval: 0.5 improves real two-hand coverage without reintroducing collapse.
const HAND_DUPLICATE_MIN_CONTAINMENT = 0.6;
const HAND_DUPLICATE_CENTER_RATIO = 0.55;
const HAND_DUPLICATE_MIN_SCALE_RATIO = 0.55;
const HAND_DUPLICATE_MIN_AREA_RATIO = 0.35;
const HAND_DUPLICATE_REPLACE_SCORE_MARGIN = 0.5;
const HAND_DETECTOR_MAX_REASONABLE_AREA = 0.16;
const HAND_DUPLICATE_AREA_REPLACE_RATIO = 1.25;
// The second selected hand must be at least this far (center distance / larger
// box side) from the first to count as a distinct physical hand. boxesLookLikeSameHand
// only catches *overlapping* duplicates; two non-overlapping detector boxes on the
// same hand slip through and put both tracks on one hand. This positive separation
// gate is the fix for "both boxes collapse onto a single hand". Tunable; two real
// hands in the signing space are well separated (ratio ~>=1), same-hand re-fires
// sit near ~0.5.
const HAND_MIN_PAIR_CENTER_SEPARATION = 0.7;
// A single hand box wider than this (frame [0,1] units) is almost always a
// two-hand "union" box or a forearm/desk grab, not one hand. Measured on the
// user's recorded failure frames: real hand boxes top out at ~0.33 wide while
// union/forearm boxes run 0.40-0.57, so 0.36 cleanly separates them. Rejecting
// these is the primary fix for "both hands collapse into one box" — the union
// crop never gets selected to feed a garbage two-hand landmark crop. Width (not
// area) is the discriminator because open palms close to camera are large-area
// but normal-width.
const HAND_DETECTOR_MAX_BOX_WIDTH = 0.36;
const HAND_TRACK_IOU_GATE = 0.2;
const HAND_TRACK_CENTER_GATE = 0.75;
const HAND_TRACK_IOU_WEIGHT = 0.85;
const HAND_TRACK_MISSED_COST = 0.08;
const HAND_TRACK_MAX_MISSED_FRAMES = 4;
const HAND_COAST_SCORE_DECAY = 0.55;
const HAND_LANDMARK_DEAD_ZONE = 0.004;
const HAND_BOX_SMOOTHING_RATIO = 0.85;
const HAND_LANDMARK_BOX_PADDING_RATIO = 0.2;
const HAND_LANDMARK_BOX_MIN_PADDING = 0.018;
const HAND_LANDMARK_DISPLAY_MAX_AREA_RATIO = 1.25;
const HAND_MAX_SKELETON_EDGE = 0.38;
const HAND_MAX_DISPLAY_BOX_AREA = 0.28;
const HAND_MIN_DISPLAY_BOX_AREA = 0.002;
const HAND_MAX_DISPLAY_TO_DETECTOR_AREA_RATIO = 5;
const HAND_BOTTOM_EDGE_CROP_THRESHOLD = 0.9;
const HAND_DEFAULT_CROP_SCALE = 1.8;
const HAND_BOTTOM_EDGE_CROP_SCALE = 1.0;
const HAND_LANDMARK_DETECTOR_MAX_CENTER_RATIO = 0.9;
const HAND_LANDMARK_DETECTOR_MIN_OVERLAP = 0.15;

// One-Euro filter (Casiez et al. 2012) parameters, replacing the fixed-alpha EMA
// smoothing. Lower min-cutoff => more smoothing when the point is slow (kills
// jitter at rest); beta raises the cutoff with speed so fast motion is not
// laggy. dcutoff smooths the speed estimate itself. Coordinates are in [0,1]
// normalized frame units. Tuned conservatively; expose as constants.
const ONE_EURO_MIN_CUTOFF = 1.0;   // Hz; smaller = smoother (more lag) at rest
const ONE_EURO_BETA = 0.02;        // speed coefficient; larger = less lag on fast motion
const ONE_EURO_DCUTOFF = 1.0;      // Hz; cutoff for the derivative low-pass
const ONE_EURO_DEFAULT_FPS = 30;   // fallback dt source when no timestamp delta yet

export const REGION_TARGETS = [
  "head_or_face",
  "upper_body_or_signing_space",
] as const;
export const HANDS = ["hand_0", "hand_1"] as const;

const REGION_PX = 96;
const GRID = 12;
const KEYPOINTS = 21;
// Detector preprocessing pads the frame into a square 96x96 input preserving
// aspect ratio (letterbox) instead of stretching it. Padding is symmetric, so a
// horizontal mirror of the letterboxed image still corresponds to a horizontal
// mirror of the frame (the mirrored detector pass relies on this). Mid-gray pad
// (114) is the conventional letterbox fill — neutral, not a strong edge.
const REGION_LETTERBOX_PAD = 114;

export const HAND_EDGES: ReadonlyArray<[number, number]> = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

export const BODY_EDGES: ReadonlyArray<[number, number]> = [
  [5, 7], [7, 9],
  [6, 8], [8, 10],
  [5, 6],
  [5, 11], [6, 12], [11, 12],
  [0, 5], [0, 6],
  [0, 1], [0, 2],
  [1, 3], [2, 4],
];

type Point = [number, number];
type RegionBox = { box: number[]; score: number };
type HandRenderMode = "full" | "box-only" | "coasted";
type HandTrack = {
  id: string;
  box: number[];
  displayBox: number[];
  landmarks: Point[];
  score: number;
  missed: number;
};
type AssociatedHandRegion = { id: string; box: number[]; score: number; previous: HandTrack | null };
type EmittedHandTrack = {
  id: string;
  box: number[];
  landmarks: Point[];
  score: number;
  displayBox: number[];
  renderMode: HandRenderMode;
  missed: number;
};
type PixelCrop = { x: number; y: number; width: number; height: number };
type NavigatorWithGpu = Navigator & {
  gpu?: {
    requestAdapter: () => Promise<{
      features?: {
        has: (feature: string) => boolean;
      };
    } | null>;
  };
};

export type HandResult = {
  name: string;
  landmarks: Point[];
  probability: number;
  present: boolean;
  renderMode: HandRenderMode;
  staleFrames: number;
};

export type TrackResult = {
  regions: Record<string, { box: number[]; score: number }>;
  cropBox: number[];
  body: Point[];
  hands: HandResult[];
};

function clamp(v: number, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function boxIoU(a: number[], b: number[]): number {
  const ix1 = Math.max(a[0], b[0]), iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]), iy2 = Math.min(a[3], b[3]);
  const iw = Math.max(0, ix2 - ix1), ih = Math.max(0, iy2 - iy1);
  const inter = iw * ih;
  const ua = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter;
  return ua > 0 ? inter / ua : 0;
}

function boxArea(box: number[]): number {
  return Math.max(0, box[2] - box[0]) * Math.max(0, box[3] - box[1]);
}

function boxIntersectionArea(a: number[], b: number[]): number {
  const ix1 = Math.max(a[0], b[0]), iy1 = Math.max(a[1], b[1]);
  const ix2 = Math.min(a[2], b[2]), iy2 = Math.min(a[3], b[3]);
  return Math.max(0, ix2 - ix1) * Math.max(0, iy2 - iy1);
}

function smallerBoxContainment(a: number[], b: number[]): number {
  const smaller = Math.min(boxArea(a), boxArea(b));
  return smaller > 0 ? boxIntersectionArea(a, b) / smaller : 0;
}

function boxAreaRatio(a: number[], b: number[]): number {
  const small = Math.min(boxArea(a), boxArea(b));
  const large = Math.max(boxArea(a), boxArea(b));
  return large > 0 ? small / large : 0;
}

function boxCenterDistance(a: number[], b: number[]): number {
  const ax = (a[0] + a[2]) / 2;
  const ay = (a[1] + a[3]) / 2;
  const bx = (b[0] + b[2]) / 2;
  const by = (b[1] + b[3]) / 2;
  return Math.hypot(ax - bx, ay - by);
}

function boxMaxSide(box: number[]): number {
  return Math.max(box[2] - box[0], box[3] - box[1]);
}

function boxScaleRatio(a: number[], b: number[]): number {
  const small = Math.min(boxMaxSide(a), boxMaxSide(b));
  const large = Math.max(boxMaxSide(a), boxMaxSide(b));
  return large > 0 ? small / large : 0;
}

function boxesLookLikeSameHand(a: number[], b: number[]): boolean {
  const iou = boxIoU(a, b);
  if (iou >= HAND_NMS_IOU) return true;

  const containment = smallerBoxContainment(a, b);
  const scale = Math.max(boxMaxSide(a), boxMaxSide(b), 1e-6);
  const closeCenters = boxCenterDistance(a, b) / scale <= HAND_DUPLICATE_CENTER_RATIO;
  const similarScale = boxScaleRatio(a, b) >= HAND_DUPLICATE_MIN_SCALE_RATIO;
  const similarArea = boxAreaRatio(a, b) >= HAND_DUPLICATE_MIN_AREA_RATIO;
  const comparableBoxes = similarScale && similarArea;
  if (containment >= HAND_DUPLICATE_MIN_CONTAINMENT) return comparableBoxes && closeCenters;
  return closeCenters && comparableBoxes && (iou >= HAND_NMS_IOU * 0.5 || containment >= 0.3);
}

// Two detections are accepted as SEPARATE physical hands only when they are not
// the same hand by the similarity test AND their centers are far enough apart
// relative to box size. Prevents the detector's two highest-scoring boxes — which
// can both land on one hand — from becoming two tracks on the same hand.
function handsAreSeparate(a: number[], b: number[]): boolean {
  if (boxesLookLikeSameHand(a, b)) return false;
  const scale = Math.max(boxMaxSide(a), boxMaxSide(b), 1e-6);
  return boxCenterDistance(a, b) / scale >= HAND_MIN_PAIR_CENTER_SEPARATION;
}

function isBetterDuplicateHandCandidate(candidate: RegionBox, existing: RegionBox): boolean {
  if (candidate.score > existing.score + HAND_DUPLICATE_REPLACE_SCORE_MARGIN) return true;
  if (Math.abs(candidate.score - existing.score) > HAND_DUPLICATE_REPLACE_SCORE_MARGIN) return false;

  const candidateArea = boxArea(candidate.box);
  const existingArea = boxArea(existing.box);
  return candidateArea <= HAND_DETECTOR_MAX_REASONABLE_AREA
    && candidateArea > existingArea * HAND_DUPLICATE_AREA_REPLACE_RATIO;
}

function flipBoxX(box: number[]): number[] {
  return orderBox([1 - box[2], box[1], 1 - box[0], box[3]]);
}

function clampByte(v: number) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function orderBox(box: number[]) {
  const [x1, y1, x2, y2] = box.map((v) => clamp(v));
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

function expandCrop(box: number[]) {
  const [x1, y1, x2, y2] = box;
  const w = x2 - x1;
  const h = y2 - y1;
  return [
    Math.max(0, x1 - 0.25 * w),
    Math.max(0, y1 - 0.35 * h),
    Math.min(1, x2 + 0.25 * w),
    Math.min(1, y2 + 0.12 * h),
  ];
}

// Area-weighted resample = cv2.INTER_AREA parity (the resize that fixed
// JS<->Python landmark mismatch). Do not swap for canvas drawImage.
function cropResizeRgbaArea(
  imageData: ImageData,
  sx: number,
  sy: number,
  sw: number,
  sh: number,
  dw: number,
  dh: number,
): Uint8ClampedArray {
  const src = imageData.data;
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y += 1) {
    const y0 = Math.max(0, sy + (y * sh) / dh);
    const y1 = Math.min(imageData.height, sy + ((y + 1) * sh) / dh);
    const iy0 = Math.floor(y0);
    const iy1 = Math.max(iy0 + 1, Math.ceil(y1));
    for (let x = 0; x < dw; x += 1) {
      const x0 = Math.max(0, sx + (x * sw) / dw);
      const x1 = Math.min(imageData.width, sx + ((x + 1) * sw) / dw);
      const ix0 = Math.floor(x0);
      const ix1 = Math.max(ix0 + 1, Math.ceil(x1));
      const sums = [0, 0, 0];
      let area = 0;
      for (let iy = iy0; iy < iy1; iy += 1) {
        if (iy < 0 || iy >= imageData.height) continue;
        const oy = Math.max(0, Math.min(iy + 1, y1) - Math.max(iy, y0));
        if (oy <= 0) continue;
        for (let ix = ix0; ix < ix1; ix += 1) {
          if (ix < 0 || ix >= imageData.width) continue;
          const ox = Math.max(0, Math.min(ix + 1, x1) - Math.max(ix, x0));
          if (ox <= 0) continue;
          const weight = ox * oy;
          const p = (iy * imageData.width + ix) * 4;
          sums[0] += src[p] * weight;
          sums[1] += src[p + 1] * weight;
          sums[2] += src[p + 2] * weight;
          area += weight;
        }
      }
      const o = (y * dw + x) * 4;
      if (area > 0) {
        out[o] = clampByte(sums[0] / area);
        out[o + 1] = clampByte(sums[1] / area);
        out[o + 2] = clampByte(sums[2] / area);
      }
      out[o + 3] = 255;
    }
  }
  return out;
}

// Maps a box decoded in letterboxed-input [0,1] coordinates back to the
// original frame's [0,1] coordinates by removing the symmetric pad offset and
// dividing by the content scale (content fraction of the square input). Inverse
// of the letterbox placement in letterboxRegion(). Returns an ordered, clamped
// box. With no padding (square frame, pad=0, scale=1) this is the identity.
type LetterboxTransform = { padXFrac: number; padYFrac: number; contentXFrac: number; contentYFrac: number };

function unletterboxBox(box: number[], t: LetterboxTransform): number[] {
  const fx = (v: number) => (v - t.padXFrac) / t.contentXFrac;
  const fy = (v: number) => (v - t.padYFrac) / t.contentYFrac;
  return orderBox([fx(box[0]), fy(box[1]), fx(box[2]), fy(box[3])]);
}

// Letterbox the full frame into a square `size`x`size` RGBA buffer: resize
// preserving aspect ratio (area-resampled, INTER_AREA parity) and center it on a
// mid-gray padded canvas. Returns the buffer plus the transform needed to map
// decoded boxes from letterboxed-input [0,1] back to frame [0,1]. Padding is
// symmetric on each axis so a horizontal mirror of this buffer equals a
// horizontal mirror of the frame content (the mirrored detector pass needs this).
function letterboxRegion(
  imageData: ImageData,
  size: number,
  pad = REGION_LETTERBOX_PAD,
): { rgba: Uint8ClampedArray; transform: LetterboxTransform } {
  const w = imageData.width;
  const h = imageData.height;
  const scale = Math.min(size / w, size / h);
  // Content area inside the square, in destination pixels, centered.
  const contentW = Math.max(1, Math.min(size, Math.round(w * scale)));
  const contentH = Math.max(1, Math.min(size, Math.round(h * scale)));
  const offX = Math.floor((size - contentW) / 2);
  const offY = Math.floor((size - contentH) / 2);

  const out = new Uint8ClampedArray(size * size * 4);
  // Gray fill (opaque) for the padded border.
  for (let i = 0; i < size * size; i += 1) {
    const p = i * 4;
    out[p] = pad;
    out[p + 1] = pad;
    out[p + 2] = pad;
    out[p + 3] = 255;
  }
  // Resize the whole frame into the centered content region.
  const content = cropResizeRgbaArea(imageData, 0, 0, w, h, contentW, contentH);
  for (let y = 0; y < contentH; y += 1) {
    const srcRow = y * contentW * 4;
    const dstRow = ((y + offY) * size + offX) * 4;
    out.set(content.subarray(srcRow, srcRow + contentW * 4), dstRow);
  }

  return {
    rgba: out,
    transform: {
      padXFrac: offX / size,
      padYFrac: offY / size,
      contentXFrac: contentW / size,
      contentYFrac: contentH / size,
    },
  };
}

function tensorData(rgba: Uint8ClampedArray, size: number): Float32Array {
  const plane = size * size;
  const data = new Float32Array(5 * plane);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const i = y * size + x;
      const p = i * 4;
      data[i] = rgba[p] / 255;
      data[plane + i] = rgba[p + 1] / 255;
      data[2 * plane + i] = rgba[p + 2] / 255;
      data[3 * plane + i] = size > 1 ? x / (size - 1) : 0;
      data[4 * plane + i] = size > 1 ? y / (size - 1) : 0;
    }
  }
  return data;
}

function mirrorRgbaX(rgba: Uint8ClampedArray, width: number, height: number): Uint8ClampedArray {
  const mirrored = new Uint8ClampedArray(rgba.length);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const src = (y * width + x) * 4;
      const dst = (y * width + (width - 1 - x)) * 4;
      mirrored[dst] = rgba[src];
      mirrored[dst + 1] = rgba[src + 1];
      mirrored[dst + 2] = rgba[src + 2];
      mirrored[dst + 3] = rgba[src + 3];
    }
  }
  return mirrored;
}

function imageNetTensorData(rgba: Uint8ClampedArray, width: number, height: number): Float32Array {
  const plane = width * height;
  const data = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    const p = i * 4;
    data[i] = (rgba[p] - RTM_MEAN[0]) / RTM_STD[0];
    data[plane + i] = (rgba[p + 1] - RTM_MEAN[1]) / RTM_STD[1];
    data[2 * plane + i] = (rgba[p + 2] - RTM_MEAN[2]) / RTM_STD[2];
  }
  return data;
}

function bodyCropFromRegion(box: number[], frameW: number, frameH: number): PixelCrop {
  const [x1, y1, x2, y2] = orderBox(box);
  const px1 = x1 * frameW;
  const py1 = y1 * frameH;
  const px2 = x2 * frameW;
  const py2 = y2 * frameH;
  const bh = Math.max(2, py2 - py1);
  let cropH = Math.max(2, bh * BODY_CROP_HEIGHT_SCALE);
  let cropW = cropH * BODY_CROP_ASPECT;
  if (cropW > frameW) {
    cropW = frameW;
    cropH = cropW / BODY_CROP_ASPECT;
  }
  if (cropH > frameH) {
    cropH = frameH;
    cropW = cropH * BODY_CROP_ASPECT;
  }
  cropW = Math.max(2, Math.min(frameW, cropW));
  cropH = Math.max(2, Math.min(frameH, cropH));
  const cx = (px1 + px2) / 2;
  const cy = (py1 + py2) / 2 + BODY_CROP_CENTER_Y_SHIFT * bh;
  return {
    x: Math.min(Math.max(0, cx - cropW / 2), frameW - cropW),
    y: Math.min(Math.max(0, cy - cropH / 2), frameH - cropH),
    width: cropW,
    height: cropH,
  };
}

// Soft-argmax SimCC decode. Finds the argmax bin, then softmaxes a +-window of
// raw logits around it and returns the probability-weighted expected bin index
// (a fractional value for sub-bin precision). Confidence is the peak softmax
// probability within the window. The returned `index` is guaranteed to stay in
// [0, bins-1], so downstream normalization (index / bins) stays in [0, 1).
function simccSoftArgmax(
  data: Float32Array,
  base: number,
  bins: number,
  window = SIMCC_SOFT_WINDOW,
): { index: number; confidence: number } {
  let peak = 0;
  let peakValue = -Infinity;
  for (let b = 0; b < bins; b += 1) {
    const value = data[base + b];
    if (value > peakValue) {
      peakValue = value;
      peak = b;
    }
  }
  const lo = Math.max(0, peak - window);
  const hi = Math.min(bins - 1, peak + window);
  // Softmax over the window (subtract peak for numerical stability).
  let denom = 0;
  for (let b = lo; b <= hi; b += 1) {
    denom += Math.exp(data[base + b] - peakValue);
  }
  if (!(denom > 0)) {
    return { index: peak, confidence: 0 };
  }
  let expected = 0;
  let peakProb = 0;
  for (let b = lo; b <= hi; b += 1) {
    const p = Math.exp(data[base + b] - peakValue) / denom;
    expected += p * b;
    if (p > peakProb) peakProb = p;
  }
  // Clamp defensively; expected is already within [lo, hi] by construction.
  const index = Math.max(0, Math.min(bins - 1, expected));
  return { index, confidence: peakProb };
}

function isPlausiblePoint(point: Point): boolean {
  const [x, y] = point;
  return Number.isFinite(x) && Number.isFinite(y) && x >= 0 && x <= 1 && y >= 0 && y <= 1;
}

function quantile(values: number[], q: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((sorted.length - 1) * q)));
  return sorted[idx];
}

function handBoxFromLandmarks(points: Point[]): number[] | null {
  const valid = points.filter(isPlausiblePoint);
  if (valid.length < 8) return null;

  const xs = valid.map(([x]) => x);
  const ys = valid.map(([, y]) => y);
  const x1 = quantile(xs, 0.05);
  const x2 = quantile(xs, 0.95);
  const y1 = quantile(ys, 0.05);
  const y2 = quantile(ys, 0.95);
  const side = Math.max(x2 - x1, y2 - y1);
  const pad = Math.max(HAND_LANDMARK_BOX_MIN_PADDING, side * HAND_LANDMARK_BOX_PADDING_RATIO);
  return orderBox([x1 - pad, y1 - pad, x2 + pad, y2 + pad]);
}

function handDisplayBox(detectorBox: number[], points: Point[]): number[] {
  if (detectorBox[3] >= HAND_BOTTOM_EDGE_CROP_THRESHOLD) return detectorBox;
  const landmarkBox = handBoxFromLandmarks(points);
  if (!landmarkBox) return detectorBox;
  const detectorArea = boxArea(detectorBox);
  const landmarkArea = boxArea(landmarkBox);
  if (detectorArea > 0 && landmarkArea / detectorArea > HAND_LANDMARK_DISPLAY_MAX_AREA_RATIO) {
    return detectorBox;
  }
  return landmarkBox;
}

function handMaxSkeletonEdge(points: Point[]): number {
  let maxEdge = 0;
  for (const [a, b] of HAND_EDGES) {
    const pa = points[a];
    const pb = points[b];
    if (!pa || !pb || !isPlausiblePoint(pa) || !isPlausiblePoint(pb)) continue;
    maxEdge = Math.max(maxEdge, Math.hypot(pa[0] - pb[0], pa[1] - pb[1]));
  }
  return maxEdge;
}

function landmarksAgreeWithDetectorBox(detectorBox: number[], points: Point[]): boolean {
  const landmarkBox = handBoxFromLandmarks(points);
  if (!landmarkBox) return false;
  const overlapDenominator = Math.max(1e-6, Math.min(boxArea(detectorBox), boxArea(landmarkBox)));
  const overlap = boxIntersectionArea(detectorBox, landmarkBox) / overlapDenominator;
  const scale = Math.max(boxMaxSide(detectorBox), boxMaxSide(landmarkBox), 1e-6);
  const centerRatio = boxCenterDistance(detectorBox, landmarkBox) / scale;
  return overlap >= HAND_LANDMARK_DETECTOR_MIN_OVERLAP
    || centerRatio <= HAND_LANDMARK_DETECTOR_MAX_CENTER_RATIO;
}

function isPlausibleHandTrack(track: EmittedHandTrack): boolean {
  const displayArea = boxArea(track.displayBox);
  if (displayArea < HAND_MIN_DISPLAY_BOX_AREA || displayArea > HAND_MAX_DISPLAY_BOX_AREA) return false;
  const detectorArea = boxArea(track.box);
  if (detectorArea > 0 && displayArea / detectorArea > HAND_MAX_DISPLAY_TO_DETECTOR_AREA_RATIO) return false;
  if (!landmarksAgreeWithDetectorBox(track.box, track.landmarks)) return false;
  return handMaxSkeletonEdge(track.landmarks) <= HAND_MAX_SKELETON_EDGE;
}

function isUsableBoxOnlyHandTrack(track: EmittedHandTrack): boolean {
  const area = boxArea(track.displayBox);
  return area >= HAND_MIN_DISPLAY_BOX_AREA && area <= HAND_MAX_DISPLAY_BOX_AREA;
}

function handTrackMatchCost(candidate: RegionBox, track: HandTrack): number {
  const iou = boxIoU(candidate.box, track.box);
  const scale = Math.max(boxMaxSide(candidate.box), boxMaxSide(track.box), 1e-6);
  const centerRatio = boxCenterDistance(candidate.box, track.box) / scale;
  if (iou < HAND_TRACK_IOU_GATE && centerRatio > HAND_TRACK_CENTER_GATE && !boxesLookLikeSameHand(candidate.box, track.box)) {
    return Infinity;
  }
  return centerRatio - HAND_TRACK_IOU_WEIGHT * iou + track.missed * HAND_TRACK_MISSED_COST;
}

function handTrackSortScore(track: EmittedHandTrack): number {
  const modeBonus = track.renderMode === "full" ? 2 : track.renderMode === "box-only" ? 1 : 0;
  return modeBonus * 1000 + track.score - track.missed * 0.25;
}

function suppressDuplicateHandTracks(tracks: EmittedHandTrack[]): EmittedHandTrack[] {
  const kept: EmittedHandTrack[] = [];
  for (const track of [...tracks].sort((a, b) => handTrackSortScore(b) - handTrackSortScore(a))) {
    const duplicatesExisting = kept.some((existing) =>
      boxesLookLikeSameHand(track.displayBox, existing.displayBox)
    );
    if (!duplicatesExisting) kept.push(track);
    if (kept.length === HANDS.length) break;
  }
  return kept;
}

async function chooseExecutionProviders(): Promise<OrtExecutionProvider[]> {
  if (/\bHeadlessChrome\//.test(navigator.userAgent)) return ["wasm"];
  const gpu = (navigator as NavigatorWithGpu).gpu;
  if (!gpu) return ["wasm"];

  try {
    const adapter = await gpu.requestAdapter();
    return adapter?.features?.has("shader-f16") ? ["webgpu", "wasm"] : ["wasm"];
  } catch {
    return ["wasm"];
  }
}

function isDrawableBodyPoint(point: Point): boolean {
  const [x, y] = point;
  return isPlausiblePoint(point)
    && x > BODY_RENDER_EDGE_MARGIN
    && x < 1 - BODY_RENDER_EDGE_MARGIN
    && y > BODY_RENDER_EDGE_MARGIN
    && y < 1 - BODY_RENDER_EDGE_MARGIN;
}

function missingBody(): Point[] {
  return Array.from({ length: BODY_KEYPOINTS }, (): Point => [-1, -1]);
}

function decodeBox(boxes: Float32Array, channel: number, cell: number): number[] {
  const gy = Math.floor(cell / GRID);
  const gx = cell % GRID;
  const box: number[] = [];
  for (let c = 0; c < 4; c += 1) {
    const idx = ((channel * 4 + c) * GRID + gy) * GRID + gx;
    box.push(boxes[idx]);
  }
  return orderBox(box);
}

function decodeSingleRegion(objectness: Float32Array, boxes: Float32Array, channel: number): RegionBox {
  let best = 0;
  let bestScore = -Infinity;
  const objBase = channel * GRID * GRID;
  for (let i = 0; i < GRID * GRID; i += 1) {
    const score = objectness[objBase + i];
    if (score > bestScore) {
      bestScore = score;
      best = i;
    }
  }
  return { box: decodeBox(boxes, channel, best), score: bestScore };
}

function decodeHandRegions(objectness: Float32Array, boxes: Float32Array): RegionBox[] {
  return pickHandRegions(decodeHandCandidates(objectness, boxes));
}

function decodeHandCandidates(objectness: Float32Array, boxes: Float32Array, mirrored = false): RegionBox[] {
  const candidates: RegionBox[] = [];
  for (let i = 0; i < GRID * GRID; i += 1) {
    const box = decodeBox(boxes, 0, i);
    candidates.push({
      box: mirrored ? flipBoxX(box) : box,
      score: objectness[i],
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

function pickHandRegions(candidates: RegionBox[]): RegionBox[] {
  const sorted = [...candidates].sort((a, b) => b.score - a.score);

  const picked: RegionBox[] = [];
  for (const candidate of sorted) {
    if (candidate.score <= HAND_GATE) break;
    // Reject two-hand "union" / forearm boxes before they can be selected: a box
    // this wide is not a single hand. This is the primary fix for both hands
    // collapsing into one box (validated on the recorded failure frames).
    if (candidate.box[2] - candidate.box[0] > HAND_DETECTOR_MAX_BOX_WIDTH) continue;
    const duplicateIndex = picked.findIndex((hand) => boxesLookLikeSameHand(hand.box, candidate.box));
    if (duplicateIndex >= 0) {
      if (isBetterDuplicateHandCandidate(candidate, picked[duplicateIndex])) {
        picked[duplicateIndex] = { box: candidate.box, score: candidate.score };
      }
      continue;
    }
    // Spatial-separation gate for the 2nd+ hand: it must be clearly on a different
    // physical hand than every box already picked, not merely "not an overlapping
    // duplicate". A candidate in the ambiguous middle (close to an existing pick
    // but not overlapping) is skipped so we keep scanning for a genuinely separate
    // hand; if none exists we return a single hand rather than two on one hand.
    if (picked.length >= 1 && !picked.every((hand) => handsAreSeparate(hand.box, candidate.box))) {
      continue;
    }
    picked.push({ box: candidate.box, score: candidate.score });
    if (picked.length === HANDS.length) break;
  }

  return picked.sort((a, b) => {
    const ac = (a.box[0] + a.box[2]) / 2;
    const bc = (b.box[0] + b.box[2]) / 2;
    return ac - bc;
  });
}

function decodeRegions(objectness: Float32Array, boxes: Float32Array) {
  const decoded: Record<string, RegionBox> = {};
  for (let t = 0; t < REGION_TARGETS.length; t += 1) {
    const channel = t + 1;
    decoded[REGION_TARGETS[t]] = decodeSingleRegion(objectness, boxes, channel);
  }
  return {
    regions: decoded,
    hands: decodeHandRegions(objectness, boxes),
  };
}

function outF32(out: unknown, key: string): Float32Array {
  const tensor = (out as Record<string, { data?: unknown } | undefined>)[key];
  if (!tensor || !(tensor.data instanceof Float32Array)) {
    throw new Error(`live-tracker: model output '${key}' missing or not float32`);
  }
  return tensor.data;
}

// One-Euro filter for a fixed-length vector of scalars (Casiez, Roussel,
// Vogel 2012). Each element keeps a filtered value + filtered derivative; the
// cutoff frequency adapts to speed so slow motion is smoothed hard (low jitter)
// while fast motion stays responsive. `dt` is seconds between updates. Reset the
// filter (new instance, or call reset()) on track (re)acquisition so a
// reappearing point snaps to its new position instead of interpolating across a
// gap. With ONE_EURO_BETA=0 this reduces to a fixed-cutoff low-pass.
class OneEuroVector {
  private xPrev: number[] = [];
  private dxPrev: number[] = [];
  private initialized = false;
  constructor(
    private readonly minCutoff = ONE_EURO_MIN_CUTOFF,
    private readonly beta = ONE_EURO_BETA,
    private readonly dCutoff = ONE_EURO_DCUTOFF,
  ) {}

  private static alpha(cutoff: number, dt: number): number {
    const tau = 1 / (2 * Math.PI * cutoff);
    return 1 / (1 + tau / dt);
  }

  reset(): void {
    this.xPrev = [];
    this.dxPrev = [];
    this.initialized = false;
  }

  // Filter `values` sampled `dt` seconds after the previous call. On the first
  // call (or after reset / length change) the raw values pass through and seed
  // the state — this is the (re)acquisition snap.
  filter(values: number[], dt: number): number[] {
    if (!this.initialized || this.xPrev.length !== values.length || !(dt > 0)) {
      this.xPrev = values.slice();
      this.dxPrev = values.map(() => 0);
      this.initialized = true;
      return values.slice();
    }
    const out = new Array<number>(values.length);
    const aD = OneEuroVector.alpha(this.dCutoff, dt);
    for (let i = 0; i < values.length; i += 1) {
      const x = values[i];
      const dx = (x - this.xPrev[i]) / dt;
      const dxHat = aD * dx + (1 - aD) * this.dxPrev[i];
      const cutoff = this.minCutoff + this.beta * Math.abs(dxHat);
      const a = OneEuroVector.alpha(cutoff, dt);
      const xHat = a * x + (1 - a) * this.xPrev[i];
      this.xPrev[i] = xHat;
      this.dxPrev[i] = dxHat;
      out[i] = xHat;
    }
    return out;
  }
}

export class HandPoseTracker {
  private ort: OrtModule | null = null;
  private region: OrtSession | null = null;
  private landmark2: OrtSession | null = null;
  private body: OrtSession | null = null;
  private full: HTMLCanvasElement | null = null;
  private acc = { cap: 0, resize: 0, infer: 0, decode: 0 };
  // EMA per-stage timings (ms) + fps, exposed for the on-page profiler.
  profile = { cap: 0, resize: 0, infer: 0, decode: 0, total: 0, fps: 0 };
  // raw timings of the most recent process() call (for the benchmark harness).
  lastFrame = { cap: 0, resize: 0, infer: 0, decode: 0, total: 0 };
  // One-Euro smoothing state. `landmarkFilters` is keyed by hand-track key /
  // "body"; `boxFilters` by region target / hand-track key / "__crop__". The
  // previous-frame raw values used by the dead-zone live in `prevHands`/
  // `prevBoxes` (the filter's own xPrev is the smoothed value, not the raw one).
  private landmarkFilters: Map<string, OneEuroVector> = new Map();
  private boxFilters: Map<string, OneEuroVector> = new Map();
  private prevHands: Map<string, Point[]> = new Map();
  private prevBoxes: Map<string, number[]> = new Map();
  private lastFilterTime = 0;
  private frameDt = 1 / ONE_EURO_DEFAULT_FPS;
  private handTracks: HandTrack[] = [];
  private nextHandTrackId = 1;

  // `smoothing` is accepted for API compatibility (callers may still pass it),
  // but the smoother is now One-Euro, tuned by the ONE_EURO_* constants rather
  // than a single fixed alpha. The argument is intentionally unused.
  private skipBody = false;

  constructor(_smoothing = 0.35, options?: { skipBody?: boolean }) {
    void _smoothing;
    this.skipBody = options?.skipBody ?? false;
  }

  private boxFilter(name: string, scale = 1): OneEuroVector {
    let filter = this.boxFilters.get(name);
    if (!filter) {
      // `scale` lets the hand box smooth a touch harder than region boxes,
      // mirroring the old handBoxSmoothing ratio (lower min-cutoff = smoother).
      filter = new OneEuroVector(ONE_EURO_MIN_CUTOFF * scale, ONE_EURO_BETA, ONE_EURO_DCUTOFF);
      this.boxFilters.set(name, filter);
    }
    return filter;
  }

  private landmarkFilter(name: string): OneEuroVector {
    let filter = this.landmarkFilters.get(name);
    if (!filter) {
      filter = new OneEuroVector(ONE_EURO_MIN_CUTOFF, ONE_EURO_BETA, ONE_EURO_DCUTOFF);
      this.landmarkFilters.set(name, filter);
    }
    return filter;
  }

  get ready() {
    return Boolean(this.region && this.landmark2 && (this.skipBody || this.body));
  }

  async load(): Promise<void> {
    if (this.ready) return;
    const ort = await import("onnxruntime-web/webgpu");
    ort.env.wasm.wasmPaths = ORT_WASM_PATH;
    ort.env.wasm.numThreads = 1;
    this.ort = ort;
    const executionProviders = await chooseExecutionProviders();
    // WebGPU EP forbids concurrent session creation — create sequentially.
    // Coarse landmark model removed from the pipeline: RTMPose (stage 2) does
    // localization+refinement from the region hand box, and region-score gating
    // replaced the coarse presence flag. Only region + RTMPose remain.
    this.region = await ort.InferenceSession.create(`${TRACKING_BASE}${REGION_MODEL}`, {
      executionProviders,
      graphOptimizationLevel: "all",
      logSeverityLevel: 3,
    });
    this.landmark2 = await ort.InferenceSession.create(`${TRACKING_BASE}${LANDMARK2_MODEL}`, {
      executionProviders,
      graphOptimizationLevel: "all",
      logSeverityLevel: 3,
    });
    if (!this.skipBody) {
      this.body = await ort.InferenceSession.create(`${TRACKING_BASE}${BODY_MODEL}`, {
        executionProviders,
        graphOptimizationLevel: "all",
        logSeverityLevel: 3,
      });
    }
    this.full = document.createElement("canvas");
  }

  // One-Euro smoothing for a region/hand box (4 scalars). `scale` lowers the
  // min-cutoff for the hand box so it smooths a touch harder than region boxes.
  private blendBox(name: string, box: number[], scale = 1): number[] {
    const filter = this.boxFilter(name, scale);
    const smoothed = filter.filter(box, this.frameDt);
    this.prevBoxes.set(name, smoothed);
    return smoothed;
  }

  private blendHand(name: string, pts: Point[], present: boolean): Point[] {
    const prev = this.prevHands.get(name);
    if (!present) {
      // Lost track: drop filter state so the next acquisition snaps in.
      this.landmarkFilters.get(name)?.reset();
      this.prevHands.set(name, pts);
      return pts;
    }
    const filter = this.landmarkFilter(name);
    const flat = filter.filter(pts.flat(), this.frameDt);
    const smoothed = pts.map(([x, y], i): Point => {
      const fx = flat[i * 2];
      const fy = flat[i * 2 + 1];
      const prior = prev?.[i];
      // Dead-zone: hold position when the raw point barely moved (kills the last
      // sliver of resting jitter that the filter alone leaves).
      if (prior && Math.hypot(x - prior[0], y - prior[1]) < HAND_LANDMARK_DEAD_ZONE) return prior;
      return [fx, fy];
    });
    this.prevHands.set(name, smoothed);
    return smoothed;
  }

  private blendBody(pts: Point[]): Point[] {
    const key = "body";
    const prev = this.prevHands.get(key);
    const filter = this.landmarkFilter(key);
    // Don't feed implausible (off-frame / missing, e.g. [-1,-1]) keypoints into
    // the filter — that would poison its state. Substitute the last good smoothed
    // value so the derivative stays ~0 and the state is preserved across flicker.
    const filterInput: number[] = [];
    for (let i = 0; i < pts.length; i += 1) {
      const current = pts[i];
      const prior = prev?.[i];
      const usable = isPlausiblePoint(current)
        ? current
        : (prior && isPlausiblePoint(prior) ? prior : current);
      filterInput.push(usable[0], usable[1]);
    }
    const flat = filter.filter(filterInput, this.frameDt);
    const smoothed = pts.map(([x, y], i): Point => {
      const current: Point = [x, y];
      const hasCurrent = isPlausiblePoint(current);
      const prior = prev?.[i];
      const hasPrior = prior ? isPlausiblePoint(prior) : false;
      // Implausible (off-frame / missing) keypoint: keep the last good value,
      // otherwise pass through unchanged.
      if (!hasCurrent) return hasPrior && prior ? prior : current;
      if (prior && hasPrior && Math.hypot(x - prior[0], y - prior[1]) < BODY_LANDMARK_DEAD_ZONE) return prior;
      return [flat[i * 2], flat[i * 2 + 1]];
    });
    this.prevHands.set(key, smoothed);
    return smoothed;
  }

  private handTrackKey(id: string): string {
    return `hand-track:${id}`;
  }

  private associateHandRegions(hands: RegionBox[]): AssociatedHandRegion[] {
    const detections = hands.slice(0, HANDS.length);
    const pairs: Array<{ detectionIndex: number; track: HandTrack; cost: number }> = [];
    detections.forEach((hand, detectionIndex) => {
      for (const track of this.handTracks) {
        const cost = handTrackMatchCost(hand, track);
        if (Number.isFinite(cost)) pairs.push({ detectionIndex, track, cost });
      }
    });
    pairs.sort((a, b) => a.cost - b.cost);

    const assignedDetections = new Set<number>();
    const assignedTracks = new Set<string>();
    const associated: Array<AssociatedHandRegion | null> = Array.from({ length: detections.length }, () => null);
    for (const pair of pairs) {
      if (assignedDetections.has(pair.detectionIndex) || assignedTracks.has(pair.track.id)) continue;
      const hand = detections[pair.detectionIndex];
      assignedDetections.add(pair.detectionIndex);
      assignedTracks.add(pair.track.id);
      associated[pair.detectionIndex] = {
        id: pair.track.id,
        box: hand.box,
        score: hand.score,
        previous: pair.track,
      };
    }

    detections.forEach((hand, detectionIndex) => {
      if (associated[detectionIndex]) return;
      const id = `track_${this.nextHandTrackId}`;
      this.nextHandTrackId += 1;
      associated[detectionIndex] = { id, box: hand.box, score: hand.score, previous: null };
    });

    return associated.filter((entry): entry is AssociatedHandRegion => entry !== null);
  }

  private clearDroppedHandTrackState(activeTrackIds: Set<string>): void {
    for (const track of this.handTracks) {
      if (activeTrackIds.has(track.id)) continue;
      const key = this.handTrackKey(track.id);
      this.prevHands.delete(key);
      this.prevBoxes.delete(key);
      // Drop the One-Euro state too so a recycled/new track snaps in cleanly.
      this.landmarkFilters.delete(key);
      this.boxFilters.delete(key);
    }
  }

  reset(): void {
    this.prevHands.clear();
    this.prevBoxes.clear();
    this.landmarkFilters.clear();
    this.boxFilters.clear();
    this.lastFilterTime = 0;
    this.frameDt = 1 / ONE_EURO_DEFAULT_FPS;
    this.handTracks = [];
    this.nextHandTrackId = 1;
  }

  // Stage 2: crop a square around the region detector's hand BOX (which scales
  // with the actual hand, unlike the collapse-prone coarse landmarks) and run
  // the fine single-hand model. box = hand box in full-frame [0,1] xyxy.
  // Returns refined landmarks in full-frame [0,1], or null if stage 2 absent.
  private async refineHand(source: ImageData, box: number[], w: number, h: number): Promise<Point[] | null> {
    if (!this.landmark2 || !this.ort) return null;
    const px1 = box[0] * w, py1 = box[1] * h, px2 = box[2] * w, py2 = box[3] * h;
    const bw = Math.max(2, px2 - px1), bh = Math.max(2, py2 - py1);
    const cropScale = box[3] >= HAND_BOTTOM_EDGE_CROP_THRESHOLD
      ? HAND_BOTTOM_EDGE_CROP_SCALE
      : HAND_DEFAULT_CROP_SCALE;
    let side = Math.max(bw, bh) * cropScale; // tighter for frame-edge hands; context otherwise.
    side = Math.min(side, Math.min(w, h));
    const cx = (px1 + px2) / 2, cy = (py1 + py2) / 2;
    const cx0 = Math.min(Math.max(0, cx - side / 2), w - side);
    const cy0 = Math.min(Math.max(0, cy - side / 2), h - side);
    const tr = performance.now();
    const rgba = cropResizeRgbaArea(source, cx0, cy0, side, side, RTM_PX, RTM_PX);
    // RTMPose input: 3-channel ImageNet-normalized RGB, NCHW
    const data = imageNetTensorData(rgba, RTM_PX, RTM_PX);
    const input = new this.ort.Tensor("float32", data, [1, 3, RTM_PX, RTM_PX]);
    this.acc.resize += performance.now() - tr;
    const ti = performance.now();
    const out = await this.landmark2.run({ input });
    this.acc.infer += performance.now() - ti;
    // SimCC decode: argmax over RTM_BINS per axis -> normalized crop coords
    const td = performance.now();
    const sx = outF32(out, "simcc_x");
    const sy = outF32(out, "simcc_y");
    const pts: Point[] = [];
    for (let k = 0; k < KEYPOINTS; k += 1) {
      // Soft-argmax around the peak bin -> sub-bin precision, less jitter.
      const bx = simccSoftArgmax(sx, k * RTM_BINS, RTM_BINS).index;
      const by = simccSoftArgmax(sy, k * RTM_BINS, RTM_BINS).index;
      const xn = bx / RTM_BINS, yn = by / RTM_BINS;
      pts.push([(cx0 + xn * side) / w, (cy0 + yn * side) / h]);
    }
    this.acc.decode += performance.now() - td;
    return pts;
  }

  private async refineBody(source: ImageData, box: number[], w: number, h: number): Promise<Point[]> {
    if (!this.body || !this.ort) return missingBody();
    const crop = bodyCropFromRegion(box, w, h);
    const tr = performance.now();
    const rgba = cropResizeRgbaArea(source, crop.x, crop.y, crop.width, crop.height, BODY_W, BODY_H);
    const input = new this.ort.Tensor("float32", imageNetTensorData(rgba, BODY_W, BODY_H), [1, 3, BODY_H, BODY_W]);
    this.acc.resize += performance.now() - tr;
    const ti = performance.now();
    const out = await this.body.run({ input });
    this.acc.infer += performance.now() - ti;
    const td = performance.now();
    const sx = outF32(out, "simcc_x");
    const sy = outF32(out, "simcc_y");
    const pts: Point[] = [];
    for (let k = 0; k < BODY_KEYPOINTS; k += 1) {
      // Soft-argmax around the peak bin -> sub-bin precision, less jitter.
      const xPeak = simccSoftArgmax(sx, k * BODY_X_BINS, BODY_X_BINS);
      const yPeak = simccSoftArgmax(sy, k * BODY_Y_BINS, BODY_Y_BINS);
      const confidence = Math.min(xPeak.confidence, yPeak.confidence);
      if (confidence < BODY_SIMCC_MIN_CONFIDENCE) {
        pts.push([-1, -1]);
        continue;
      }
      const xn = xPeak.index / BODY_X_BINS;
      const yn = yPeak.index / BODY_Y_BINS;
      pts.push([
        (crop.x + xn * crop.width) / w,
        (crop.y + yn * crop.height) / h,
      ]);
    }
    this.acc.decode += performance.now() - td;
    return this.blendBody(pts);
  }

  async process(input: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<TrackResult | null> {
    if (!this.ready || !this.ort || !this.full) return null;
    const w = "videoWidth" in input ? input.videoWidth : input.width;
    const h = "videoHeight" in input ? input.videoHeight : input.height;
    if (!w || !h) return null;
    if (this.full.width !== w || this.full.height !== h) {
      this.full.width = w;
      this.full.height = h;
    }
    const ctx = this.full.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    const t0 = performance.now();
    // Per-frame dt (seconds) for the One-Euro smoothing. First frame after a
    // reset falls back to the nominal frame interval; clamp out absurd gaps
    // (tab backgrounded, etc.) so the filter never produces a huge derivative.
    if (this.lastFilterTime > 0) {
      const dt = (t0 - this.lastFilterTime) / 1000;
      this.frameDt = dt > 0 && dt < 1 ? dt : 1 / ONE_EURO_DEFAULT_FPS;
    } else {
      this.frameDt = 1 / ONE_EURO_DEFAULT_FPS;
    }
    this.lastFilterTime = t0;
    this.acc = { cap: 0, resize: 0, infer: 0, decode: 0 };
    ctx.drawImage(input, 0, 0, w, h);
    const source = ctx.getImageData(0, 0, w, h);
    this.acc.cap = performance.now() - t0;

    // Region pass: letterbox the full frame into 96x96 (aspect-preserving) so
    // the detector never sees an aspect-distorted frame. Decoded boxes come back
    // in letterboxed-input [0,1] and are mapped to frame [0,1] via `lb.transform`.
    let tStage = performance.now();
    const lb = letterboxRegion(source, REGION_PX);
    const regionRgba = lb.rgba;
    const regionInput = new this.ort.Tensor("float32", tensorData(regionRgba, REGION_PX), [1, 5, REGION_PX, REGION_PX]);
    this.acc.resize += performance.now() - tStage;
    tStage = performance.now();
    const regionOut = await this.region!.run({ frames_xy: regionInput });
    this.acc.infer += performance.now() - tStage;
    tStage = performance.now();
    const objectness = outF32(regionOut, "objectness");
    const boxes = outF32(regionOut, "boxes");
    const decoded = decodeRegions(objectness, boxes);
    // Map region boxes from letterboxed-input space back to frame [0,1].
    const regions: Record<string, RegionBox> = {};
    for (const target of REGION_TARGETS) {
      const r = decoded.regions[target];
      regions[target] = { box: unletterboxBox(r.box, lb.transform), score: r.score };
    }
    this.acc.decode += performance.now() - tStage;
    // The detector is noticeably more reliable for one anatomical side. A cheap
    // mirrored 96px pass recovers opposite-hand candidates before the expensive
    // RTMPose stage runs.
    tStage = performance.now();
    const mirroredRegionRgba = mirrorRgbaX(regionRgba, REGION_PX, REGION_PX);
    const mirroredInput = new this.ort.Tensor(
      "float32",
      tensorData(mirroredRegionRgba, REGION_PX),
      [1, 5, REGION_PX, REGION_PX],
    );
    this.acc.resize += performance.now() - tStage;
    tStage = performance.now();
    const mirroredRegionOut = await this.region!.run({ frames_xy: mirroredInput });
    this.acc.infer += performance.now() - tStage;
    tStage = performance.now();
    // Hand candidates decode in letterboxed-input [0,1]. The mirrored pass first
    // un-mirrors via flipBoxX (still in letterboxed space, valid because padding
    // is x-symmetric); both lists are then mapped to frame [0,1] before NMS/dedup
    // so all geometry comparisons happen in a single, consistent coordinate space.
    const toFrame = (candidates: RegionBox[]): RegionBox[] =>
      candidates.map((c) => ({ box: unletterboxBox(c.box, lb.transform), score: c.score }));
    const handRegions = pickHandRegions([
      ...toFrame(decodeHandCandidates(objectness, boxes)),
      ...toFrame(decodeHandCandidates(
        outF32(mirroredRegionOut, "objectness"),
        outF32(mirroredRegionOut, "boxes"),
        true,
      )),
    ]);
    this.acc.decode += performance.now() - tStage;

    const cropBox = expandCrop(regions.upper_body_or_signing_space.box);
    const body = await this.refineBody(source, regions.upper_body_or_signing_space.box, w, h);

    // Smooth non-hand region boxes used for display.
    for (const target of REGION_TARGETS) {
      regions[target] = { box: this.blendBox(target, regions[target].box), score: regions[target].score };
    }

    // Keep smoother identity stable across left/right display-order swaps.
    const previousTrackById = new Map(this.handTracks.map((track) => [track.id, track]));
    const associatedHandRegions = this.associateHandRegions(handRegions);
    const matchedTrackIds = new Set<string>();
    const emittedTracks: EmittedHandTrack[] = [];
    for (const region of associatedHandRegions) {
      matchedTrackIds.add(region.id);
      const trackKey = this.handTrackKey(region.id);
      const box = this.blendBox(trackKey, region.box, HAND_BOX_SMOOTHING_RATIO);
      const previous = region.previous ?? previousTrackById.get(region.id) ?? null;
      // stage 2: RTMPose on a tight crop of the region hand box (scales with hand)
      const fine = await this.refineHand(source, box, w, h);
      if (!fine && !previous?.landmarks.length) {
        this.prevHands.delete(trackKey);
        this.prevBoxes.delete(trackKey);
        continue;
      }

      if (fine) {
        const fineCandidate: EmittedHandTrack = {
          id: region.id,
          box,
          landmarks: fine,
          displayBox: handDisplayBox(box, fine),
          score: region.score,
          renderMode: "full",
          missed: 0,
        };
        if (isPlausibleHandTrack(fineCandidate)) {
          const landmarks = this.blendHand(trackKey, fine, true);
          emittedTracks.push({
            id: region.id,
            box,
            landmarks,
            displayBox: handDisplayBox(box, landmarks),
            score: region.score,
            renderMode: "full",
            missed: 0,
          });
          continue;
        }
        if (!landmarksAgreeWithDetectorBox(box, fine)) {
          if (previous) {
            const missed = previous.missed + 1;
            if (missed <= HAND_TRACK_MAX_MISSED_FRAMES) {
              emittedTracks.push({
                ...previous,
                score: previous.score * Math.pow(HAND_COAST_SCORE_DECAY, missed),
                renderMode: "coasted",
                missed,
              });
            }
          }
          continue;
        }
      }

      const fallbackLandmarks = previous?.landmarks ?? fine ?? [];
      const boxOnlyTrack: EmittedHandTrack = {
        id: region.id,
        box,
        landmarks: fallbackLandmarks,
        displayBox: box,
        score: region.score,
        renderMode: "box-only",
        missed: 0,
      };
      if (isUsableBoxOnlyHandTrack(boxOnlyTrack)) emittedTracks.push(boxOnlyTrack);
    }

    for (const track of this.handTracks) {
      if (matchedTrackIds.has(track.id)) continue;
      const missed = track.missed + 1;
      if (missed > HAND_TRACK_MAX_MISSED_FRAMES) continue;
      emittedTracks.push({
        ...track,
        score: track.score * Math.pow(HAND_COAST_SCORE_DECAY, missed),
        renderMode: "coasted",
        missed,
      });
    }

    const visibleTracks = suppressDuplicateHandTracks(emittedTracks.filter((track) =>
      track.renderMode === "full" ? isPlausibleHandTrack(track) : isUsableBoxOnlyHandTrack(track)
    ));
    const activeTrackIds = new Set(visibleTracks.map((track) => track.id));
    this.clearDroppedHandTrackState(activeTrackIds);
    visibleTracks.sort((a, b) => {
      const ac = (a.displayBox[0] + a.displayBox[2]) / 2;
      const bc = (b.displayBox[0] + b.displayBox[2]) / 2;
      return ac - bc;
    });
    this.handTracks = visibleTracks.slice(0, HANDS.length).map((track) => ({
      id: track.id,
      box: track.box,
      displayBox: track.displayBox,
      landmarks: track.landmarks,
      score: track.renderMode === "coasted"
        ? (previousTrackById.get(track.id)?.score ?? track.score)
        : track.score,
      missed: track.missed,
    }));

    const hands: HandResult[] = [];
    for (let i = 0; i < visibleTracks.length && i < HANDS.length; i += 1) {
      const track = visibleTracks[i];
      const name = HANDS[i];
      regions[name] = { box: track.displayBox, score: track.score };
      hands.push({
        name,
        landmarks: track.landmarks,
        probability: track.score,
        present: true,
        renderMode: track.renderMode,
        staleFrames: track.missed,
      });
    }

    const total = performance.now() - t0;
    const a = 0.25;
    this.profile.cap += a * (this.acc.cap - this.profile.cap);
    this.profile.resize += a * (this.acc.resize - this.profile.resize);
    this.profile.infer += a * (this.acc.infer - this.profile.infer);
    this.profile.decode += a * (this.acc.decode - this.profile.decode);
    this.profile.total += a * (total - this.profile.total);
    this.profile.fps = this.profile.total > 0 ? 1000 / this.profile.total : 0;
    this.lastFrame = { cap: this.acc.cap, resize: this.acc.resize, infer: this.acc.infer, decode: this.acc.decode, total };
    return { regions, cropBox: this.blendBox("__crop__", cropBox), body, hands };
  }

  dispose(): void {
    void this.region?.release?.();
    void this.landmark2?.release?.();
    void this.body?.release?.();
    this.region = null;
    this.landmark2 = null;
    this.body = null;
    this.reset();
  }
}

// Draw region boxes + hand skeletons. Coordinates are full-frame normalized
// [0,1]; the canvas is sized to the video's intrinsic resolution and shares the
// video's CSS (object-fit:cover + scaleX(-1)) so the overlay aligns exactly.
export function drawTracking(
  ctx: CanvasRenderingContext2D,
  result: TrackResult,
  w: number,
  h: number,
): void {
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.lineWidth = Math.max(2, Math.round(w / 360));

  if (result.body.length >= BODY_KEYPOINTS) {
    const bodyPts = result.body.map(([x, y]): Point => [x * w, y * h]);
    ctx.strokeStyle = "#8fd3ff";
    ctx.fillStyle = "#8fd3ff";
    ctx.globalAlpha = 0.72;
    ctx.lineWidth = Math.max(1, Math.round(w / 720));
    for (const [a, b] of BODY_EDGES) {
      if (!isDrawableBodyPoint(result.body[a]) || !isDrawableBodyPoint(result.body[b])) continue;
      ctx.beginPath();
      ctx.moveTo(bodyPts[a][0], bodyPts[a][1]);
      ctx.lineTo(bodyPts[b][0], bodyPts[b][1]);
      ctx.stroke();
    }
    const bodyR = Math.max(2, w / 320);
    for (let i = 0; i < BODY_KEYPOINTS; i += 1) {
      if (!isDrawableBodyPoint(result.body[i])) continue;
      ctx.beginPath();
      ctx.arc(bodyPts[i][0], bodyPts[i][1], bodyR, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.lineWidth = Math.max(2, Math.round(w / 360));
  }

  const regionColors: Record<string, string> = {
    head_or_face: "#66d9ef",
    upper_body_or_signing_space: "#f4c542",
  };
  for (const target of ["head_or_face", "upper_body_or_signing_space"] as const) {
    const r = result.regions[target];
    if (!r) continue;
    const [x1, y1, x2, y2] = r.box;
    ctx.strokeStyle = regionColors[target];
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(x1 * w, y1 * h, (x2 - x1) * w, (y2 - y1) * h);
  }
  ctx.globalAlpha = 1;

  const handColors = ["#ff5c7a", "#4f8cff"];
  result.hands.forEach((hand, hi) => {
    if (!hand.present) return;
    // Draw the refined hand display box, not the looser detector crop.
    const region = result.regions[hand.name];
    if (region) {
      const [bx1, by1, bx2, by2] = region.box;
      ctx.strokeStyle = handColors[hi];
      ctx.globalAlpha = hand.renderMode === "coasted" ? 0.35 : hand.renderMode === "box-only" ? 0.62 : 0.85;
      ctx.lineWidth = Math.max(2, Math.round(w / 320));
      if (hand.renderMode !== "full") ctx.setLineDash([Math.max(6, w / 90), Math.max(4, w / 140)]);
      ctx.strokeRect(bx1 * w, by1 * h, (bx2 - bx1) * w, (by2 - by1) * h);
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
    if (hand.renderMode !== "full") return;
    const pts = hand.landmarks.map(([x, y]): Point => [x * w, y * h]);
    ctx.strokeStyle = handColors[hi];
    ctx.fillStyle = "#ffffff";
    for (const [a, b] of HAND_EDGES) {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }
    const r = Math.max(2.5, w / 220);
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
  ctx.restore();
}
