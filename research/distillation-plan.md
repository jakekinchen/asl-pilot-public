# Recognizer distillation plan

## Goal

Use the clean-landmark recognizer as a class-structure teacher for the deployable
runtime-landmark recognizer. The teacher is useful because it reaches about
0.367 top-1 / 0.671 top-5 on clean MediaPipe-style PopSign landmarks, but it is
not deployable directly because it collapses on our runtime landmark
distribution. The student stays deployable: it trains and evaluates on
`.cache/recog-seq-w64-merged`, the same our-model landmark sequence format used
by `recognizer-v4-w64.pt`.

## Harness

New file: `tools/detector0-annotator/train_recognizer_distill.py`.

The harness imports `Recognizer`, `load`, and `hand_feat` from
`train_recognizer.py` and keeps the same BiGRU feature contract:

- Teacher data: `.cache/handcrop-lm2`
- Default teacher checkpoint: `output/recognizer-v1.pt`
- Student data: `.cache/recog-seq-w64-merged`
- Default full-run output: `output/recognizer-distill.json` plus matching `.pt`
- Dry-run mode: `--no-save`, which skips all checkpoint and receipt writes

Teacher and student samples are aligned by `clip_id`. PopSign clips with a clean
teacher view receive teacher soft logits for the same clip. ASL Citizen clips,
which have no clean teacher view, remain hard-label CE only.

## Loss and augmentation

For teacher-covered clips:

`alpha * CE(student, hard_label) + (1 - alpha) * T^2 * KL(log_softmax(student / T), softmax(teacher / T))`

For clips without a teacher view:

`CE(student, hard_label)`

Defaults are conservative for the first full run: `alpha=0.55`,
`temperature=3.0`, coordinate jitter `0.02`, and random valid-frame dropout
`0.10`. Jitter applies only to coordinate features for hands with positive
presence, leaving presence scores untouched. Frame dropout zeros random valid
student frames but preserves sequence lengths, matching the existing recognizer
pooling path.

## Full training command for orchestrator

Do not run this while local MPS training is active:

```sh
/Users/kelly/Developer/asl-pilot/.venv/bin/python tools/detector0-annotator/train_recognizer_distill.py \
  --student-data tools/detector0-annotator/.cache/recog-seq-w64-merged \
  --teacher-data tools/detector0-annotator/.cache/handcrop-lm2 \
  --teacher-checkpoint tools/detector0-annotator/output/recognizer-v1.pt \
  --epochs 80 \
  --batch 64 \
  --device mps \
  --out tools/detector0-annotator/output/recognizer-distill.json
```

Evaluation reports PopSign `split == "test"` top-1/top-5, directly comparable
to `recognizer-v4-w64.pt` at 0.208 / 0.523.

## CPU dry-run proof

Command run from `/Users/kelly/Developer/asl-pilot-annotator`:

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python -B tools/detector0-annotator/train_recognizer_distill.py \
  --device cpu \
  --epochs 3 \
  --batch 32 \
  --student-hidden 32 \
  --limit-train 256 \
  --limit-monitor 64 \
  --limit-test 96 \
  --alpha 0.55 \
  --temperature 3.0 \
  --jitter-std 0.01 \
  --frame-drop 0.05 \
  --no-save
```

Result:

```text
student clips 10335 | train 256 monitor 64 test 96 | classes 95 | T 20 | feat 90
teacher checkpoint:/Users/kelly/Developer/asl-pilot-annotator/tools/detector0-annotator/output/recognizer-v1.pt | clean clips 4560 | overlap 4560 | teacher-covered train 100/256 | device cpu
ep   0 loss 8.739 mon top1 0.000 top5 0.062 (best 0.000)
ep   1 loss 8.679 mon top1 0.000 top5 0.062 (best 0.000)
ep   2 loss 8.612 mon top1 0.016 top5 0.062 (best 0.016)

=== DISTILLED RECOGNIZER TEST: top1 0.021  top5 0.062  (chance 0.011) ===
no-save: skipped checkpoint/receipt writes
```

The tiny CPU run proves the teacher/student alignment, KL path, hard-label-only
path for no-teacher clips, student noise augmentation, training loop, and
PopSign test evaluator all execute. Loss decreased from 8.739 to 8.612 over
three epochs. The small test metric is not a model claim; it is only a no-save
sanity result on a 256-clip training subset with a reduced hidden size.

## Orchestrator checks

Before promoting anything, verify that the full-run receipt exists, the weights
path matches the receipt, and the PopSign test numbers beat or at least explain
their relation to `recognizer-v4-w64.pt` at 0.208 / 0.523. Also inspect the
reported teacher-covered train count; it should be the PopSign subset, while AC
clips remain CE-only.
