# Return-To-Form PopSign Fresh5 Region-Grid Materialization Goal Loop Prompt

Mission 3BT prompt for the Codex executor after Mission 3BS selected
`continue_region_grid_or_detector0_tensor_materialization`.

Read [`GOAL.md`](../../GOAL.md) first, then
[`docs/model/return-to-form-plan.md`](return-to-form-plan.md).

## Mission

Materialize, verify, or precisely block a better PopSign fresh5 input contract
before any additional classifier training. The default hypothesis is that the
approved `popsign_fresh_5_v1` raw videos need a region-grid/fixed-crop tensor
contract, analogous to prior `rgb_regions_grid_v1` work, because the full-frame
M3BS smoke loaded and trained but produced weak held-out signal.

This is a local/no-spend, no-training data-contract mission. It may edit
analysis/materialization scripts, ignored generated manifests/tensors, tracked
receipts, and docs. It must not run model training, remote Brev training or
spend, export/promote a model, activate browser recognition, or change final
claims.

## Source Of Truth

Read in this order:

1. Latest user instruction in the current Codex thread.
2. [`GOAL.md`](../../GOAL.md), if it points at this prompt.
3. M3BS evidence:
   - [`docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json`](../validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json)
   - [`docs/session-logs/370-mission-3bs-popsign-fresh5-materialization-local-smoke.md`](../session-logs/370-mission-3bs-popsign-fresh5-materialization-local-smoke.md)
4. Candidate/source evidence:
   - [`docs/validation/return-to-form-supported-raw-source-candidates-v1.json`](../validation/return-to-form-supported-raw-source-candidates-v1.json)
   - [`docs/model/dataset-source-register.json`](dataset-source-register.json)
   - [`docs/research/popsign-v1-import-plan.json`](../research/popsign-v1-import-plan.json)
5. Fresh5 ignored local artifacts recorded by M3BS:
   - `data/manifests/return-to-form-popsign-fresh5/`
   - `data/tensors/return-to-form-popsign-fresh5/`
   - `output/return-to-form-popsign-fresh5-local-smoke/`
6. Prior region/crop references:
   - [`docs/model/return-to-form-fixed-crop-config.json`](return-to-form-fixed-crop-config.json)
   - [`scripts/decode_raw_videos.py`](../../scripts/decode_raw_videos.py)
   - [`scripts/train_rawframe_model.py`](../../scripts/train_rawframe_model.py)
   - [`scripts/run_return_to_form_tier0_decode_dataloader.py`](../../scripts/run_return_to_form_tier0_decode_dataloader.py)
   - [`docs/validation/return-to-form-high-signal-region-grid-materialization-v1.json`](../validation/return-to-form-high-signal-region-grid-materialization-v1.json)

## Current Evidence

M3BS materialized valid PopSign fresh5 full-frame manifests and tensors for:

```text
thank_you
pen
home
who
morning
```

Each split has 125 clips and 25 clips per selected label. The post-decode
dry-run/check-files path passed. The capped local full-frame smoke completed
but did not support a Brev training receipt: validation top-1 `0.192`, test
top-1 `0.272`, test macro F1 `0.20170903619228636`, false-pass rate `0.104`,
and zero test recall for `morning` and `pen`.

The next useful project movement is not more classifier training. It is to
materialize or block a better local input contract, preferring region-grid or
fixed-crop tensors before considering Detector 0/crop work.

## Required Slice

Complete exactly one smallest useful local data-contract slice.

1. Run quick state checks:

```sh
git status --short --branch
git log -10 --oneline --decorate
node scripts/audit_loop_premise.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_source_register.mjs
python3 -m json.tool docs/validation/return-to-form-popsign-fresh5-materialization-local-smoke-v1.json >/dev/null
python3 -m json.tool docs/validation/return-to-form-supported-raw-source-candidates-v1.json >/dev/null
.venv/bin/python -m py_compile scripts/train_rawframe_model.py scripts/decode_raw_videos.py
```

2. Inspect the M3BS fresh5 manifests/tensors and existing region/crop tooling.
Prefer reusing the proven fixed-crop/region-grid code paths over inventing a
new preprocessing system. Do not treat the full-frame `rgb_frames` tensors as
equivalent to the intended region-grid input.

3. Materialize the default region-grid/fixed-crop contract unless inspection
proves it unsafe:

- generate PopSign fresh5 region-grid tensors from the existing approved local
  raw videos and fixed-crop config;
- store generated manifests/tensors under ignored `data/manifests/` and
  `data/tensors/` paths;
- each generated tensor payload should include `rgb_regions`, `region_ids`,
  crop-config binding, source/video hashes, and tensor SHA-256s;
- prove the generated manifests satisfy the intended region-grid contract in
  dry-run/check-files mode, such as `--require-input-contract
  rgb_regions_grid_v1`, if current tooling supports that check.

