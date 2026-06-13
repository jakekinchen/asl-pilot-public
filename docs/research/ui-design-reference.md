# UI Design Reference (asl-app extract)

This document captures the design language, route structure, and component patterns that the now-deleted `asl-app/` subtree expressed. It is the canonical UI reference for the compound plan's M7 browser integration milestone, when GuidedCropSignNet ships and the learner-facing surface gets rebuilt.

**Status:** reference only. `web/` is the active app shell — it has the audit hookups, the API surface, the Stage A wiring, and the model card runtime that 60+ existing scripts depend on. The intent here is to bring asl-app's design polish into `web/` during M7, not to rebuild asl-app.

**Source preserved in git history:** the asl-app subtree was merged in at commit `34e0944` and removed in a later commit. To diff or recover any specific file:

```sh
git show 34e0944:asl-app/src/app/page.tsx
git show 34e0944:asl-app/src/components/NavBar.tsx
git log 34e0944 -- asl-app/src/app/
```

Relevant asl-app commit hashes (preserved via the merge):

| Commit | Purpose |
|---|---|
| `c889ce2` | Snapshot before monorepo migration — Stage A evaluator port + UI polish + supabase migration + MediaPipe WASM/verifier JSONs |
| `cc67827` | Polish signed-in ASL app surfaces |
| `2dfaf7b` | Trigger Vercel deploy from trusted author |
| `990fc4a` | Apply ASL app landing polish |
| `f1eba08` | Apply ASL app nav design |
| `4fde682` | Deploy ASL app with Supabase auth |

---

## Design concept

**Studio / cinéma vérité.** Between a film studio and an editorial journal. ASL is a visual, embodied language; learners practice it in front of a camera. The interface treats the camera as a *cinematographer's tool* (corner brackets, frame counter, REC indicator) and the vocabulary as *editorial type* (large Fraunces serif italic display, mono technical labels, generous negative space).

Calm and pedagogical — not gamified, not corporate-utility-flat.

## Principles (carry forward to M7)

- **Calm, not gamified.** No streaks, points, badges, celebrations. Mastery is a pill or small editorial mark.
- **No emoji, no decorative glyphs.** Hierarchy comes from type, scale, and space.
- **Failure is supportive.** "Try again" with a targeted hint, never "Wrong" or "X".
- **One signature accent per screen.** Saffron is a punctuation mark, not a coat of paint.
- **Color is never the sole signal.** Pass/fail and status pills always carry text labels.
- **Honest about the model.** Landing page and `/privacy` page disclose what the evaluator is and isn't.

## Type stack

Loaded via `next/font/google` in `layout.tsx`, exposed as CSS variables:

| Family | Variable | Role |
|---|---|---|
| Fraunces | `--font-fraunces` / `--font-serif` | Display: hero, page titles, prompt words, verdicts. Variable axes opsz, SOFT, WONK. Italic carries weight. |
| Geist | `--font-geist` / `--font-sans` | Body copy and UI default. |
| JetBrains Mono | `--font-jetbrains` / `--font-mono` | Eyebrow labels, frame counters, timestamps, technical readouts, wordmark brackets. |

Three reusable helpers in `globals.css`: `.font-display`, `.font-display-italic`, `.font-mono-label`.

Sizes used across the app:

| Use | Classes |
|---|---|
| Hero display | `font-display-italic text-6xl sm:text-7xl lg:text-8xl leading-[0.95]` |
| Page title | `font-display text-4xl sm:text-5xl tracking-tight` |
| Section heading | `font-display text-2xl tracking-tight` or `text-base font-medium` (UI) |
| Body | `text-[15px] leading-relaxed text-ink-soft` |
| Eyebrow / over-line | `font-mono uppercase tracking-[0.18em] text-[11px] text-ink-muted` |
| Metadata | `font-mono text-[11px] text-ink-muted` |

**Avoid Inter, Space Grotesk, Roboto, Arial, or system-default rendering.** These three were chosen for a reason.

## Color tokens

All in `src/app/globals.css` `@theme {}` (Tailwind v4):

