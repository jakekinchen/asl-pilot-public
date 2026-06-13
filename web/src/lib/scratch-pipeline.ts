// Shared scratch recognition pipeline — region detector + HeatmapNet hand
// landmarks (crop space) -> 90-dim per-frame feature -> recognizer. This is the
// pipeline the recognizer was TRAINED on; ported verbatim from
// web/public/pilot/pipeline.js (validated JS<->Python parity). Both /analyze and
// /practice use it so the landmark "dialect" matches training. Do NOT feed the
// recognizer RTMPose HandPoseTracker landmarks — that is a different model the
// recognizer never saw.

export const REGION_TARGETS = [
  "left_or_first_hand",
  "right_or_second_hand",
  "head_or_face",
  "upper_body_or_signing_space",
] as const;
export const HANDS = ["left_or_first_hand", "right_or_second_hand"] as const;

export const LABELS = [
  "TV", "after", "airplane", "all", "animal", "another", "any", "apple",
  "aunt", "bad", "bed", "before", "bird", "black", "blue", "book", "boy",
  "brother", "brown", "bye", "callonphone", "can", "car", "carrot", "cat",
  "cereal", "chair", "child", "dad", "dog", "drink", "every", "find",
  "fine", "fish", "food", "frog", "girl", "give", "go", "grandma",
  "grandpa", "green", "happy", "hat", "have", "hello", "home", "horse",
  "hot", "hungry", "later", "like", "listen", "look", "mad", "make",
  "man", "milk", "mom", "morning", "night", "no", "not", "now", "open",
  "orange", "pen", "pencil", "person", "please", "read", "red", "room",
  "sad", "say", "see", "shoe", "sick", "table", "talk", "thankyou",
  "think", "thirsty", "time", "tomorrow", "uncle", "water", "where",
  "white", "who", "why", "yellow", "yes", "yesterday",
] as const;

export const REGION_PX = 96;
export const CROP_PX = 128;
export const GRID = 12;
export const LANDMARK_GRID = 32;
export const KEYPOINTS = 21;
export const HAND_FEAT = 2 + KEYPOINTS * 2 + 1; // 45
export const FEAT = HAND_FEAT * 2; // 90

export const HAND_EDGES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12], [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20], [5, 9], [9, 13], [13, 17],
];

export const REGION_URL = "/pilot/detector0-grid-big2.onnx";
export const LANDMARK_URL = "/pilot/detector0-hand-landmarks-merged-w64.onnx";

export type OrtModule = typeof import("onnxruntime-web/webgpu");
export type OrtSession = Awaited<ReturnType<OrtModule["InferenceSession"]["create"]>>;
export type ScratchSessions = { region: OrtSession; landmark: OrtSession };
export type Hand = { name: string; landmarks: number[][]; probability: number };

