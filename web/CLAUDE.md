# Web Area Instructions

## scope

Learner-facing browser app, routes, camera UI, auth/progress UI, practice flow, browser model integration.

## required reads

- `ARCHITECTURE.md`
- `MVP_TASKS.md`
- active brief in `docs/briefs/`
- `web/LESSONS.md`

## local invariants

- Raw video is not uploaded or persisted.
- Unsupported signs cannot produce pass/fail recognition.
- All camera permission states are handled.
- Practice UI stays beginner-friendly.

## validation commands

```bash
npm run lint || true
npm run typecheck || true
npm test || true
npm run build || true
```

## lesson index

Add approved lessons here with stable ids.
