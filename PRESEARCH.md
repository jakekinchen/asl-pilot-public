# PRESEARCH

Status: discovery artifact

## Mechanics

- Repo status: unknown from the attachments. First build action must inspect the actual repository before changing code.
- Runtime target: modern desktop browser with camera access.
- ML stack: Python + PyTorch for scratch training; ONNX export for browser inference unless existing repo requires a different runtime.
- Frontend stack: TypeScript browser app. Default greenfield recommendation is React + Vite or Next.js, but existing repo conventions win.
- Account/progress default: adapter boundary with Supabase Auth/Postgres as the fastest realistic pilot path; existing auth/data stack wins if present.
- GPU execution: Brev-only remote GPU workers; local machine is storage/cache/control plane, not full training machine.

## Goal

Deliver a controlled pilot where a learner can log in, practice ASL 1 vocabulary, grant camera access, sign an isolated prompted concept, receive pass/fail feedback plus targeted hints, retry, and return later to saved progress.

## Users

- Primary: college ASL 1 learners.
- Secondary: pilot reviewers, instructors, project evaluators, engineering team.
- Explicitly not primary for pilot: teachers/admins managing rosters, SSO administrators, public users at scale.

## Stakeholders

- Human project owner: final authority on downscope and honest claims.
- Engineering team/agents: accountable for no-pretrained compliance, data provenance, training process, and browser integration.
- Learners: privacy and usability stakeholders.
- Instructors/reviewers: pedagogical credibility stakeholders.

## Core flows to verify

1. Create account / log in.
2. Start practice session.
3. Prompt appears.
4. Camera permission requested.
5. Learner signs.
6. Browser inference runs locally.
7. Pass/fail decision produced from thresholds.
8. If fail/uncertain, hint appears.
9. Learner retries or advances.
10. Progress persists.

## Domain terms

- Isolated sign: one vocabulary item, not a sentence.
- Active module: subset of signs with validated recognition support.
- Content vocabulary: signs available as learning prompts/metadata; may exceed active model coverage.
- Abstention: model refuses to mark correct when confidence/quality is insufficient.
- Clean Lane / Lane A: scratch-trained, no disallowed pretrained models or generated labels in promoted claim.

## Research questions before locking implementation

1. What repo stack already exists?
2. Which 75-100 beginner glosses are pedagogically approved and data-supported?
3. Which 5-10 signs can be smoke-trained immediately from available data?
4. Which 20-sign expansion is realistic by H24-H32?
5. Which datasets can be used under project terms, and what can be redistributed?
6. What exact labels/provenance from HaGRID are allowed in the clean lane?
7. Does the browser runtime need ONNX Runtime Web, TensorFlow.js, WebGPU, or WASM fallback?
8. What deployment target is required for the pilot demo?
9. Are raw video collection and future consent flows out of scope or planned separately?
10. What validation target is acceptable if 75-100 full recognition is not viable in 48 hours?

## Assumptions to challenge immediately

- 75-100 prompts can be present, but not all need equal validated recognition in the first 48-hour model.
- Fixed crops may be sufficient for a controlled pilot; detector training should not block recognizer training.
- No pretrained means no MediaPipe/OpenPose/YOLO/ResNet/EfficientNet/ViT backbones in promoted runtime or model training.
- Targeted hints can be rule-based using sign metadata and error categories, not necessarily CV-diagnosed phonology for v0.
- Learner video is processed locally; progress saves metadata and outcomes, not raw frames.

## Architecture options

### Option A — Fixed crop recognizer first

Pros: fastest browser pilot, fewer dependencies, easier no-pretrained audit.  
Cons: more sensitive to framing; weaker handshape/location explanations.

### Option B — Scratch detector + guided crop recognizer

Pros: better crop control and future feedback; aligns with compound plan.  
Cons: detector may consume scarce GPU time; must avoid pretrained detector contamination.

### Option C — Server-side inference

Pros: easier model runtime.  
Cons: conflicts with browser-first/privacy default; out of scope for pilot default.

## Recommendation

Use Option A as the guaranteed pilot path and Option B as a parallel improvement lane. Do not block browser integration on HandBoxNet unless it proves useful by the detector kill-switch gate.
