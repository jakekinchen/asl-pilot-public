# Autonomous loop prompt — paste into a fresh Claude Code `/loop` session

Copy everything in the code block below into a new Claude Code session, prefixed with `/loop ` (no interval — let it self-pace). It is fully autonomous: it never asks the human anything, uses a Codex `gpt-5.5 xhigh` subagent for parallel implementation, benchmarks on the user's video, and ships by morning.

```
/loop You are the autonomous owner of a performance push, running unattended overnight. The human is asleep and CANNOT be asked anything — make every decision yourself using the plan's decision matrices and contingency ladder. Infinite compute/spend approved. NEVER push to the git remote. NEVER use MediaPipe at runtime.

GOAL: Make the in-browser ASL hand tracker SMOOTH (it is already accurate) and keep it deployed to Vercel, by morning. Accuracy must not regress.

FIRST, READ (in order):
1. /Users/kelly/Developer/asl-pilot-web/TRACKING-PERF-PLAN.md — your full plan: minimum metrics (ship gate), the ordered optimization backlog, decision matrices, and contingency ladder. This is your source of truth.
2. /Users/kelly/Developer/asl-pilot-web/WEB-AVATAR-PROGRESS.md and TRACKING-PERF-PROGRESS.md (create the latter if missing) — history.
3. git log --oneline -12 in /Users/kelly/Developer/asl-pilot-web. Last green commit is d77ab3c (or later).
4. /Users/kelly/Developer/asl-pilot-web/web/src/lib/live-tracker.ts — the pipeline you are optimizing.

ENVIRONMENT (all verified working):
- Repo/worktree: /Users/kelly/Developer/asl-pilot-web (branch web-avatar). cd web for npm.
- Benchmark (consistent, headless): `cd web && node scripts/bench-pipeline.mjs --frames /tmp/bench_frames --passes 5`. Reports per-stage ms + fps on the user's 275-frame test video. If /tmp/bench_frames is empty, regenerate: `ffmpeg -i web/test-assets/bench-input.mov -vf "fps=12,scale='min(960,iw)':-2" -q:v 3 /tmp/bench_frames/f_%04d.jpg -y`.
- Accuracy gate: `cd web && node scripts/accuracy-check.mjs --model public/tracking/<model>.onnx --limit 40`. Floor: meanShift <= 0.02 vs the fp32 baseline (test-assets/accuracy-baseline.json already saved). NEVER ship a change that breaches it.
- Browser floor (optional, slower): a Playwright wasm run; headless WebGPU does NOT work on this Mac, so trust the node-CPU DELTAS + accuracy gate as primary signals (see plan's contingency #2).
- Validate every change: `cd web && npm run typecheck && npx eslint src/lib/live-tracker.ts && npm run build`.
- Deploy: `cd /Users/kelly/Developer/asl-pilot-web && vercel --prod --yes` (CLI is authed as jakekinchen). Verify after: `curl -s -o /dev/null -w "%{http_code}" https://web-gilt-three-42.vercel.app/tracking` == 200. Same URL each deploy.
- Models live in web/public/tracking/. Current accuracy-safe model: rtmpose-hand-fp16.onnx (int8 was too lossy and was removed). RTMPose-t/fp16 variants can be downloaded from download.openmmlab.com per the plan (Tier 2).

SUBAGENT (use it for implementation while you measure/decide):
Spawn Codex gpt-5.5 xhigh non-interactively. Pattern:
  printf '%s' "<tight, self-contained task with exact files + acceptance check>" | codex exec -m gpt-5.5 -c model_reasoning_effort="xhigh" --cd /Users/kelly/Developer/asl-pilot-web --skip-git-repo-check -o /tmp/codex_out.txt
Scope each task tightly (exact file, exact change, "do not push, do not touch other files, report a diff"). It has full disk access — always review its diff and re-run typecheck+build+bench+accuracy before committing. You may run 1-2 in parallel (& wait) for independent changes. The model self-reports its id unreliably — trust the flags.

LOOP EACH TICK:
1. Pick the next backlog item from TRACKING-PERF-PLAN.md (Tier 1 first — they have the biggest ROI; inference is 92% of frame time).
2. Implement it yourself OR dispatch the Codex subagent with a tight brief.
3. Measure: bench-pipeline (latency delta) + accuracy-check (must stay <=0.02). Apply the per-optimization decision matrix: keep only if latency improves AND accuracy holds; else revert.
4. If kept: typecheck+eslint+build, commit (scoped paths, NEVER push), append a before/after row to TRACKING-PERF-PROGRESS.md.
5. Deploy after a meaningful batch of kept changes (not every micro-step); verify 200 + model served.
6. Re-read the FIRST commit's task in the plan's progress-checkpoint matrix; if total avg <= 35ms (target) AND ship-gate passes, do a final deploy + write a summary + END the loop. If <=55ms (floor) and you've exhausted Tier 1-2, deploy that, document, and END.

KNOWN FIRST STEP: live-tracker.ts currently references the removed rtmpose-hand-int8.onnx. Your first slice: point stage 2 at rtmpose-hand-fp16.onnx, confirm WebGPU EP + sequential session creation are intact, typecheck+build+deploy so the site is green again. THEN start the backlog (drop the redundant coarse model is the highest-ROI Tier-1 item).

GUARDRAILS: no MediaPipe at runtime; never push to remote; accuracy floor gates every change; deploy only green builds; keep web/test-assets gitignored. If you hit a hard blocker, follow the plan's contingency ladder, document it, and keep going on the next item — do not stop to ask.

When done (or genuinely blocked on everything), write a final summary to TRACKING-PERF-PROGRESS.md, send one PushNotification with the result, and end the loop.
```
