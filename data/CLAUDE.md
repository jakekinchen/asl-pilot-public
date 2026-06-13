# Data Area Instructions

## scope

Dataset source verification, rights/provenance, gloss normalization, manifests, shards, frame/crop data.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `data/LESSONS.md`

## local invariants

- No full PopSign or full native HaGRID downloads.
- Every clip/label has provenance.
- Unknown/pretrained-generated labels excluded from clean lane.
- Splits preserve signer/session/source boundaries where possible.

## validation commands

```bash
./scripts/storage_budget_check.sh || true
python -m compileall scripts || true
python scripts/build_training_shard.py --smoke || true
```

## lesson index

Add approved lessons here with stable ids.
