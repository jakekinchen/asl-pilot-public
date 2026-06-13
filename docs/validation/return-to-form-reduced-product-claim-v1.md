# Return-To-Form Reduced Product Claim v1

## Metadata

- schema: `asl-pilot-return-to-form-reduced-product-claim/v1`
- status: `action_selected`
- mission: M3AF reduced product claim
- checked_at: 2026-05-26T21:41:03Z
- selected_signs: `please`, `table`, `dad`, `grandpa`, `hat`
- model_status: `not_trained`
- detector0_tracking_status: `not_promoted`
- browser_recognition_enabled: false
- detector0_tracking_enabled: false
- box_driven_avatar_enabled: false
- final_readiness_claim: false
- product_threshold_selected_or_promoted: false
- brev_compute_used: false
- brev_sync_or_training_used: false
- source_import_or_approval: false
- next_action: `stop_human_demo_review`

## Evidence Bound To This Claim

| Artifact | Path | SHA-256 |
| --- | --- | --- |
| M3AE-AP microprobe v2 receipt | `docs/validation/return-to-form-tier0-detector0-union-target-architecture-microprobe-v2.json` | `a6de1a2e8537802927878e5a5810e9e83bbc19263b5d48d72c7b72a7d51ee039` |
| Practice surface | `web/src/components/PracticeApp.tsx` | `bbaf948a8f015c85e48dfc8b24219d3df25693ae6d42341c1c380bb3c1e9f8af` |
| Lesson surface | `web/src/components/LessonApp.tsx` | `7765aaeb056493d5c4e7f427e21a4b3ba6d4becb96aa31e6807943eb4dc48392` |
| Lesson route | `web/src/app/lesson/page.tsx` | `00913971f559bc6fcf9ca107af0fe7dcb1468489842438e8922530c354d1c8bf` |
| Model card | `web/public/model/model-card.json` | `00328c469536d6230a3c43c521f8aad68dfc05ef21fc0c0ad4a92421b54f894a` |
| Active vocabulary claim | `docs/model/active-vocabulary-claim.json` | `a8e269d0e79b50696c46bb728399acbf295c05c6ec962d6738c93f3a9bbc6546` |
| Browser model bundle | `web/public/model/browser-model-bundle.json` | `edf324076c07875da57fd9a29aa7f4c491434cebd3af4ddc4dab5f5f573a63e9` |
| Source register | `docs/model/dataset-source-register.json` | `b02c73fce978b348166df54080541851612445ecd9d01e83bed0a9538620b8e8` |
| Current Detector 0 packet | `data/annotations/detector0/return-to-form-tier0-localization-packet-v0.json` | `6d7079caf7daf7f6675b4c2340b0cb5bc89c90a514103504edba87f4241bb29d` |
| Train manifest | `data/manifests/return-to-form-tier0/train.json` | `03ae563a5f2ef0d5b868f6c80f50acb64ae642e782cd541faa5c022d4d0af1de` |
| Validation manifest | `data/manifests/return-to-form-tier0/validation.json` | `23da15a80ce2eee1dab1a7e64c08e2aefcf5d7dd48263677fdc49d1efb0ad808` |
| Test manifest | `data/manifests/return-to-form-tier0/test.json` | `b0c771b612ebb52beb375a98b4180ccd465aa642312a8c6c29d7ff225febd8ed` |

## Current Model And Tracker Truth

The active browser model claim is fail-closed:

```text
web/public/model/model-card.json status=not_trained
docs/model/active-vocabulary-claim.json modelVersion=rawframe-not-trained
activeLabels=[]
web/public/model/browser-model-bundle.json recognition.enabled=false
web/public/model/browser-model-bundle.json detector0_tracking.enabled=false
web/public/model/browser-model-bundle.json box_driven_avatar.enabled=false
```

M3AE-AP remains the latest ML evidence source. It proved the selected v2
Detector 0 union-target architecture can fit train, but it repeated held-out
presence failure without concrete packet, tensor, source, or schema
invalidation:

```text
train_presence_accuracy=1.0
train_present_box_mae=0.0015357083175331354
train_present_box_mean_iou=0.9822187423706055
validation_presence_accuracy=0.3636363744735718
validation_false_negative_count=7
test_presence_accuracy=0.4000000059604645
test_false_negative_count=6
data_or_schema_invalidation_found=false
next_action=stop_reduced_claim
```

## Supported Demo Path

The honest demo path is learn-only:

1. `/` remains the main practice workspace. It supports account-scoped prompt
   selection, local camera preview, local frame sampling, practice-history
   persistence, and coaching hints. The reduced-copy pass changes live/session
   labels to learn-only/local wording and hides confidence/threshold values
   when the model card is not trained.
