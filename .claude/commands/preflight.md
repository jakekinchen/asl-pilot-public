# /preflight

## purpose

Cwd-aware quality gate: lint, types, tests, format, import checks, and smoke checks relevant to the current area.

## procedure

Run the applicable commands that exist in the repo:

```bash
npm run lint
npm run typecheck
npm test
npm run build
pytest -q
python -m compileall scripts
python -m json.tool docs/validation/milestone-status.json
```

If a command does not exist, record that as `missing_command` rather than treating it as pass.

## output

- pass
- pass with warnings
- fail with command output
- missing_command list