4. If region-grid materialization is unsafe or impossible in this slice, write
a precise blocker instead of guessing. Acceptable blockers include missing
source video hashes, crop-config mismatch for PopSign framing, manifest schema
constraints, decode/FFmpeg/PyTorch failure, or evidence that Detector 0/crop
target work is the honest next local no-training contract.

5. Write a tracked receipt:

`docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`

The receipt must include:

- selected labels and M3BS metric blocker;
- changed files and exact validation commands;
- generated ignored manifest/tensor paths or the precise blocker;
- split counts, tensor counts, tensor hashes, source hashes, crop-config hash,
  and script hashes when materialization succeeds;
- input-contract proof for `rgb_regions_grid_v1` or fail-closed blocker proof;
- whether Detector 0/crop target work is needed before any more classifier
  training;
- explicit no-training/no-Brev-spend/no-promotion boundaries;
- exactly one next action.

6. Select exactly one next action:

- `continue_capped_local_fresh5_region_grid_smoke`: region-grid/fixed-crop
  manifests and tensors are valid and ready for one bounded local no-spend
  smoke.
- `continue_detector0_or_crop_contract_for_fresh5`: region-grid materialization
  is blocked or insufficient, and the next useful step is a local no-training
  Detector 0/crop target contract.
- `continue_local_model_data_design_ablation`: materialized tensors are valid
  but the local model/input design needs one bounded no-remote ablation plan
  before smoke.
- `stop_for_source_or_region_annotation_decision`: source, crop, annotation, or
  schema judgment requires human approval.
- `stop_until_supported_input_contract_exists`: no supported local input
  contract can be produced from current evidence.

## Hard Boundaries

- No model training, including local smoke.
- No Brev training, spend, worker lifecycle change, or remote command beyond a
  read-only `brev ls --json` if already needed for state visibility.
- No source-register approval change, unreviewed source import, public dataset
  training-use expansion, generated pseudo-labels, or pretrained detector,
  landmark, backbone, embedding, or model path.
- No ONNX export, browser model activation, active-label promotion,
  model-card promotion, final-readiness claim, final-gate weakening,
  product-fallback detour, ASL correctness claim, or push.

## Acceptance Criteria

This mission can close when:

1. `GOAL.md` points at this prompt and names Mission 3BT.
2. The M3BS receipt exists, is valid JSON, and selects
   `continue_region_grid_or_detector0_tensor_materialization`.
3. A tracked M3BT receipt exists at
   `docs/validation/return-to-form-popsign-fresh5-region-grid-materialization-v1.json`.
4. PopSign fresh5 region-grid/fixed-crop manifests/tensors are materialized and
   validated, or a precise blocker explains why they cannot be safely produced.
5. If materialization succeeds, every generated manifest clip has tensor path
   and tensor SHA-256 evidence recorded by the receipt.
6. The receipt records input-contract proof or fail-closed blocker proof before
   any more classifier training.
7. No local/remote training, broad training, Brev spend, source-register
   approval change, pretrained dependency, pseudo-labeling, export, browser
   activation, model-card promotion, final-gate change, unsupported claim, or
   push occurs.
8. `node scripts/audit_return_to_form_plan.mjs --json`,
   `node scripts/audit_loop_premise.mjs --json`,
   `node scripts/audit_no_pretrained_deps.mjs`,
   `node scripts/audit_no_pretrained_artifact_json.mjs`,
   `node scripts/audit_source_register.mjs`, receipt JSON validation,
   relevant py-compile checks, and `git diff --check` exit 0 or record exact
   blockers.
9. A numbered session log records commands, evidence, blockers, and exactly
   one next action.

## Observer Guidance

- CONTINUE only if materialization/blocker evidence is local/no-spend,
  no-training, and selects one bounded next action.
- NUDGE if the receipt lacks source/crop/tensor hashes, split counts,
  input-contract proof, or an explicit Detector 0/crop boundary.
- REDIRECT if the executor runs classifier training, jumps to Brev, broadens
  labels, treats `rgb_frames` fallback as the intended region-grid contract, or
  promotes a model.
- ESCALATE if fresh5 region-grid/Detector 0 input strategy is ambiguous enough
  that another local materialization turn would be low-confidence.
- STOP if the next meaningful action requires human source, rights, crop,
  annotation, budget, or credential approval.

## Progress Ledger

Each executor session log should end with:

```text
Current state:        Mission 3BT PopSign fresh5 region-grid materialization.
Completed:            <materialization path, blocker, receipt, optional code>.
Evidence:             <receipt, commands, sampled tensor proof>.
Remaining:            <single next action>.
Blockers:             <none or exact source/crop/schema/data blocker>.
Next step:            <single next action>.
Checkpoint commit:    <commit hash>.
```
