# Return-To-Form Tier 0 Remediation API Synthesis

Date: 2026-05-25

Status: advisory synthesis from an OpenAI API research pass. Repo artifacts
remain authoritative.

## Context Supplied

Codex supplied the API pass with the return-to-form plan context, the M3AD
decode/dataloader proof, and the M3AE failed learnability-smoke summary.

Key local evidence:

- M3AD proved fixed-crop payloads shaped as per-clip region tensors.
- M3AE failed the bounded 5-sign smoke with train top-1 `0.376`, validation
  top-1 `0.256`, and zero train recall for `dad` and `grandpa`.
- The M3AE report says `RawFrameClipDataset` read the `rgb_frames`
  compatibility tensor while the M3AD `rgb_regions` payload remained
  hash-bound for region proof.

## API Synthesis

Ranked likely failure surfaces:

1. Tensor payload mismatch: high-priority hypothesis. Training may have used a
   single `rgb_frames` compatibility slice instead of the full `rgb_regions`
   fixed-crop stack the return-to-form architecture depends on.
2. Crop quality or region selection: inspect contact sheets before treating the
   model as the failure.
3. Model underfit or architecture mismatch: consider only after input payload
   and crop quality pass diagnostic checks.

Recommended remediation slices:

1. Inspect contact sheets and tensor statistics for `dad`, `grandpa`, and
   comparison labels. Stop for crop/config remediation if more than 15 percent
   of reviewed crops per label are missing or misaligned for sign-relevant
   content.
2. Verify that the training/evaluation path consumes the intended fixed-region
   tensor. If `rgb_regions` is unused, stop for a tensor/preprocessing/model
   input fix before rerunning training.
3. Only if crop quality and region tensor flow both pass, run an
   architecture-bounded microprobe to prove the model can discriminate the
   Tier 0 labels before scale-up.

Explicit non-goals:

- Do not move to detector or HandBoxNet work before crop validation.
- Do not add labels or external data.
- Do not increase epochs, augmentation, or model complexity until the input
  pipeline is ruled in.

Short prompt guardrail:

> Executor/observer must verify fixed-region input pipeline: (1) audit crop
> quality via contact sheets with a 15 percent error stop rule, (2) confirm the
> region tensor is consumed by the model, and (3) microprobe model recall before
> scale-up. Do not proceed to detector or augmentation work without crop and
> payload validation.
