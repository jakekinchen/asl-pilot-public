# Infra Area Instructions

## scope

Brev GPU orchestration, deployment, environment, secrets handling, and artifact collection.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `infra/LESSONS.md`

## local invariants

- Brev workers stopped when done.
- No large data committed.
- Secrets stay in environment/providers.
- Deployment does not introduce raw video upload.

## validation commands

```bash
./scripts/storage_budget_check.sh || true
bash -n scripts/brev_*.sh || true
npm run build || true
```

## lesson index

Add approved lessons here with stable ids.