export function clamp(v: number, lo = 0, hi = 1): number {
  return Math.max(lo, Math.min(hi, v));
}
export function sigmoid(v: number): number {
  return 1 / (1 + Math.exp(-v));
}
export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / Math.max(sum, 1e-12));
}
export function orderBox(box: number[]): number[] {
  const [x1, y1, x2, y2] = box.map((v) => clamp(v));
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}
export function expandCrop(box: number[]): number[] {
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
function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

// Area (INTER_AREA-equivalent) crop+resize — parity-critical vs cv2 training.
export function cropResizeRgbaArea(
  imageData: ImageData, sx: number, sy: number, sw: number, sh: number, dw: number, dh: number,
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

export function tensorDataFromRgba(rgba: Uint8ClampedArray, size: number): Float32Array {
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

function decodeRegionBoxes(
  objectness: ArrayLike<number>, boxes: ArrayLike<number>,
): Record<string, { box: number[]; score: number }> {
  const decoded: Record<string, { box: number[]; score: number }> = {};
  for (let t = 0; t < REGION_TARGETS.length; t += 1) {
    let best = 0;
    let bestScore = -Infinity;
    const objBase = t * GRID * GRID;
    for (let i = 0; i < GRID * GRID; i += 1) {
      const score = objectness[objBase + i];
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    const gy = Math.floor(best / GRID);
    const gx = best % GRID;
    const box: number[] = [];
    for (let c = 0; c < 4; c += 1) {
      const idx = ((t * 4 + c) * GRID + gy) * GRID + gx;
      box.push(boxes[idx]);
    }
    decoded[REGION_TARGETS[t]] = { box: orderBox(box), score: bestScore };
  }
  return decoded;
}

function softArgmaxHeatmaps(
  heatmaps: ArrayLike<number>, g: number, handCount: number, keypoints: number,
): number[][][] {
  const hands: number[][][] = [];
  for (let h = 0; h < handCount; h += 1) {
    const points: number[][] = [];
    for (let k = 0; k < keypoints; k += 1) {
      const channel = h * keypoints + k;
      const base = channel * g * g;
      let max = -Infinity;
      for (let i = 0; i < g * g; i += 1) max = Math.max(max, heatmaps[base + i]);
      let z = 0;
      let ex = 0;
      let ey = 0;
      for (let y = 0; y < g; y += 1) {
        for (let x = 0; x < g; x += 1) {
          const p = Math.exp(heatmaps[base + y * g + x] - max);
          z += p;
          ex += p * x;
          ey += p * y;
        }
      }
      points.push([ex / Math.max(z, 1e-12) / g, ey / Math.max(z, 1e-12) / g]);
    }
    hands.push(points);
  }
  return hands;
}

export function handFeature(hand: Hand | undefined): number[] {
  if (!hand || !hand.landmarks || hand.landmarks.length !== KEYPOINTS) {
    return new Array(HAND_FEAT).fill(0);
  }
  const pts = hand.landmarks;
  const wrist = pts[0];
  const rel = pts.map(([x, y]) => [x - wrist[0], y - wrist[1]]);
  const meanDist = rel.reduce((acc, [x, y]) => acc + Math.hypot(x, y), 0) / KEYPOINTS;
  const scale = meanDist + 1e-6;
  const out = [wrist[0], wrist[1]];
  for (const [x, y] of rel) out.push(x / scale, y / scale);
  out.push(hand.probability);
  return out;
}

export function frameFeature(hands: Hand[]): number[] {
  const byName = Object.fromEntries(hands.map((h) => [h.name, h]));
  return [...handFeature(byName.left_or_first_hand), ...handFeature(byName.right_or_second_hand)];
}

export async function loadScratchSessions(ort: OrtModule): Promise<ScratchSessions> {
  const opts = { executionProviders: ["wasm"], graphOptimizationLevel: "all" as const };
  const [region, landmark] = await Promise.all([
    ort.InferenceSession.create(REGION_URL, opts),
    ort.InferenceSession.create(LANDMARK_URL, opts),
  ]);
  return { region, landmark };
}

// region -> signing crop -> scratch landmarks (crop space) for one RGBA frame.
export async function runScratchFrame(
  ort: OrtModule, sessions: ScratchSessions, sourceImage: ImageData,
): Promise<{ hands: Hand[]; cropBox: number[] }> {
  const regionRgba = cropResizeRgbaArea(
    sourceImage, 0, 0, sourceImage.width, sourceImage.height, REGION_PX, REGION_PX,
  );
  const regionOut = await sessions.region.run({
    frames_xy: new ort.Tensor("float32", tensorDataFromRgba(regionRgba, REGION_PX), [1, 5, REGION_PX, REGION_PX]),
  });
  const regions = decodeRegionBoxes(
    regionOut.objectness_logits.data as Float32Array,
    regionOut.boxes_xyxy_norm.data as Float32Array,
  );
  const cropBox = expandCrop(regions.upper_body_or_signing_space.box);
  const w = sourceImage.width;
  const h = sourceImage.height;
  const [x1, y1, x2, y2] = cropBox;
  const cropRgba = cropResizeRgbaArea(
    sourceImage, x1 * w, y1 * h, Math.max(1, (x2 - x1) * w), Math.max(1, (y2 - y1) * h), CROP_PX, CROP_PX,
  );
  const lmOut = await sessions.landmark.run({
    crops_xy: new ort.Tensor("float32", tensorDataFromRgba(cropRgba, CROP_PX), [1, 5, CROP_PX, CROP_PX]),
  });
  const probs = Array.from(lmOut.presence_logits.data as Float32Array, sigmoid);
  const coords = softArgmaxHeatmaps(lmOut.heatmaps.data as Float32Array, LANDMARK_GRID, HANDS.length, KEYPOINTS);
  const hands: Hand[] = HANDS.map((name, i) => ({ name, landmarks: coords[i], probability: probs[i] }));
  return { hands, cropBox };
}

// Draw the scratch crop box + both hand skeletons onto an overlay canvas.
// Landmarks are crop-space -> mapped back to full frame via cropBox.
// `minProbability` gates which hands draw: 0.4 suits the heatmap/RTMPose
// presence scales; the SimCC-w48 path passes ~0 (its decode-score presence is
// ~0.01 for detected hands, and exactly 0.0 for absent ones).
export function drawScratchOverlay(
  ctx: CanvasRenderingContext2D, W: number, H: number, hands: Hand[], cropBox: number[],
  minProbability = 0.4,
): void {
  ctx.clearRect(0, 0, W, H);
  const [cx1, cy1, cx2, cy2] = cropBox;
  ctx.strokeStyle = "rgba(234,180,77,0.5)";
  ctx.lineWidth = 2;
  ctx.strokeRect(cx1 * W, cy1 * H, (cx2 - cx1) * W, (cy2 - cy1) * H);
  const palette = ["#56d39a", "#f6c869"];
  hands.forEach((hand, hi) => {
    if (hand.probability < minProbability) return;
    const pts = hand.landmarks.map(([x, y]) => [(cx1 + x * (cx2 - cx1)) * W, (cy1 + y * (cy2 - cy1)) * H]);
    ctx.strokeStyle = palette[hi % 2];
    ctx.lineWidth = 2;
    for (const [a, b] of HAND_EDGES) {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }
    ctx.fillStyle = palette[hi % 2];
    for (const [px, py] of pts) {
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}
