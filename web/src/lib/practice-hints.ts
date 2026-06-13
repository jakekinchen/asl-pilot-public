import type { HintKind } from "./vocabulary";
import type { PracticeCatalogItem } from "./practice-catalog";

// ---------------------------------------------------------------------------
// Targeted hint resolution for the graded practice surface, per
// docs/hint-authoring-guide.md: a failed attempt gets a teachable, descriptive
// cue tied to an observable dimension of the sign (framing, location,
// movement, handshape, orientation, timing) instead of a bare "incorrect".
// Cues come from the per-sign study metadata (canonical-form facts) and never
// claim a diagnosis of what the learner specifically did wrong — the reason
// names what the system measured (hands not visible, a different top read,
// a below-threshold score), and the cue restates how the sign is made.
// ---------------------------------------------------------------------------

export type PracticeHintReason =
  | "hands_not_visible"
  | "different_sign_read"
  | "below_threshold";

export type PracticeHint = {
  reason: PracticeHintReason;
  dimension: HintKind;
  /** Short, factual line about what the system measured. */
  headline: string;
  /** One or two descriptive study cues (escalates with the fail streak). */
  cues: string[];
  /** After repeated misses, prompt another look at the reference video. */
  suggestReferenceReview: boolean;
};

const DIMENSION_LABELS: Record<HintKind, string> = {
  handshape: "Handshape",
  movement: "Movement",
  location: "Location",
  orientation: "Orientation",
  timing: "Timing",
  framing: "Framing",
};

export function hintDimensionLabel(dimension: HintKind): string {
  return DIMENSION_LABELS[dimension];
}

function studyCue(item: PracticeCatalogItem, dimension: HintKind): string | null {
  const cue = item.study[dimension];
  return cue ? `${DIMENSION_LABELS[dimension]}: ${cue}` : null;
}

/** First available cue from the preferred dimension order. */
function firstCue(
  item: PracticeCatalogItem,
  preferred: HintKind[],
): { dimension: HintKind; cue: string } | null {
  for (const dimension of preferred) {
    const cue = studyCue(item, dimension);
    if (cue) return { dimension, cue };
  }
  return null;
}

export function resolvePracticeHint(input: {
  item: PracticeCatalogItem;
  rank: number;
  acceptTopK: number;
  handCoverage: number;
  failStreak: number;
}): PracticeHint {
  const { item, rank, acceptTopK, handCoverage, failStreak } = input;
  const suggestReferenceReview = failStreak >= 3;

  // The camera barely saw any hands — no read is meaningful; coach framing.
  if (handCoverage < 0.35) {
    return {
      reason: "hands_not_visible",
      dimension: "framing",
      headline:
        "The camera could not see your hands for most of the attempt.",
      cues: [
        studyCue(item, "framing") ??
          "Framing: keep your signing hand(s) fully inside the camera frame, about arm's length away.",
      ],
      suggestReferenceReview,
    };
  }

  // The model's top reads were other signs — coach the most identifying
  // dimensions of this sign (where it sits and how it moves).
  if (rank >= acceptTopK) {
    const primary =
      firstCue(item, [item.hintKind, "location", "movement", "handshape"]) ??
      ({ dimension: item.hintKind, cue: item.coachingHint } as const);
    const cues = [primary.cue];
    if (failStreak >= 2) {
      const secondary = firstCue(
        item,
        (["location", "movement", "handshape", "orientation"] as HintKind[]).filter(
          (d) => d !== primary.dimension,
        ),
      );
      if (secondary) cues.push(secondary.cue);
    }
    return {
      reason: "different_sign_read",
      dimension: primary.dimension,
      headline: "The model read this attempt as a different sign.",
      cues,
      suggestReferenceReview,
    };
  }

  // Ranked near the top but under the calibrated threshold — coach the sign's
  // priority dimension, then timing on a repeat miss (rushed or blended signs
  // are the common cause of soft reads).
  const primary =
    firstCue(item, [item.hintKind, "movement", "location"]) ??
    ({ dimension: item.hintKind, cue: item.coachingHint } as const);
  const cues = [primary.cue];
  if (failStreak >= 2) {
    const secondary = firstCue(
      item,
      (["timing", "movement", "orientation"] as HintKind[]).filter(
        (d) => d !== primary.dimension,
      ),
    );
    if (secondary) cues.push(secondary.cue);
  }
  return {
    reason: "below_threshold",
    dimension: primary.dimension,
    headline:
      "Close — the sign ranked near the top but did not read clearly enough to pass.",
    cues,
    suggestReferenceReview,
  };
}
