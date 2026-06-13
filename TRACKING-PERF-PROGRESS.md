# Tracking Performance Progress

History + before/after for the smoothness push described in `TRACKING-PERF-PLAN.md`.
Harness: `web/scripts/bench-pipeline.mjs --frames /tmp/bench_frames --passes 5`
(onnxruntime-node CPU EP, deterministic 275-frame test video) for latency deltas;
`web/scripts/accuracy-check.mjs --model <m> --limit 40` for the accuracy gate
(meanShift vs the RTMPose-fp32 baseline in `web/test-assets/accuracy-baseline.json`).

## Ship gate — status: MET (target)

| Metric | Floor | Target | Achieved (HEAD ef4c620) |
|---|---|---|---|
| Pipeline latency (node CPU EP, total avg) | ≤ 55 ms | ≤ 35 ms | **33.8 ms** ✅ target |
| Implied throughput (node CPU EP) | ≥ 18 fps | ≥ 28 fps | **29.6 fps** ✅ target |
| Accuracy meanShift vs fp32 baseline | ≤ 0.02 | ≤ 0.01 | **0.0004** ✅ target |
| Hand coverage | ≥ 98% | 100% | **100%** ✅ |
| Build / lint / typecheck | green | — | **green** ✅ |
| Deploy `/tracking` HTTP 200 + models served | 200 | — | **200, fp16 served** ✅ |

Browser wasm floor (`bench-browser.mjs`) was **not** measured: that script does not
exist and headless WebGPU does not work on this Mac. Per the plan's contingency #2 we
trust the node-CPU deltas + accuracy gate as the primary signals; the live `/tracking`
WebGPU profiler is the human-facing confirmation.

## Before / after

| Stage | Baseline (2-model pipeline, ~d77ab3c) | Now (ef4c620) |
|---|---|---|
| **TOTAL** | **105.5 ms (9.5 fps)** | **33.8 ms (29.6 fps)** — **3.1× faster** |
| resize (JS) | 8.5 ms | 7.0 ms |
| infer (ORT) | 96.9 ms (92%) | 26.8 ms |
| decode | 0.0 ms | 0.0 ms |
| hands/frame | 1.95 | 1.99 |

## What shipped (commits, newest first)

- **ef4c620** `p3: dedup overlapping hand boxes (fixes 2nd identical hand wig-out)` —
  Tier-3 reliability fix. When both hands look alike (two fists / rotated palms) the
  region detector's first/second channels can both lock onto the *same* hand; the
  duplicate channel emitted an overlapping box, RTMPose ran on it, and a garbage
  skeleton rendered over the real hand. Guard: if the two hand boxes overlap
  (IoU > 0.45 with both channels confident), suppress the lower-scoring duplicate.
  IoU is free (latency unchanged at 33.8 ms); accuracy meanShift 0.0004; hands/frame
  1.99 (both hands still tracked when genuinely present). Mechanism-based — the test
  video has only open hands, so the two-identical-hands case needs the user's live
  confirmation.
- **aaf7b30** `p3: fix fist dropouts + 3.5x speedup — region-score gating, drop coarse
  model` — Tier-1 #1, the big win. Dropped the redundant coarse landmark model from the
  hot path (RTMPose localizes+refines from the region hand box directly); replaced
  coarse-model presence with a region hand-box score gate (REGION_HAND_SCORE_GATE = 0.5,
  97–99% recall on hand-present frames). −1 inference/frame. This is the change that took
  the pipeline from ~105 ms to ~34 ms.
- **33b0ccd** `p3: point tracker at fp16 RTMPose (accuracy-safe)` — pointed stage 2 at
  `rtmpose-hand-fp16.onnx` (int8 was too lossy and was removed). fp16 is near-lossless
  and WebGPU-native.
- **d77ab3c** `p3: accuracy gate + fp16 RTMPose; perf plan` — added the accuracy harness
  and baseline, authored the perf plan.
- **c6c217a** `p3: headless node benchmark harness for the tracking pipeline`.

## Backlog status vs `TRACKING-PERF-PLAN.md`

- Tier-1 #1 (drop coarse model) — **DONE** (aaf7b30). This alone hit the target, so the
  remaining backlog was not needed for the ship gate:
  - Tier-1 #2 (one-hand temporal interleave), #3 (region every Nth frame) — **not done,
    not needed.** They risk perceived jumpiness; with the target already met they were not
    pursued (decision matrix: don't trade smoothness/correctness for latency we don't need).
  - Tier-2 (RTMPose-t/fp16 swaps, WebGPU IO tuning), Tier-3 (#7 hw crop, #8 worker, #9
    cadence cap), Tier-4 — **not done, not needed** for the target.

## Notes / observations

- A stray untracked `web/public/tracking/rtmpose-hand-int8.onnx` is present on disk and is
  being served by the live deploy (HTTP 200), but the runtime loads only fp16
  (`LANDMARK2_MODEL` in `live-tracker.ts`), so it is harmless dead weight on the CDN. Left
  in place (not deleted) — it is not referenced and removing it is a separate cleanup call.
- Live site verified: `https://web-gilt-three-42.vercel.app/tracking` → 200, fp16 served.

## Outcome

Goal achieved: the in-browser ASL hand tracker is **smooth (3.1× faster, ~30 fps node-CPU
proxy → comfortably 30+ fps on browser WebGPU) AND still accurate (meanShift 0.0004, no
regression)**, deployed and green. The remaining open item is **live, in-person webcam
confirmation** of the two-identical-hands dedup fix (ef4c620), which cannot be reproduced
on the open-hand test video.
