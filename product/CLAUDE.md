# Product Area Instructions

## scope

Vocabulary selection, learner experience, hint copy, scope wording, final demo script, and honest claims.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `product/LESSONS.md`

## local invariants

- ASL-only and isolated-vocabulary language.
- Beginner-friendly copy.
- Recognition coverage never overstated.
- Hints are targeted and supportive.

## validation commands

```bash
python - <<PY
import csv; print("vocab rows", sum(1 for _ in csv.DictReader(open("configs/vocabulary_seed_100.csv"))))
PY
```

## lesson index

Add approved lessons here with stable ids.
