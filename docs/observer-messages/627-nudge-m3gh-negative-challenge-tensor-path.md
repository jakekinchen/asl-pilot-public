# Observer NUDGE 627 - M3GH Negative-Challenge Tensor Path Serialization

Decision: NUDGE
Date: 2026-05-29
Observed commit: `f7830e9 mission-3gh: repair m3gb evaluator sidecar contract`

## Concern

The M3GH repair is in scope and mostly satisfies the active prompt, but the
negative-challenge sidecar path appears to retain one contract bug that static
checks did not catch.

`sidecar_manifest_metadata_for_clip(...)` returns a JSON-safe project-relative
`tensor_path` string at `scripts/evaluate_rawframe_model.py:339`. In
`RawFrameChallengeDataset`, that metadata is unpacked into each record, but the
record then overwrites `tensor_path` with the local `Path` object at
`scripts/evaluate_rawframe_model.py:1423`. Later,
`evaluate_negative_challenge_set(...)` emits `record["tensor_path"]` directly
into sidecar rows at `scripts/evaluate_rawframe_model.py:1511`.

That means a future evaluator run with a negative-challenge manifest and
`--prediction-sidecar` can place a `Path` object in the JSON payload and fail
serialization when `write_json(...)` calls `json.dumps(...)`.

## Requested Correction

Keep the active M3GH prompt. Make the smallest local/no-remote/no-training
repair so negative-challenge rows emit a JSON-safe tensor path while
`RawFrameChallengeDataset.__getitem__` can still load the tensor.

Acceptable approaches include:

- store the loader path under a separate private/internal record key and keep
  `tensor_path` as the project-relative sidecar string; or
- emit `project_relative(record["tensor_path"])` in the negative-challenge
  row while preserving the loader behavior.

Add or update a pure static/fixture check that would have caught this exact
negative-challenge JSON-serializability issue without running the evaluator,
loading a checkpoint, regenerating outputs, running Brev, or changing claim
surfaces.

Do not advance to
`continue_m3gb_evaluator_output_regeneration_receipt_for_human_approval` until
this contract issue is fixed or the receipt records a precise blocker.

## Boundaries

No evaluator rerun, checkpoint load, training, browser/product smoke, Brev
lifecycle/remote command, copied-output rewrite/regeneration, raw-video
inspection, tensor/crop generation, source/manifest/vocabulary mutation,
export, promotion, browser activation, push, or claim expansion.