2. `/lesson` supports the Tier 0 lesson set (`please`, `table`, `dad`,
   `grandpa`, `hat`), local camera preview, metadata-only practice sample
   saving, and an idle/timing robot scaffold.
3. `/validation` remains the reviewer status route for model-card and claim
   evidence.

This demo path may show local camera UX and learning scaffolding. It must not
be presented as automatic ASL correctness, live Detector 0 tracking, promoted
recognition, or final product readiness.

## Unsupported Claims

These claims remain explicitly unsupported:

- automatic ASL correctness evaluation;
- live sign recognition;
- live Detector 0 tracking;
- box-driven avatar tracking;
- trained browser model readiness;
- active recognizer labels;
- model-card promotion;
- ONNX export or product threshold promotion from the M3AE-AP evidence;
- final readiness or negative-challenge gate completion;
- any broader 75/95-label result;
- any claim based on pretrained detectors, landmarks, generated pseudo-labels,
  or unapproved media.

## Product Surface Changes

Only the main practice surface was changed in this slice:

- `Live · in browser` became `Learn-only · in browser`.
- `Session live` became `Learn-only session`.
- the ready camera viewport label changed from `Live` / `REC · LIVE` to
  `Local` / `REC · LOCAL`.
- not-trained attempt results now say `Practice saved` instead of `Try again`,
  hide numeric confidence as `--`, and show threshold as `Not active`.

No model, detector, source, packet, manifest, final gate, threshold, export, or
runtime inference path was promoted.

## Brev Status

Read-only inventory showed the existing worker still reported as running:

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

Process inspection found no training job:

```text
/usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers
/home/shadeform/.venv/bin/python3 /home/shadeform/.venv/bin/jupyter-lab --ip=0.0.0.0 --no-browser ...
```

Stop attempts run:

```sh
brev stop asl-pilot-rawframe-001
brev stop 2hl1hytty
brev stop --all
```

Each stop command returned without an error, but repeated `brev ls --json`
verification still reported `asl-pilot-rawframe-001` / `2hl1hytty` as
`RUNNING`. This is a human cost-control blocker or provider-side stop issue.
No delete or reset was attempted because that requires explicit user approval.

## Commands Run

```sh
git status --short --branch
git log --oneline -8
sed -n '1,260p' GOAL.md
sed -n '1,280p' docs/model/return-to-form-reduced-product-claim-goal-loop-prompt.md
sed -n '1,240p' docs/runbooks/codex-goal-loop.md
sed -n '1,260p' docs/runbooks/observer-runbook-codex.md
node scripts/audit_codex_pair_state.mjs --json
node scripts/audit_return_to_form_plan.mjs --json
node scripts/audit_loop_premise.mjs --json
node scripts/audit_source_register.mjs
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
npm run typecheck
npx eslint src/components/PracticeApp.tsx
node scripts/audit_lesson_fail_closed.mjs
node scripts/audit_avatar_no_recognition_claims.mjs
node scripts/audit_practice_screen_contract.mjs
brev ls --json
brev exec asl-pilot-rawframe-001 "ps -eo pid,etime,pcpu,pmem,args | egrep 'python|torch|train|screen|tmux' | grep -v egrep || true"
brev stop asl-pilot-rawframe-001
brev stop 2hl1hytty
brev stop --all
```

## Validation Summary

```text
return_to_form_plan_audit=passed
loop_premise_audit=passed
source_register_audit=passed
no_pretrained_deps_audit=passed
no_pretrained_artifact_json_audit=passed
web_typecheck=passed
practice_eslint=passed
lesson_fail_closed_audit=passed
avatar_no_recognition_claims_audit=passed
practice_screen_contract_audit=passed_after_preserving_contract_copy
brev_training_process_check=no_training_process_found
brev_stop_verification=failed_workspace_still_running
```

## Remaining Blockers

- No trained recognizer or promoted Detector 0 artifact exists.
- M3AE-AP blocks further no-new-source Detector 0 training by selecting
  `stop_reduced_claim`.
- The final-promotion negative-challenge gate remains separate and unresolved.
- Brev stop verification still reports the unused worker as `RUNNING` after
  name, id, and `--all` stop attempts.

## Next Action

Exactly one next action:

```text
stop_human_demo_review
```

Rationale: the reduced claim is now explicit enough for human demo review:
practice and lesson surfaces are learn-only/fail-closed, model and tracker
claim files are disabled, and the remaining choices are human demo/scope,
content, cost-control, or new-data decisions rather than autonomous training.