| Token | Role |
|---|---|
| `--color-paper` | Page background — warm cream, not pure white |
| `--color-paper-deep` | Deeper card / panel surface |
| `--color-paper-edge` | Edge / well surface, for inputs and inset blocks |
| `--color-ink` | Primary text — warm near-black |
| `--color-ink-soft` | Secondary text / body copy |
| `--color-ink-muted` | Eyebrow labels, metadata |
| `--color-ink-faint` | Decorative punctuation (brackets, separators) |
| `--color-rule` | Hairline dividers |
| `--color-rule-soft` | Subtler hairlines |
| `--color-accent` | Saffron — the one signature accent |
| `--color-accent-deep` | Deeper saffron for text on light |
| `--color-accent-ink` | Text on saffron fill |
| `--color-pass` / `--color-pass-soft` | Moss — pass verdict, mastered |
| `--color-fail` / `--color-fail-soft` | Terracotta — fail verdict |

All colors defined in `oklch()`. Legacy aliases mapped for survivors.

## Shape language

- `rounded-none` — editorial surfaces (panels, wells, dividers)
- `rounded-sm` — pills, status badges
- `rounded-md` — inputs, buttons (subtle)
- `rounded-full` — REC dot, the rare circle

If you reach for `rounded-2xl` or `rounded-3xl`, stop. No rounded marshmallows.

## Layout

- Container: `mx-auto w-full max-w-5xl px-6` on `<main>`
- Vertical air: `py-12 sm:py-16` on `<main>`
- Asymmetric layouts: mix `lg:grid-cols-[1.2fr_1fr]`, `lg:grid-cols-12`, stacked editorial blocks. Avoid evenly partitioned 3-up cards.

---

## Route structure (M7 should mirror this in web/src/app/)

Currently `web/src/app/page.tsx` is an 11-line stub that just renders `PracticeApp`. asl-app expressed a richer route structure that M7 should adopt:

| Route | Purpose | Source ref |
|---|---|---|
| `/` | Marketing landing page with hero, value props, mock disclosure, CTA. 207 lines of design. | `git show 34e0944:asl-app/src/app/page.tsx` |
| `/dashboard` | Signed-in landing — recent attempts, mastery summary, next-up prompts. | `git show 34e0944:asl-app/src/app/dashboard/page.tsx` |
| `/practice` | The capture + evaluate flow. | `git show 34e0944:asl-app/src/app/practice/page.tsx` |
| `/vocabulary` | Browse the 96-item beginner ASL 1 list, mastery markers. | `git show 34e0944:asl-app/src/app/vocabulary/page.tsx` |
| `/login` | Email + password, bottom-rule inputs. | `git show 34e0944:asl-app/src/app/login/page.tsx` |
| `/signup` | Sign-up + scope/expectations disclosure. | `git show 34e0944:asl-app/src/app/signup/page.tsx` |
| `/privacy` | Privacy posture — what stays local, what goes to Supabase. | `git show 34e0944:asl-app/src/app/privacy/page.tsx` |
| `/auth/signout` | Sign-out route handler. | `git show 34e0944:asl-app/src/app/auth/signout/route.ts` |

The existing `web/` surfaces (`/validation`, `/review`, `/__smoke`, `/smoke`, `/api/*`) stay intact alongside the new learner routes.

## Components (M7 should port these into web/src/components/)

| Component | Lines | Purpose |
|---|---|---|
| `NavBar.tsx` | 164 | Sticky two-row header on mobile, single row at sm+. Page-nav (Dashboard / Practice / Vocabulary) with `/` separators. Wordmark on the left, user email pill + sign-out on the right when signed in. |
| `CameraView.tsx` | 99 | Mirrored webcam preview (`-scale-x-100`) inside a black-bg container with corner brackets (`.viewfinder-bracket--tl/tr/bl/br`), frame counter, REC indicator. Handles `getUserMedia` errors with explicit messages. |
| `PracticeSession.tsx` | 421 | Capture flow: prompt → camera arm → 2s record → verdict → hint or next. Wraps the evaluator and manages timer/state. Replaces what's currently a 637-line monolithic `PracticeApp.tsx` in `web/`. |
| `EvaluatorDevPanel.tsx` | 57 | Dev-only force-next-verdict + mode switch panel. Uses `border-dashed border-rule` to visually downrank itself. |

