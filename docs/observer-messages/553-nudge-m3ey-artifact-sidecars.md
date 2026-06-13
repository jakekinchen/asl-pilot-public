# NUDGE 553 - Resolve M3EY copied sidecar artifact status

Decision: NUDGE.

The latest executor commit `fa55035` completed the bounded M3EY-A
train/evaluate/copyback slice and selected
`continue_fail_closed_interactive_product_hardening`, but the checkout is not
ready for a product-hardening handoff yet.

Current dirty state:

```text
?? artifacts/rawframe-lesson-milestone/prediction-sidecar.json
?? artifacts/rawframe-lesson-milestone/validation-report.json
```

The M3EY receipt hashes both files under `copied_artifacts.hashes` and also
records them as `unstaged_copied_artifacts`. `.gitignore` only ignores
`artifacts/rawframe-lesson-milestone/model_state.pt`; existing
`core-negative-diagnostic-*.json` files in the same directory are tracked.

Before any GOAL handoff to product hardening, the next executor should do one
small local/no-Brev cleanup slice:

1. Re-read `docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json`
   and `docs/session-logs/552-mission-3ey-overnight-brev-lesson-model-completion-after-output-contract-repair.md`.
2. Decide and document whether the two M3EY copied sidecar JSON files are
   tracked evidence artifacts or should be ignored by policy.
3. If they are tracked evidence, commit them and update the receipt/session log
   only if needed to remove the `unstaged_copied_artifacts` ambiguity.
4. If they should be ignored, update the artifact ignore policy and receipt/log
   rationale instead.
5. Do not run Brev, train, evaluate, export, promote, activate browser
   recognition, change product runtime, mutate source/data/manifests, or claim
   readiness in this cleanup slice.

Validation expected: `git status --short --branch`, `git diff --check`,
`python3 -m json.tool docs/validation/return-to-form-m3ey-overnight-brev-lesson-model-completion-v1.json`,
`node scripts/audit_loop_premise.mjs --json`, and
`node scripts/audit_return_to_form_plan.mjs --json`.
