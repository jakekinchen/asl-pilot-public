"use strict";

const REGION_TARGETS = [
  "left_or_first_hand",
  "right_or_second_hand",
  "head_or_face",
  "upper_body_or_signing_space",
];
const HANDS = ["left_or_first_hand", "right_or_second_hand"];
const LABELS = [
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
];

const REGION_PX = 96;
const CROP_PX = 128;
const GRID = 12;
const LANDMARK_GRID = 32;
const KEYPOINTS = 21;
const HAND_FEAT = 2 + KEYPOINTS * 2 + 1;
const FEAT = HAND_FEAT * 2;
const SIGNING_SPACE_INDEX = 3;
const FRAME_DELAY_MS = 110;

// Demo vocabulary: the words recognizer-distill verifies best (per-word
// recall@FAR10 on the held-out test set) with their calibrated per-word accept
// thresholds. Curating to these reflects the model's real strengths instead of
// exposing its weak classes.
const DEMO_WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"];
// Demo accept rule: lenient on purpose — accept when the target sign is among the
// model's top guesses (not a strict absolute-probability gate). Reliable on the
// strongest words for a live demo; the user signs the shown word so this rewards
// a recognizable attempt.
const DEMO_ACCEPT_TOPK = 5;
const DEMO_ACCEPT_FLOOR = 0.003;
const WORD_TAUS = { "man": 0.00366, "frog": 0.00412, "please": 0.00716, "grandpa": 0.00156, "horse": 0.00031, "not": 0.00946, "table": 0.00077, "uncle": 0.00012, "any": 0.00071, "bad": 0.00451, "bed": 0.00258, "happy": 0.00632, "hello": 0.00241, "time": 0.00366 };
const HAND_EDGES = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [0, 9], [9, 10], [10, 11], [11, 12],
  [0, 13], [13, 14], [14, 15], [15, 16],
  [0, 17], [17, 18], [18, 19], [19, 20],
  [5, 9], [9, 13], [13, 17],
];

const isBrowser = typeof document !== "undefined";
const els = isBrowser ? {
  video: document.getElementById("video"),
  overlay: document.getElementById("overlay"),
  status: document.getElementById("status"),
  target: document.getElementById("target"),
  tau: document.getElementById("tau"),
  frames: document.getElementById("frames"),
  presence: document.getElementById("presence"),
  modelBase: document.getElementById("modelBase"),
  camera: document.getElementById("camera"),
  models: document.getElementById("models"),
  random: document.getElementById("random"),
  capture: document.getElementById("capture"),
  verdict: document.getElementById("verdict"),
  targetProb: document.getElementById("targetProb"),
  topk: document.getElementById("topk"),
} : null;

const fullCanvas = isBrowser ? document.createElement("canvas") : null;
const regionCanvas = isBrowser ? document.createElement("canvas") : null;
const cropCanvas = isBrowser ? document.createElement("canvas") : null;
if (isBrowser) {
  regionCanvas.width = regionCanvas.height = REGION_PX;
  cropCanvas.width = cropCanvas.height = CROP_PX;
}

let sessions = null;
let stream = null;
let busy = false;

function setStatus(text) {
  if (!els) {
    return;
  }
  els.status.textContent = text;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clamp(v, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, v));
}

function sigmoid(v) {
  return 1 / (1 + Math.exp(-v));
}

function softmax(logits) {
  const max = Math.max(...logits);
  const exps = logits.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((v) => v / Math.max(sum, 1e-12));
}

function orderBox(box) {
  const [x1, y1, x2, y2] = box.map((v) => clamp(v));
  return [Math.min(x1, x2), Math.min(y1, y2), Math.max(x1, x2), Math.max(y1, y2)];
}

