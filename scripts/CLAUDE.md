# Scripts Area Instructions

## scope

Automation scripts for Brev, storage checks, source inventory, data processing, training, and validation.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `scripts/LESSONS.md`

## local invariants

- Scripts are idempotent where possible.
- Scripts do not pull full datasets by default.
- Scripts fail loudly on missing required env vars.
- No secrets committed.

## validation commands

```bash
bash -n scripts/*.sh || true
python -m compileall scripts || true
node --check scripts/*.mjs || true
```

## lesson index

Add approved lessons here with stable ids.
