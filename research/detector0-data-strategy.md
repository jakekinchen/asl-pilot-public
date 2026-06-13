# Detector 0 data strategy (from 2026-05-29 source-discovery research)

Fact-checked dataset research (deep-research harness: 23 confirmed claims, 2
refuted). This turns it into an actionable plan + source-register candidates.

## TL;DR — the unlock is a policy change on data we already have

The biggest lever is **not** importing a new dataset. It's that **PopSign is
already approved and already on disk** (345 tier0 clips + 22k tensors), and your
relaxed constraint ("don't care how it's labeled; runtime must be our own
model") removes the one blocker: the current PopSign source decision says
*"Derived pose, landmark, embedding, feature, detector, or pretrained artifacts
remain disallowed."*

Flip that (offline-derived labels OK; pretrained tool never ships to the
browser) and we can **auto-label the PopSign frames we already have with
MediaPipe Holistic → derive the 4 region boxes → train on thousands of
in-domain frames with no hand-drawing.** The annotation GUI then becomes a
**QA/correction** tool for the auto-labels, not the primary labeler. That is the
scalable answer to "won't we need way more?"

## Ranked datasets (verified)

| Dataset | Domain fit | Labels shipped | Label source | License | Use |
|---|---|---|---|---|---|
| **PopSign ASL v1.0** | **HIGH** | raw video only | n/a (we auto-label) | **CC BY 4.0** (cleanest) | **Already ours.** In-domain train/scale via auto-label |
| **ASL Citizen** | **HIGH** | raw video only | n/a (self-label) | MS Research, non-commercial (academic OK; **no redistribution of data/derivatives**) | Bigger/more-diverse in-domain corpus; already in our register |
| **COCO-WholeBody** | MED-LOW | **face_box + lefthand_box + righthand_box + 133 kpts** | human (COCO) | **UNVERIFIED — CC-BY claim refuted** | Best generic *seed* (all 4 boxes in one set) — verify license first |
| **Halpe Full-Body** | MED-LOW | 136 kpts (+1 person box) | human | unverified | Seed alt; derive all 4 boxes from keypoint clusters |
| WLASL | MED | 1 YOLOv3 person box/clip | auto (YOLOv3) | C-UDA + "academic only", Google-Form gate | already in register; signer diversity only |
| MS-ASL | MED | 1 SSD person box/clip | auto (SSD) | unverified; YouTube link-rot | optional person-box seed |
| WIDER FACE | LOW | face boxes | human | CC BY-**NC-ND** (no redistribute derivatives) | skip unless face under-represented |
| Oxford/COCO-Hand/TV-Hand/EgoHands | LOW | hand boxes only | human | mostly unverified | optional hand augmentation only |

## Recommended pipeline (3 stages, mostly on assets we already have)

1. **Seed (optional, for robustness):** pretrain the from-scratch detector on
   **COCO-WholeBody** (take `face_box`/`lefthand_box`/`righthand_box` directly;
   derive upper-body box from shoulder/hip keypoints) — *after* verifying its
   license. Teaches the 4-region concept from a large set. Skippable if we want
   to move fast on in-domain only.
2. **In-domain auto-label (the core unlock):** run MediaPipe Holistic offline on
   the **PopSign** frames we already have → convert the per-region landmark
   clusters to the 4 boxes (`left/right hand`, `head/face`, `upper-body/signing
   space`) → train. Thousands of in-domain frames, no hand-drawing. Add **ASL
   Citizen** for signer/lighting diversity.
3. **Model-in-the-loop scaling:** run the trained Detector 0 over the abundant
   in-domain video, auto-label + temporally smooth across frames, and use the
   **GUI only to correct low-confidence frames**. Retrain. Repeat.

The pretrained labelers (MediaPipe/SSD/YOLO) run **only at labeling time** and
are never shipped to the browser — the one hard runtime constraint holds.

Success gate stays the bake-off bar: a learned detector only counts once it
beats the fixed-box baseline on held-out test (left hand IoU > 0.4073, right >
0.6476), then trends to spec.

## Source-register actions needed

1. **Update `popsign-v1-original-videos`** with a new review receipt: allow
   **offline-derived labels/boxes** (MediaPipe/auto) for training/eval, keep the
   **no-pretrained-at-runtime** restriction, keep CC BY 4.0 attribution. (Draft
   in `detector0-source-register-candidates.json`.)
2. **Review `asl-citizen` status** — already a source_id; confirm it permits
   training + derived labels; note its license bars redistributing data/derived
   crops (fine for local training, not for publishing the crops).
3. **Add `coco-wholebody` and `halpe-fullbody` as candidates** — pending
   primary-source license verification (COCO-WholeBody CC-BY claim was REFUTED).

## Risks / gotchas (verified)

- **Domain gap:** every generic seed is third-person/egocentric → stage-2 webcam
  calibration is mandatory, not optional.
- **License verification is the weak link:** COCO-WholeBody license UNVERIFIED;
  Halpe/MS-ASL/COCO-Hand/TV-Hand unconfirmed; WIDER FACE is NoDerivatives; ASL
  Citizen bars redistributing data/derivatives. **Training is fine for academic
  use; redistributing derived crops/labels is the constrained part.**
- **Keypoints→boxes:** pad per region (tight hulls clip fingertips/hairline);
  filter invalid/occluded keypoints.
- **Left/right mapping:** COCO-WholeBody/Halpe use *anatomical* left/right, but
  our targets are *viewer* left/right (`viewer_left_hand_context` /
  `viewer_right_hand_context`), and webcam mirror-flip compounds it — needs a
  deliberate relabel/flip.
- **Raw-video-only:** PopSign + ASL Citizen ship video, no boxes — we generate
  all in-domain labels (PopSign's MediaPipe landmarks live in a *separate*
  Google/Kaggle `asl-signs` set with its own terms).

## Open license questions (resolve before *redistributing* anything)

- COCO-WholeBody and Halpe annotation licenses (primary sources).
- MS-ASL, COCO-Hand, TV-Hand terms.
- Google Kaggle `asl-signs` (PopSign-derived MediaPipe parquet) redistribution
  rules — the most convenient pre-made in-domain landmarks.

_Sources: ASL Citizen (MS Research + NeurIPS 2023 arXiv:2304.05934); PopSign
(signdata.cc.gatech.edu + NeurIPS 2023); COCO-WholeBody (ECCV 2020,
arXiv:2007.11858); Halpe (arXiv:2211.03375); WLASL (WACV 2020,
arXiv:1910.11006); MS-ASL (arXiv:1812.01053); WIDER FACE (CVPR 2016)._