## Component / pattern reference

### Wordmark
```tsx
<Link href="/" className="group inline-flex items-baseline gap-1.5">
  <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-ink-muted">
    <span className="text-ink-faint">[</span>asl<span className="text-ink-faint">]</span>
  </span>
  <span className="font-display-italic text-lg leading-none text-ink">practice</span>
</Link>
```

### Eyebrow label
```tsx
<p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
  Prompt · conversation
</p>
```

### Buttons

Primary (saffron, one CTA per screen):
```tsx
<button className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition hover:bg-accent-deep hover:text-paper">
  Start practicing
  <span aria-hidden>→</span>
</button>
```

Strong (ink — dominant action inside a workflow):
```tsx
<button className="inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:bg-ink-soft disabled:opacity-50">
  Start signing
</button>
```

Ghost / secondary:
```tsx
<button className="inline-flex items-center gap-2 rounded-md border border-rule px-4 py-2 text-sm text-ink-soft transition hover:border-ink hover:text-ink">
  Retry this sign
</button>
```

### Inputs

Prefer **bottom-rule** inputs over boxed for editorial feel:
```tsx
<label className="block">
  <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">Email</span>
  <input
    type="email"
    className="mt-2 w-full border-b border-rule bg-transparent py-2 text-base text-ink outline-none transition focus:border-ink"
  />
</label>
```

### Panels (instead of cards)
```tsx
<div className="border border-rule bg-paper-deep/60 p-6">…</div>
```

Editorial divider with eyebrow label:
```tsx
<div className="rule-with-label" data-label="recent attempts">…</div>
```

### Status pills
```tsx
<span className="font-mono text-[10px] uppercase tracking-[0.18em] bg-pass/12 text-pass px-2 py-1">mastered</span>
<span className="font-mono text-[10px] uppercase tracking-[0.18em] bg-accent/15 text-accent-deep px-2 py-1">in progress</span>
<span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink-faint px-2 py-1">new</span>
```

### Diagnostic / dev surfaces
```tsx
<details className="border border-dashed border-rule bg-paper-deep/40 p-4 text-xs">
```

## Motion (CSS-only, restrained)

- Page load: stagger with `.fade-rise`, `.fade-rise-delay-1`, `…-2`, `…-3`, `…-4`. One slow swell.
- Recording indicator: `.rec-pulse` on the REC dot.
- Hover: hairline darkens, text muted → full ink. No translations or scale.
- Respects `prefers-reduced-motion`.

## Voice and tone

- **Imperative actions:** "Start signing", "Enable camera", "Retry this sign".
- **Plain state:** "Pass", "Try again". Never "Wrong" or "Correct!".
- **Concept-first prompts:** `Sign HELLO.`
- **No exclamation points** outside the prompt itself.
- **Mono labels** for technical/state copy, serif italic for editorial moments.

## Accessibility commitments

- Keyboard focus: 2px saffron-deep ring with 3px offset, keyboard-only.
- Color is never sole signal; pass/fail and pills always carry text labels.
- Camera failure modes are explicit with distinct messages (`NotAllowedError`, `NotFoundError`, `OverconstrainedError`, unsupported, generic error).
- All inputs have associated labels.
- No autoplaying audio. Reduced-motion respected.

## Out of scope (by design)

- Dark mode. The pilot ships one calm light theme.
- A component library (Radix / shadcn). Pattern count is small; this doc + inline classnames are sufficient.
- Heavy iconography. Editorial type and text labels do the work.

---

## Scope reference (controlled conditions)

From `asl-app/docs/scope.md`. These are the conditions the UI surfaces, not enforces:

