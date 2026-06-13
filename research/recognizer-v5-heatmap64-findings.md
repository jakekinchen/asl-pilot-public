# v5 — heatmap 32→64 (GPT-5.5 Pro Option A): FLAT. Resolution is not the bottleneck.

Executed the advisor's isolated resolution test: same data, same detector, same
recognizer recipe; only the landmark heatmap grid 32→64 (+ w64). Required a
trainer refactor (stream batches to MPS instead of holding the full ~21GB tensor
resident) to stop a g=64 memory hang; batch 96 (batch 160 re-triggered the stall).

## Results (PopSign signer-disjoint test)

| | landmark PCK@0.1 | recognizer top-1 / top-5 |
|---|---|---|
| v4 (hm32, w64) | 0.778 | 0.208 / 0.523 |
| **v5 (hm64, w64)** | **0.779** (L 0.798 / R 0.759) | **0.219 / 0.504** |

PCK flat (+0.001); recognizer top-1 +0.011 / top-5 −0.019 — within MPS
run-to-run noise. The val-PCK trajectory ran ~0.03 ahead mid-training but the
final test PCK did not improve.

## Branch (GPT-5.5 Pro ladder) → Outcome D (FLAT)

PCK < 0.788 and top-5 < 0.545 → resolution is NOT the main bottleneck. Per the
ladder: do NOT escalate to w96/multi-lever (C); **lock the better-top-5 model
(v4: 0.208 / 0.523) and build the end-to-end browser pilot**; document landmark
quality as the future accuracy path.

## Where the landmark levers stand (all now tested)
- data quantity (recognizer + landmark): flat
- capacity w32→w64: the ONE real gain (PCK 0.759→0.778, recognizer top-5 0.45→0.52)
- heatmap resolution 32→64: flat (this)

So from-scratch landmark quality is near its plateau for this architecture/data.
The product is carried instead by the **target-verification reframe**
(recall@FAR10 = 0.671, viable for guided practice) — see
[[target-verification-metric]]. Remaining unproven recognizer lever: distillation
from the clean-landmark teacher (separate from landmark work). LOCKED stack for
the pilot: region `detector0-grid-big2.pt` + landmark `detector0-hand-landmarks-merged-w64.pt`
+ recognizer `recognizer-v4-w64.pt`.
