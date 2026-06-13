# Docs Area Instructions

## scope

Architecture, validation, audit, privacy, model cards, session logs, and task state.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `docs/LESSONS.md`

## local invariants

- Docs reflect actual behavior and metrics.
- Downscope decisions are explicit.
- No-pretrained and privacy claims have evidence.
- Task current state stays accurate.

## validation commands

```bash
python -m json.tool docs/validation/final-claim-matrix.json || true
grep -R "TODO" docs || true
```

## lesson index

Add approved lessons here with stable ids.