- Built-in laptop or external USB webcam, ≥ 480p
- Indoor lighting, learner's face visible and not strongly backlit
- Plain or low-clutter background
- Head, shoulders, torso in frame
- Hands have ~30 cm clearance to either side of the torso
- Learner ~50-80 cm from the camera
- 96 beginner ASL 1 vocabulary items
- Isolated signs only; no fingerspelling, phrases, sentences

Pass/fail threshold was `0.72`; the GuidedCropSignNet calibrated thresholds will be per-class.

## Privacy posture (carry forward verbatim to the new `/privacy` page)

From `asl-app/docs/privacy.md`. Defaults during normal practice:

- Camera feed via `navigator.mediaDevices.getUserMedia`, rendered locally.
- The evaluator runs in the browser; frames never leave the device during evaluation.
- Per attempt the app sends only: `vocabulary_id`, `verdict`, `confidence`, `threshold`, `predicted_label`, `hint_kind`, `hint`, `model_version`, `duration_ms`, `frame_count`, `created_at`.
- RLS on `attempts` and `profiles` restricts reads/writes to the owning user.

What is **never** sent: raw video, still frames, camera-derived tensors or embeddings, device fingerprinting beyond what the browser sends to Supabase as part of normal HTTP.

Camera failure handling: `NotAllowedError` / `SecurityError` → "Camera blocked" with reload guidance. `NotFoundError` / `OverconstrainedError` → "Camera unavailable". Unsupported → "This browser does not support camera capture". Other → generic "Camera error" with the underlying message. **In all camera-failure cases the practice button stays disabled.**

---

## Evaluator swap-in (M7's specific concern)

asl-app expressed a clean `SignEvaluator` interface that should survive into web/'s M7 wiring:

```ts
export interface SignEvaluator {
  readonly id: string;
  readonly version: string;
  evaluate(input: EvaluatorInput): Promise<EvaluatorResult>;
}
```

`EvaluatorInput` carries the expected `VocabularyItem`, captured frame metadata + recording duration. `EvaluatorResult` returns verdict, confidence, threshold, predicted label, optional hint kind + hint string, model version, rationale string.

This shape is wider than `web/`'s current `LocalInferenceResult` type in `web/src/lib/client-model.ts` — M7's new `aslRecognizer.ts` should reconcile the two so that GuidedCropSignNet, Stage A (legacy, demoted), and any mock implementation can all satisfy the same interface.

Source for the swap-in plan: `git show 34e0944:asl-app/docs/mock-cv.md`.

---

## M7 porting checklist (compound plan reference)

When M7 fires:

1. Pull the route structure into `web/src/app/`: add `/dashboard`, `/practice`, `/vocabulary`, `/login`, `/signup`, `/privacy` from the asl-app sources above. Replace the 11-line `web/src/app/page.tsx` stub with the 207-line landing page.
2. Pull components into `web/src/components/`: `NavBar.tsx`, `CameraView.tsx`, `PracticeSession.tsx`, `EvaluatorDevPanel.tsx`. Reconcile `PracticeSession` with the existing `PracticeApp.tsx` (637 lines) — the latter has the real Stage A evaluator integration, the former has cleaner UX. The merge target should expose the `SignEvaluator` interface above and let M7's new `aslRecognizer.ts` plug GuidedCropSignNet in.
3. Pull design tokens / `globals.css` / type loading from `git show 34e0944:asl-app/src/app/globals.css` and `git show 34e0944:asl-app/src/app/layout.tsx`. Tailwind v4 `@theme {}` block carries the color tokens and `next/font/google` carries Fraunces / Geist / JetBrains Mono.
4. Adopt the privacy doc verbatim at `/privacy`. Adopt the scope doc as `docs/research/learner-app-scope.md` or fold into the M7 model card.
5. Keep the existing `web/` API routes (`/api/auth`, `/api/dataset`, `/api/me`, `/api/ort`, `/api/progress`, `/api/review`, `/api/attempts`, `/api/health`) and the validation surface (`/validation`, `/review`, `/__smoke`, `/smoke`) untouched.

Once that port lands and the M7 browser smoke audits pass, `asl-app/` is fully absorbed and this reference doc has done its job.
