# Brev Rawframe Training Handoff

Use this runbook only after the human explicitly approves a paid Brev run. The Codex executor must not run the provisioning, remote training, or paid-worker sync commands on its own.

## Preconditions

Run these locally before any Brev launch:

```sh
git status --short --branch
node scripts/audit_loop_premise.mjs --json
bash scripts/storage_budget_check.sh
./.venv/bin/python scripts/audit_local_ml_environment.py \
  --write-report docs/validation/local-ml-environment.json \
  --report docs/validation/local-ml-environment.json
./.venv/bin/python scripts/decode_raw_videos.py \
  --manifest data/manifests/train.json \
  --manifest data/manifests/validation.json \
  --manifest data/manifests/test.json \
  --tensor-root data/tensors \
  --verify-only
```

Expected local state before launch:

| item | expected value |
|---|---|
| Active prompt | `docs/model/codex-brev-training-execution-goal-loop-prompt.md` |
| Training target | 95-label PopSign-v1 active recognition module |
| GPU | `a100` |
| GPU count | `1` |
| Disk | `500GB` |
| Auto-stop | current Brev CLI does not expose create-time auto-stop; operator must stop manually |
| Output directory | `artifacts/rawframe-model` |
| Training artifacts | `artifacts/rawframe-model/model_state.pt`, `artifacts/rawframe-model/training-provenance.json` |

The final 17-type negative-challenge gate may still be red. That is a `final-promotion` blocker, not permission for Codex to provision Brev.

## Launch And Sync

Human-approved paid step:

```sh
BREV_INSTANCE_NAME=asl-pilot-rawframe-001 \
BREV_GPU=A100 \
  bash scripts/brev_create_48h.sh
```

Sync the repo plus the required training-data allowlist:

```sh
bash scripts/brev_sync_repo.sh asl-pilot-rawframe-001
```

The sync helper first rsyncs the repo while excluding broad generated or local-only paths:

```text
.git/
data/
node_modules/
.next/
artifacts/
.venv/
output/
.orchestrator-session-id
```

It then syncs only the rawframe training data needed by `train_rawframe_model.py --check-files`:

```text
data/manifests
data/active-module
data/tensors
data/external/popsign-v1/raw
data/external/asl-citizen/raw
data/external/cira-negative-challenge-videos/raw
data/external/wikimedia-commons-negative-challenge-videos/raw
```

Do not use `BREV_SYNC_TRAINING_DATA=0` for a real training run.

## Remote Training Command

Run this inside the Brev worker after sync:

```sh
cd /home/shadeform/asl-pilot
python3 -m venv .venv
./.venv/bin/python -m pip install --upgrade pip
./.venv/bin/python -m pip install -r requirements.txt
./.venv/bin/python scripts/train_rawframe_model.py \
  --train-manifest data/manifests/train.json \
  --validation-manifest data/manifests/validation.json \
  --test-manifest data/manifests/test.json \
  --output-dir artifacts/rawframe-model \
  --model-id asl-pilot-rawframe-v0 \
  --architecture compact_3d_cnn_spatiotemporal \
  --check-files
```

The training script must write:

```text
artifacts/rawframe-model/model_state.pt
artifacts/rawframe-model/training-provenance.json
```

The provenance must retain from-scratch evidence with `pretrained_components: []`.

## Copy Back And Stop

Copy the remote artifacts back before stopping the worker:

```sh
mkdir -p artifacts/rawframe-model
rsync -avz \
  asl-pilot-rawframe-001:/home/shadeform/asl-pilot/artifacts/rawframe-model/ \
  artifacts/rawframe-model/
shasum -a 256 \
  artifacts/rawframe-model/model_state.pt \
  artifacts/rawframe-model/training-provenance.json
```

Then stop the worker:

```sh
brev stop asl-pilot-rawframe-001
```

If a project wrapper is desired, `bash scripts/brev_stop_all_training.sh` also
filters by `asl-pilot-rawframe-` name prefix on Brev CLI versions that no longer
support create-time tags. If stop fails, record the instance name and run
`brev stop asl-pilot-rawframe-001` manually before any local promotion work.

## Next Local Step

After artifacts are copied back and the worker is stopped, continue locally with evaluation, calibration, export, and promotion through the existing scripts in the active training prompt. Do not hand-edit `web/public/model/model-card.json`.
