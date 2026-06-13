# /model-audit <artifact>

Project-specific addition for no-pretrained and model-claim discipline.

## procedure

1. Read `docs/no-pretrained-audit.md`.
2. Read model config, training script, run manifest, dependency list, and dataset manifest.
3. Confirm random initialization and no pretrained weights.
4. Confirm no pretrained-generated labels/landmarks entered clean lane.
5. Confirm metrics support active module claim.
6. Write/update audit result under `docs/validation/`.

## output

- pass clean-lane audit
- fail with blocker
- pass assisted-lane only
- needs human review
