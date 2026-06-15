# ASL Pilot

ASL Pilot is a browser-based ASL 1 practice demo. It shows a learner a
reference sign video first, lets them practice with their camera locally in the
browser, and returns lightweight practice feedback. It was built as an
academic/school project, with the web app, model pipeline, audit scripts, and
training receipts kept in one repository.

Live demo: `https://web-gilt-three-42.vercel.app/practice`

## What It Does

- Presents source-curated ASL 1 prompts and reference clips on the practice page.
- Keeps raw learner video on the device during normal practice.
- Runs the browser demo from exported ONNX assets under `web/public/`.
- Saves attempt metadata only, not learner video frames.
- Shows practice feedback only. It is not classroom grading, medical guidance,
  linguistic assessment, or open-vocabulary ASL translation.

## Current Claim Boundary

There are two intentionally separate truth surfaces:

| surface | status |
| --- | --- |
| Assignment demo recognizer | Trained/evaluated as the run10 practice-feedback demo artifact. Evidence lives in `docs/model/final-demo-pipeline.md` and `docs/validation/return-to-form-m3jb-*.json`. |
| Product model card | Still fail-closed: `web/public/model/model-card.json` is `not_trained`, and `docs/model/active-vocabulary-claim.json` has no active promoted labels. |

That split is deliberate. The run10 recognizer is useful demo evidence, but it
has not been promoted as a general product grading model. Normal practice also
keeps the project privacy constraint: no raw learner video upload.

## How It Was Built

### Web App

- Framework: Next.js 16, React 19, TypeScript, Tailwind CSS 4.
- Runtime ML: ONNX Runtime Web in the browser.
- Deployment: Vercel project rooted at `web/`.
- Camera path: browser media APIs only; raw frames stay local.
- Practice UI: video-first reference panel, local camera panel, and typed
  feedback state.

### Training And Evaluation Pipeline

The final assignment-demo path is documented in
`docs/model/final-demo-pipeline.md`. The short version:

1. Source videos came from approved/reviewed ASL source lanes, primarily PopSign
   ASL v1 and ASL Citizen material used for the school assignment path.
2. Source rights, splits, attribution, and claim boundaries were recorded in
   repo JSON receipts and validation docs.
3. Offline teacher labels were generated from RTMPose-style hand keypoints for
   supervision only. This was not a promoted runtime dependency.
4. A scratch SimCC w48 hand student was trained to predict hand coordinates.
5. The sequence cache normalized each clip into `T=32` frames with 90
   hand/geometry features per frame. The retained run10 cache covered 10,335
   clips and 330,309 frame rows.
6. The run10 recognizer was a Transformer sequence model: `d_model=256`, 6
   layers, 8 heads, trained for 240 epochs on a Brev L40S instance.
7. Thresholds were selected with monitor-fit validation and checked against
   held-out near-live browser evidence.
8. Browser artifacts were exported into `web/public/practice/` and
   `web/public/tracking/` for the demo path.

Run10 retained metrics:

| metric | value |
| --- | ---: |
| Test verification recall at FAR10 | 0.9209 |
| Honest monitor-fit recall on test | 0.9087 |
| Honest realized FAR | 0.0880 |
| Test top-1 | 0.5428 |
| Test top-5 | 0.8261 |
| Near-live browser true accept | 33 / 40 |
| Near-live browser wrong-prompt accept | 6.1% |

The main receipt is
`docs/validation/return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json`.
Supporting checks include the run10 trust audit, held-out near-live eval, and
production deploy receipt under `docs/validation/`.

## Repository Layout

```text
.
|-- README.md
|-- AGENTS.md
|-- ARCHITECTURE.md
|-- GOAL.md
|-- docs/
|   |-- model/          Training plans, model cards, pipeline explanations
|   |-- validation/     Audit receipts and retained evaluation evidence
|   |-- runbooks/       Operator runbooks for Brev, collection, and review
|   `-- review/         Vocabulary/source-review evidence
|-- scripts/            Audit, smoke-test, training, export, and promotion scripts
|-- web/                Next.js app deployed by Vercel
|-- web/public/         Browser-visible ONNX assets and reference clips
`-- data/               Local manifests and source metadata; raw source data is ignored
```

The public GitHub release should be cut from a cleaned snapshot. It should not
publish local `.env*` files, private keys, raw datasets, heavyweight training
artifacts, or internal session logs.

## Run Locally

```sh
cd web
npm install
npm run dev -- --hostname 127.0.0.1 --port 3025
```

Open `http://127.0.0.1:3025/practice`.

Production builds use the same `web/` root:

```sh
npm --prefix web run typecheck
npm --prefix web run build
```

## Verification

Recommended repo-level preflight:

```sh
bash scripts/preflight.sh
bash scripts/preflight.sh --fast
```

Focused checks that matter for public review:

```sh
node scripts/audit_no_pretrained_deps.mjs
node scripts/audit_no_pretrained_artifact_json.mjs
node scripts/audit_no_raw_video_upload.mjs
node scripts/audit_practice_screen_contract.mjs
node scripts/audit_browser_compatibility.mjs
npm --prefix web run typecheck
npm --prefix web run build
```

Secret/public-release checks:

```sh
git status --short
git ls-files | rg '(^|/)\\.env|\\.pem$|\\.key$|secret|token|credential|private'
gitleaks detect --source . --redact --no-banner --exit-code 1
```

## Deployment Notes

Vercel must deploy `web/` as the project root. If production shows stale UI,
check the deployed commit and Vercel project root before assuming the local app
is wrong.

The expected production practice surface is video-first: the left side should
show the sign reference video, not the older text-only description card.

## Hard Constraints

- No pretrained CV/sign/landmark/model dependencies in the promoted lane.
- No raw learner video upload during normal practice.
- Heavy GPU training uses Brev only when explicitly authorized.
- Extend the existing `scripts/audit_*.mjs` receipts instead of creating a
  parallel audit system.
- Do not hand-edit `web/public/model/model-card.json`; use the promotion script
  after a qualified model is ready.

