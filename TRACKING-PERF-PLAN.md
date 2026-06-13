# Tracking Performance Plan — autonomous, ship by morning

**Goal:** the in-browser ASL hand tracker is **accurate AND smooth** on a normal laptop, deployed to Vercel, by morning. Accuracy is already achieved (RTMPose-Hand, reproducible-from-public-data, no MediaPipe at runtime). This plan is about **performance** + locking in quality.

**Owner:** autonomous Claude `/loop` session, using a Codex `gpt-5.5 xhigh` subagent for parallel implementation. No human in the loop. Infinite compute approved.

---

## Current state (measured 2026-05-31)

Headless benchmark (`web/scripts/bench-pipeline.mjs`, onnxruntime-node CPU EP, on the user's 275-frame test video `web/test-assets/bench-input.mov`):

```
TOTAL 105.5 ms/frame (~9.5 fps, node CPU EP)   <-- baseline
  resize(JS)  8.5 ms   (8%)
  infer(ORT) 96.9 ms  (92%)   <-- THE BOTTLENECK
  decode      0.0 ms
  hands/frame 1.95
```

Browser (WebGPU) is faster than node-CPU in absolute terms, but the **stage proportions hold**: inference dominates. The user reports "a bit laggy" even on a fast GPU → confirmed inference-bound. (Live WebGPU profiler is on `/tracking`; consistent harness is `/benchmark` and the node script.)

### Why node-CPU is a valid harness despite not being the browser
We optimize on **relative deltas**: any change that cuts node-CPU inference time cuts browser inference time proportionally (same ops, same model). The node harness is deterministic (fixed frames) so deltas are trustworthy. The **absolute** browser number is validated separately by `bench-browser.mjs` (Playwright, wasm EP — a conservative floor) and, where possible, the live `/tracking` WebGPU profiler.

---

## Minimum metrics to hit (ship gate)

A change ships only if ALL hold (measured by `bench-pipeline.mjs --passes 5` on the full test video):

| Metric | Floor (must) | Target (aim) |
|---|---|---|
| **Pipeline latency** (node CPU EP, total avg) | ≤ 55 ms/frame | ≤ 35 ms/frame |
| **Implied throughput** (node CPU EP) | ≥ 18 fps | ≥ 28 fps |
| **Browser wasm floor** (`bench-browser.mjs`, total avg) | ≤ 90 ms/frame | ≤ 60 ms/frame |
| **Accuracy regression** (mean keypoint shift vs RTMPose-fp32 baseline on test frames) | ≤ 0.02 (norm units, ~2% crop) | ≤ 0.01 |
| **Hand coverage** (frames with ≥1 hand tracked vs baseline) | ≥ 98% of baseline | 100% |
| **Build/lint/typecheck** | all green | all green |
| **Deploy** | `/tracking` HTTP 200, models served | + visual skeleton sanity render passes |

**Rationale for floors:** node-CPU ~55ms ⇒ the browser WebGPU path (empirically 2–4× faster than node-CPU for these models) comfortably exceeds 30fps. The wasm floor guarantees usability even on no-WebGPU browsers.

**Accuracy guard is non-negotiable:** speed must not regress the finger accuracy the user just approved. Every perf change re-runs the accuracy render (`scripts/accuracy-check.mjs`, to be created) comparing keypoints to the fp32 RTMPose baseline.

---

## Optimization backlog (ordered by expected ROI, all measured before/after)

Each item: implement → `bench-pipeline.mjs` delta → `accuracy-check.mjs` delta → keep only if it improves latency without breaching the accuracy floor → commit.

### Tier 1 — inference count (biggest wins; inference is 92%)
1. **Drop the coarse landmark model.** RTMPose now does localization+refinement from the region hand box; the coarse `detector0-hand-landmarks-merged-w64` model is redundant for *tracking* (still used for presence — replace presence with region-box score threshold or a cheap presence check). **Expected: −1 inference/frame (~−25-30ms).** Contingency: if region-box presence is unreliable (drops hands), keep coarse model BUT downsize its input or run it every Nth frame.
2. **One hand per frame (temporal interleave).** Alternate left/right hand each frame; the other hand uses its previous (EMA-smoothed) landmarks. At 30fps each hand still updates 15×/s. **Expected: halve RTMPose calls (~−45ms when 2 hands).** Contingency: if interleaving looks jumpy, run both hands but at a lower cadence (e.g., RTMPose every other frame, coarse fills between).
3. **Region detector every Nth frame.** The region boxes move slowly; run region detection every 2–3 frames, reuse boxes between. **Expected: −region inference on most frames.**

### Tier 2 — model/runtime (medium)
4. **RTMPose-t (tiny) variant.** Download `rtmpose-t` hand ONNX (same Hand5 recipe, ~half the FLOPs). Benchmark accuracy delta — keep if within accuracy floor. **Expected: ~−40% RTMPose time.** Contingency: if -t loses too much accuracy, try RTMPose-s, or keep -m on WebGPU only.
5. **WebGPU graph/IO tuning.** `preferredOutputLocation: "gpu-buffer"` to keep SimCC on GPU; `freeDimensionOverrides` to lock batch=1; ensure `graphOptimizationLevel: "all"`; warm-up run on load to trigger shader compile before first real frame.
6. **fp16 RTMPose for WebGPU.** Export an fp16 variant (WebGPU loves fp16). Keep int8 as the wasm-path model. Benchmark both.

### Tier 3 — pipeline plumbing (smaller, reliability)
7. **Hardware crop via `drawImage`.** Replace the pure-JS area resampler for the RTMPose 256 crops with canvas `drawImage` (GPU resize). Resize is only 8.5ms so low ROI, but free latency + offloads CPU. Keep cv2-parity resampler only where parity matters (it doesn't for RTMPose — trained on standard resizes).
8. **OffscreenCanvas + worker.** Move capture/resize/inference into a Web Worker so the main thread (render) never blocks → smoother perceived motion even at same fps.
9. **Throttle to a stable cadence.** Cap the loop at a steady target (e.g. 24fps) so it never oversubscribes; single-flight already in place.

### Tier 4 — only if needed to hit floors
10. **Downscale capture.** `getImageData` on a 480p downscaled frame for the region pass (boxes are coarse anyway); full-res only for the hand crops.
11. **Quantize region+coarse models to int8.**

---

## Decision matrix — per optimization

```
                          accuracy within floor?
                          YES                         NO
latency improved?  YES    KEEP + commit               try a milder variant (Tier-2/3
                                                       knob); if still regressing, DROP
                   NO      DROP (revert)               DROP (revert)
```

## Decision matrix — overall progress checkpoints (every ~45 min)

```
node-CPU total avg     action
> 80 ms   (worse/flat) STOP current approach; escalate to Codex for a different angle;
                       if 2 consecutive approaches fail, jump to Tier-2 (RTMPose-t/fp16)
55-80 ms  (progress)   continue down the backlog
35-55 ms  (floor met)  validate browser floor (bench-browser + deploy), then pursue target
<= 35 ms  (target met) lock it; run full ship-gate; deploy; write summary; END loop
```

## Contingency ladder (if floors unreachable)

1. **Floors not met after Tier 1+2:** ship RTMPose-t on WebGPU + interleaved hands; accept node-CPU ~60ms (browser WebGPU still ~30fps). Document the gap.
2. **WebGPU automation still impossible to measure headlessly:** trust the node-CPU delta + wasm browser floor; the live `/tracking` profiler is the human-facing confirextraction. Do NOT block on headless WebGPU.
3. **Accuracy floor blocks every speedup:** keep RTMPose-m int8 at 1-hand-interleave + region-every-Nth only (safe, no accuracy cost), ship whatever fps that yields, document.
4. **A model download (RTMPose-t/fp16) fails:** skip Tier-2 model swaps, rely on Tier-1/3 (pure pipeline wins, no new artifacts).
5. **Hard blocker (build broken, can't deploy):** revert to last green commit `c6c217a`-or-later, redeploy that, document the blocker in `TRACKING-PERF-PROGRESS.md`, continue on a fresh branch.

---

## Definition of done

- `bench-pipeline.mjs --passes 5` meets the latency + throughput floors (target if reachable).
- `accuracy-check.mjs` shows ≤0.02 keypoint shift vs the RTMPose-fp32 baseline.
- `npm run typecheck` + `eslint` + `npm run build` all green.
- Deployed to Vercel; `/tracking` returns 200 and serves models; a saved skeleton render on the test video looks correct.
- `TRACKING-PERF-PROGRESS.md` updated with the before/after table and what shipped.
- All work committed (never pushed to git remote). Loop ends with a one-paragraph summary.

## Guardrails (hard)

- **No MediaPipe at runtime, ever.** RTMPose (reproducible from public Hand5 data) is the only allowed landmark model. (Path B — retrain RTMPose ourselves on Hand5 — is a SEPARATE later effort, not part of this perf loop.)
- **Never push to git remote.** Commit locally each green slice.
- **Never break accuracy to gain speed** — the accuracy floor gates every change.
- **Deploy only green builds.** Verify HTTP 200 + model serving after each deploy.
- Keep the heavy video/frames gitignored (`web/test-assets/`).

---

## OVERSEER NOTE (2026-05-31, added by reviewing session) — two-hand accuracy is a DETECTOR DATA bug, NOT a runtime perf item

User's live feedback: a single hand (fist or rotated palm) tracks fine, but a SECOND identical-looking hand makes the second one "wig out" / drop.

ROOT CAUSE (confirmed in asl-pilot-annotator/tools/detector0-annotator/autolabel.py:76 and crop_relabel.py:103): the region detector's two hand channels are assigned by **center-x split** (cx<0.5 -> left_or_first, cx>=0.5 -> right_or_second). When both hands are on the same side of center (drift, crossover, both-near-middle), BOTH hands get assigned the SAME channel in the training labels, so the detector learned to collapse both onto one channel and emit garbage in the other. This is baked into the TRAINING DATA — it is NOT fixable in live-tracker.ts.

DIVISION OF LABOR: the overseer is handling this via a region-detector RETRAIN (assign by MediaPipe handedness identity, not center-x; cover both-same-side cases) on Brev GPU, in the asl-pilot-annotator repo. The runtime IoU-dedup guard already shipped (commit ef4c620) is a partial mitigation (suppresses the duplicate so it doesn't render garbage) but cannot RECOVER the lost second hand — only the retrain can.

LOOP: do NOT spend ticks trying to runtime-fix two-hand assignment. Stay on the performance backlog. The new detector ONNX will be dropped into web/public/tracking/ by the overseer when ready; if its filename differs from detector0-grid-big2.onnx, the overseer will update live-tracker.ts (coordinate via this file).
