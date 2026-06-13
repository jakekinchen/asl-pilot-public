# Return-To-Form Human Demo Review v1

## Metadata

- schema: `asl-pilot-return-to-form-human-demo-review/v1`
- status: `action_selected`
- mission: M3AG human demo review
- checked_at: 2026-05-27T02:36:42Z
- source_claim: `docs/validation/return-to-form-reduced-product-claim-v1.md`
- source_claim_sha256: `717144bf12f3916546aa73bcb7cb7d5eeb1abf518561822c005c36922a4551b4`
- selected_signs: `please`, `table`, `dad`, `grandpa`, `hat`
- model_status: `not_trained`
- browser_recognition_enabled: false
- detector0_tracking_enabled: false
- box_driven_avatar_enabled: false
- final_readiness_claim: false
- product_threshold_selected_or_promoted: false
- brev_compute_used: false
- brev_sync_or_training_used: false
- brev_ssh_or_remote_process_inspection_used: false
- source_import_or_approval: false
- next_action: `stop_for_live_demo`

## Paths Inspected

| Path | Surface | SHA-256 |
| --- | --- | --- |
| `/` | `web/src/components/PracticeApp.tsx` | `c00991961e9345870359ad174764b1ec100b49ce87fae28bacc3e105a1d851c3` |
| `/lesson` | `web/src/app/lesson/page.tsx` | `00913971f559bc6fcf9ca107af0fe7dcb1468489842438e8922530c354d1c8bf` |
| `/lesson` | `web/src/components/LessonApp.tsx` | `7765aaeb056493d5c4e7f427e21a4b3ba6d4becb96aa31e6807943eb4dc48392` |
| `/validation` | `web/src/app/validation/page.tsx` | `3b49360aa667cab0a89f6d778ddeeb8bdafaaa9fe87cf0acc234dedf6f39a896` |
| `/validation` | `web/public/model/claim-matrix.json` | `99576a6366832bb5a322f312706dd40cb6a969e3bbbafaeda2ba196cb6e1a8c2` |
| `/validation` | `docs/validation/final-claim-matrix.json` | `99576a6366832bb5a322f312706dd40cb6a969e3bbbafaeda2ba196cb6e1a8c2` |
| `/validation` audit | `scripts/audit_final_claim_matrix.mjs` | `c6d3d58f9d0b5a8035587b9118e685e0bb401f3dc55c52e7cf6774bd9ae0811b` |
| Lesson smoke | `docs/validation/lesson-page-smoke.json` | `84866c1007c8c95c1654d7f941a4444d5fee26624d7dc606fccc98f930698678` |

## Demo Blocker Removed

### Practice Sampling Copy

The main practice route still had one misleading not-trained session copy path:
while sampling camera frames, the status strip said `Checking your attempt.`
That phrasing implied automatic ASL correctness review during the reduced
learn-only demo.

This slice changed the practice sampling state to:

```text
Sampling local camera frames.
```

The existing practice contract audit now checks for that neutral local-sampling
copy. No model, detector, threshold, source, export, or final gate state was
changed.

### Validation Status Ledger

The validation route still rendered older Round-001 task-026 progress-ledger
wording, including first-party collection and Brev-training next steps. That
made the evidence route look like it was steering reviewers back to the old
rawframe training plan instead of the current M3AF/M3AG reduced learn-only demo.

This slice updated the claim-matrix generator, regenerated both claim matrix
outputs, and made the `/validation` current-state panel render the ledger label
from the matrix rather than a hard-coded task-026 label. The matrix keeps the
same fail-closed claim status:

```text
status=no_active_claim_rawframe_not_trained
active_cv_claim=null
cv_supported_count=0
learn_only_count=100
browser_raw_rgb_webcam_recognition=not_trained
```

The refreshed ledger now labels the current state as `Mission 3AG`, records the
reduced learn-only demo state, and routes the next step to human live review
without restarting training, source approval, export, or threshold work.

## Current Demo Surface Evidence

`/` remains the main learn-only practice workspace. It still supports account
access, prompt selection, browser camera start/stop, local frame sampling,
practice-history persistence, and targeted coaching hints. In the not-trained
state, result confidence is hidden as `--`, threshold is `Not active`, and
attempts save as practice history rather than ASL correctness claims.

`/lesson` remains reachable from the practice route and supports the Tier 0
lesson set, local camera preview, metadata-only practice sample saving, and
the robot timing scaffold. The current Playwright smoke report is passed and
records:

```text
practice_links_to_lesson=passed
authenticated_lesson_ui=passed
robot_three_canvas=passed non_blank_pixels=826
fail_closed_claims_absent=passed
camera_local_sample=passed passed=false model_status=not_trained raw_payload_keys=[]
avatar_demo_mode=passed
```

`/validation` remains the reviewer status route and reads
`web/public/model/claim-matrix.json`. The top summary is still fail-closed:

```text
status=no_active_claim_rawframe_not_trained
active_cv_claim=none
browser_raw_rgb_webcam_recognition=not_trained
cv_supported_count=0
learn_only_count=100
progress_ledger.label=Mission 3AG
```

## Commands Run

```sh
git status --short --branch
node scripts/audit_codex_pair_state.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
npm run typecheck
npx eslint src/components/PracticeApp.tsx
npx eslint src/app/validation/page.tsx
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_lesson_page_smoke.mjs
node scripts/audit_final_claim_matrix.mjs --write
node scripts/audit_final_claim_matrix.mjs
brev ls --json
brev stop asl-pilot-rawframe-001
brev stop 2hl1hytty
brev stop --all
```

## Validation Summary

```text
pair_state=healthy
return_to_form_plan_audit=passed
loop_premise_audit=passed
source_register_audit=passed
no_pretrained_deps_audit=passed
no_pretrained_artifact_json_audit=passed findings=[]
web_typecheck=passed
practice_eslint=passed
validation_page_eslint=passed
lesson_fail_closed_audit=passed
avatar_no_recognition_claims_audit=passed
practice_screen_contract_audit=passed
lesson_page_smoke_audit=passed
final_claim_matrix_audit=passed
```

## Brev Status

Read-only inventory still showed the existing unused worker:

```text
name=asl-pilot-rawframe-001
id=2hl1hytty
status=RUNNING
build_status=COMPLETED
shell_status=READY
health_status=HEALTHY
instance_type=massedcompute_A100_sxm4_80G_DGX
gpu=A100
```

Cost-control stop attempts run in this slice:

```sh
brev stop asl-pilot-rawframe-001
brev stop 2hl1hytty
brev stop --all
```

Each stop command returned without an error, but repeated `brev ls --json`
verification still reported the workspace as `RUNNING`. No Brev SSH, sync,
remote process inspection, training, delete, or reset was attempted in this
M3AG slice.

## Remaining Blockers

- No trained recognizer or promoted Detector 0 artifact exists.
- The final-promotion negative-challenge gate remains separate and unresolved.
- Brev stop verification still reports the unused worker as `RUNNING` after
  name, id, and `--all` stop attempts.

## Next Action

Exactly one next action:

```text
stop_for_live_demo
```

Rationale: M3AG has removed the two bounded demo-review blockers found so far:
misleading practice sampling copy and stale validation status-ledger wording.
The reduced `/`, `/lesson`, and `/validation` path remains learn-only and
fail-closed, so the next useful step is human live review rather than another
autonomous product/code slice.
