# Models Area Instructions

## scope

Scratch detector/recognizer training, evaluation, thresholds, model export, model cards, no-pretrained evidence.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `models/LESSONS.md`

## local invariants

- No pretrained weights or feature extractors.
- Run manifests for every GPU job.
- No plain argmax pass/fail.
- Metrics must support active recognition claims.

## validation commands

```bash
python -m compileall scripts || true
python scripts/train_guided_crop_signnet.py --smoke || true
python scripts/evaluate_hard_negatives.py --smoke || true
```

## lesson index

Add approved lessons here with stable ids.