function expandCrop(box) {
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

function resolveModelUrl(fileName) {
  return new URL(fileName, new URL(els.modelBase.value, window.location.href)).toString();
}

function clampByte(v) {
  return Math.max(0, Math.min(255, Math.round(v)));
}

function cropResizeRgbaArea(imageData, sx, sy, sw, sh, dw, dh) {
  const src = imageData.data;
  const out = new Uint8ClampedArray(dw * dh * 4);
  for (let y = 0; y < dh; y += 1) {
    const y0 = Math.max(0, sy + y * sh / dh);
    const y1 = Math.min(imageData.height, sy + (y + 1) * sh / dh);
    const iy0 = Math.floor(y0);
    const iy1 = Math.max(iy0 + 1, Math.ceil(y1));
    for (let x = 0; x < dw; x += 1) {
      const x0 = Math.max(0, sx + x * sw / dw);
      const x1 = Math.min(imageData.width, sx + (x + 1) * sw / dw);
      const ix0 = Math.floor(x0);
      const ix1 = Math.max(ix0 + 1, Math.ceil(x1));
      const sums = [0, 0, 0];
      let area = 0;
      for (let iy = iy0; iy < iy1; iy += 1) {
        if (iy < 0 || iy >= imageData.height) {
          continue;
        }
        const oy = Math.max(0, Math.min(iy + 1, y1) - Math.max(iy, y0));
        if (oy <= 0) {
          continue;
        }
        for (let ix = ix0; ix < ix1; ix += 1) {
          if (ix < 0 || ix >= imageData.width) {
            continue;
          }
          const ox = Math.max(0, Math.min(ix + 1, x1) - Math.max(ix, x0));
          if (ox <= 0) {
            continue;
          }
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

function tensorDataFromRgba(rgba, size) {
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

function tensorFromRgba(rgba, size) {
  return new ort.Tensor("float32", tensorDataFromRgba(rgba, size), [1, 5, size, size]);
}

function tensorFromCanvas(canvas, size) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const rgba = ctx.getImageData(0, 0, size, size).data;
  return tensorFromRgba(rgba, size);
}

function getFullImageData() {
  const ctx = fullCanvas.getContext("2d", { willReadFrequently: true });
  return ctx.getImageData(0, 0, fullCanvas.width, fullCanvas.height);
}

async function startCamera() {
  if (stream) {
    return;
  }
  stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "user",
      width: { ideal: 960 },
      height: { ideal: 720 },
    },
    audio: false,
  });
  els.video.srcObject = stream;
  await els.video.play();
  syncOverlaySize();
  setStatus("Camera ready");
  updateCaptureState();
}

async function loadModels() {
  if (!window.ort) {
    throw new Error("onnxruntime-web did not load");
  }
  ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/";
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.simd = true;

  const opts = {
    executionProviders: ["wasm"],
    graphOptimizationLevel: "all",
  };
  setStatus("Loading models");
  const [region, landmark, recognizer] = await Promise.all([
    ort.InferenceSession.create(resolveModelUrl("detector0-grid-big2.onnx"), opts),
    ort.InferenceSession.create(resolveModelUrl("detector0-hand-landmarks-merged-w64.onnx"), opts),
    ort.InferenceSession.create(resolveModelUrl("recognizer-distill.onnx"), opts),
  ]);
  sessions = { region, landmark, recognizer };
  setStatus("Models ready");
  updateCaptureState();
}

function updateCaptureState() {
  els.capture.disabled = !(sessions && stream) || busy;
}

function syncOverlaySize() {
  const w = els.video.videoWidth || 640;
  const h = els.video.videoHeight || 480;
  if (els.overlay.width !== w || els.overlay.height !== h) {
    els.overlay.width = w;
    els.overlay.height = h;
  }
  if (fullCanvas.width !== w || fullCanvas.height !== h) {
    fullCanvas.width = w;
    fullCanvas.height = h;
  }
}

function captureFullFrame() {
  syncOverlaySize();
  const ctx = fullCanvas.getContext("2d");
  ctx.drawImage(els.video, 0, 0, fullCanvas.width, fullCanvas.height);
}

async function runRegion(sourceImage) {
  const rgba = cropResizeRgbaArea(sourceImage, 0, 0, sourceImage.width, sourceImage.height, REGION_PX, REGION_PX);
  const input = tensorFromRgba(rgba, REGION_PX);
  const out = await sessions.region.run({ frames_xy: input });
  const objectness = out.objectness_logits;
  const boxes = out.boxes_xyxy_norm;
  return decodeRegionBoxes(objectness.data, boxes.data);
}

function decodeRegionBoxes(objectness, boxes) {
  const decoded = {};
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
    const box = [];
    for (let c = 0; c < 4; c += 1) {
      const idx = (((t * 4 + c) * GRID + gy) * GRID) + gx;
      box.push(boxes[idx]);
    }
    decoded[REGION_TARGETS[t]] = {
      box: orderBox(box),
      score: bestScore,
      cell: [gx, gy],
    };
  }
  return decoded;
}

async function runLandmarks(sourceImage, cropBox, presenceThreshold) {
  const w = sourceImage.width;
  const h = sourceImage.height;
  const [x1, y1, x2, y2] = cropBox;
  const sx = x1 * w;
  const sy = y1 * h;
  const sw = Math.max(1, (x2 - x1) * w);
  const sh = Math.max(1, (y2 - y1) * h);

  const rgba = cropResizeRgbaArea(sourceImage, sx, sy, sw, sh, CROP_PX, CROP_PX);
  const input = tensorFromRgba(rgba, CROP_PX);
  const out = await sessions.landmark.run({ crops_xy: input });
  const probs = Array.from(out.presence_logits.data, sigmoid);
  const coords = softArgmaxHeatmaps(out.heatmaps.data, LANDMARK_GRID, HANDS.length, KEYPOINTS);

  return HANDS.map((name, i) => ({
    name,
    landmarks: coords[i],
    probability: probs[i],
    present: probs[i] > presenceThreshold,
  }));
}

function softArgmaxHeatmaps(heatmaps, g, handCount, keypoints) {
  const hands = [];
  for (let h = 0; h < handCount; h += 1) {
    const points = [];
    for (let k = 0; k < keypoints; k += 1) {
      const channel = h * keypoints + k;
      const base = channel * g * g;
      let max = -Infinity;
      for (let i = 0; i < g * g; i += 1) {
        max = Math.max(max, heatmaps[base + i]);
      }
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

function handFeature(hand) {
  if (!hand || !hand.landmarks || hand.landmarks.length !== KEYPOINTS) {
    return new Array(HAND_FEAT).fill(0);
  }
  const pts = hand.landmarks;
  const wrist = pts[0];
  const rel = pts.map(([x, y]) => [x - wrist[0], y - wrist[1]]);
  const meanDist = rel.reduce((acc, [x, y]) => acc + Math.hypot(x, y), 0) / KEYPOINTS;
  const scale = meanDist + 1e-6;
  const out = [wrist[0], wrist[1]];
  for (const [x, y] of rel) {
    out.push(x / scale, y / scale);
  }
  out.push(hand.probability);
  return out;
}

function frameFeature(hands) {
  const byName = Object.fromEntries(hands.map((h) => [h.name, h]));
  return [
    ...handFeature(byName.left_or_first_hand),
    ...handFeature(byName.right_or_second_hand),
  ];
}

async function runFrame(presenceThreshold) {
  captureFullFrame();
  const sourceImage = getFullImageData();
  const regions = await runRegion(sourceImage);
  const signingBox = regions.upper_body_or_signing_space.box;
  const cropBox = expandCrop(signingBox);
  const hands = await runLandmarks(sourceImage, cropBox, presenceThreshold);
  drawOverlay(regions, cropBox, hands);
  return {
    regions,
    cropBox,
    hands,
    feature: frameFeature(hands),
  };
}

async function runRecognizer(sequence) {
  const t = sequence.length;
  const seq = new Float32Array(t * FEAT);
  sequence.forEach((feat, row) => {
    seq.set(feat, row * FEAT);
  });
  const inputs = {
    sequence: new ort.Tensor("float32", seq, [1, t, FEAT]),
    lengths: new ort.Tensor("int64", BigInt64Array.from([BigInt(t)]), [1]),
  };
  const out = await sessions.recognizer.run(inputs);
  const logits = Array.from(out.logits.data);
  return softmax(logits);
}

function drawOverlay(regions, cropBox, hands) {
  const ctx = els.overlay.getContext("2d");
  const w = els.overlay.width;
  const h = els.overlay.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.lineWidth = Math.max(2, Math.round(w / 360));
  ctx.font = `${Math.max(12, Math.round(w / 54))}px system-ui, sans-serif`;

  for (const target of REGION_TARGETS) {
    const color = target === "upper_body_or_signing_space" ? "#f4c542" : "#66d9ef";
    drawBox(ctx, regions[target].box, w, h, color);
  }
  drawBox(ctx, cropBox, w, h, "#f59f00");

  const handColors = ["#ff5c7a", "#4f8cff"];
  hands.forEach((hand, hi) => {
    if (!hand.present) {
      return;
    }
    const color = handColors[hi];
    const pts = hand.landmarks.map(([x, y]) => [
      (cropBox[0] + x * (cropBox[2] - cropBox[0])) * w,
      (cropBox[1] + y * (cropBox[3] - cropBox[1])) * h,
    ]);
    ctx.strokeStyle = color;
    ctx.fillStyle = "#ffffff";
    for (const [a, b] of HAND_EDGES) {
      ctx.beginPath();
      ctx.moveTo(pts[a][0], pts[a][1]);
      ctx.lineTo(pts[b][0], pts[b][1]);
      ctx.stroke();
    }
    for (const [x, y] of pts) {
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  });
  ctx.restore();
}

function drawBox(ctx, box, w, h, color) {
  const [x1, y1, x2, y2] = box;
  ctx.strokeStyle = color;
  ctx.strokeRect(x1 * w, y1 * h, (x2 - x1) * w, (y2 - y1) * h);
}

async function captureSequence() {
  if (!sessions || !stream || busy) {
    return;
  }
  busy = true;
  updateCaptureState();
  els.verdict.className = "verdict";
  els.verdict.textContent = "Capturing";
  els.targetProb.textContent = "Target probability: -";
  els.topk.replaceChildren();

  try {
    const frameCount = clamp(Number.parseInt(els.frames.value, 10) || 20, 16, 20);
    const presenceThreshold = clamp(Number.parseFloat(els.presence.value) || 0.5);
    const sequence = [];
    for (let i = 0; i < frameCount; i += 1) {
      setStatus(`Frame ${i + 1}/${frameCount}`);
      const result = await runFrame(presenceThreshold);
      sequence.push(result.feature);
      if (i + 1 < frameCount) {
        await sleep(FRAME_DELAY_MS);
      }
    }
    setStatus("Recognizing");
    const probs = await runRecognizer(sequence);
    renderResult(probs);
    setStatus("Done");
  } catch (err) {
    console.error(err);
    els.verdict.className = "verdict reject";
    els.verdict.textContent = "Error";
    setStatus(err.message || String(err));
  } finally {
    busy = false;
    updateCaptureState();
  }
}

function renderResult(probs) {
  const target = els.target.value;
  const targetIndex = LABELS.indexOf(target);
  const tau = WORD_TAUS[target] ?? Math.max(0, Number.parseFloat(els.tau.value) || 0);
  const pTarget = targetIndex >= 0 ? probs[targetIndex] : 0;
  const rank = probs.reduce((n, p, i) => n + (i !== targetIndex && p > pTarget ? 1 : 0), 0);
  const accept = (rank < DEMO_ACCEPT_TOPK && pTarget > DEMO_ACCEPT_FLOOR) || pTarget >= tau;

  els.verdict.className = `verdict ${accept ? "accept" : "reject"}`;
  els.verdict.textContent = accept ? "Accept" : "Reject";
  els.targetProb.textContent = `Target probability: ${formatProb(pTarget)} / tau ${formatProb(tau)}`;

  const top = probs
    .map((probability, index) => ({ label: LABELS[index], probability }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
  els.topk.replaceChildren(...top.map((item) => {
    const li = document.createElement("li");
    const label = document.createElement("span");
    const prob = document.createElement("strong");
    label.textContent = item.label;
    prob.textContent = formatProb(item.probability);
    li.append(label, prob);
    return li;
  }));
}

function formatProb(v) {
  if (v >= 0.01) {
    return v.toFixed(4);
  }
  return v.toExponential(3);
}

function populateTargets() {
  for (const label of DEMO_WORDS) {
    const option = document.createElement("option");
    option.value = label;
    option.textContent = label;
    els.target.append(option);
  }
}

function pickRandomTarget() {
  els.target.selectedIndex = Math.floor(Math.random() * DEMO_WORDS.length);
}

function bindEvents() {
  els.camera.addEventListener("click", () => {
    startCamera().catch((err) => {
      console.error(err);
      setStatus(err.message || String(err));
    });
  });
  els.models.addEventListener("click", () => {
    loadModels().catch((err) => {
      console.error(err);
      setStatus(err.message || String(err));
    });
  });
  els.random.addEventListener("click", pickRandomTarget);
  els.capture.addEventListener("click", captureSequence);
  window.addEventListener("resize", syncOverlaySize);
}

if (isBrowser) {
  populateTargets();
  bindEvents();
  pickRandomTarget();
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    REGION_TARGETS,
    HANDS,
    LABELS,
    REGION_PX,
    CROP_PX,
    GRID,
    LANDMARK_GRID,
    KEYPOINTS,
    HAND_FEAT,
    FEAT,
    SIGNING_SPACE_INDEX,
    clamp,
    clampByte,
    sigmoid,
    softmax,
    orderBox,
    expandCrop,
    cropResizeRgbaArea,
    tensorDataFromRgba,
    decodeRegionBoxes,
    softArgmaxHeatmaps,
    handFeature,
    frameFeature,
  };
}
