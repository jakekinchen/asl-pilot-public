import { LABELS } from "./scratch-pipeline";
import {
  VOCABULARY,
  getSignHintMetadata,
  type HintKind,
  type SignHintMetadata,
  type VocabularyItem,
} from "./vocabulary";

// ---------------------------------------------------------------------------
// The graded practice catalog: one entry per recognizer label (the run10
// SimCC-w48 recognizer's 95 classes), joined with the curated vocabulary entry
// and the per-sign study metadata. This is the single source the practice and
// lesson surfaces use to prompt signs, render "how it's signed" study cards,
// and resolve targeted hints — so the set of prompted words is exactly the set
// the recognizer can grade (assignment requirement: 75-100 beginner signs,
// each prompted sign receives a pass/fail decision).
// ---------------------------------------------------------------------------

// Recognizer labels and vocabulary ids agree except for three renames.
const LABEL_TO_VOCABULARY_ID: Record<string, string> = {
  TV: "tv",
  callonphone: "call_on_phone",
  thankyou: "thank_you",
};

export function vocabularyIdForLabel(labelId: string): string {
  return LABEL_TO_VOCABULARY_ID[labelId] ?? labelId;
}

export type PracticeCatalogItem = {
  /** Recognizer label, exact LABELS casing (e.g. "TV", "callonphone"). */
  labelId: string;
  /** Curated vocabulary id (e.g. "tv", "call_on_phone"). */
  vocabularyId: string;
  label: string;
  category: string;
  prompt: string;
  coachingHint: string;
  /** The dimension most worth coaching first for this sign. */
  hintKind: HintKind;
  /** Descriptive canonical-form study cues (never diagnostic). */
  study: SignHintMetadata;
  /** Reviewed reference signer clip that ships with the app. */
  clipUrl: string;
};

// Beginner-curriculum unit order; categories not listed sort after, in
// vocabulary order. Unit = vocabulary category.
const UNIT_ORDER = [
  "conversation",
  "family",
  "people",
  "feelings",
  "food",
  "colors",
  "animals",
  "classroom",
  "home",
  "time",
  "questions",
  "actions",
  "transportation",
  "objects",
  "concepts",
];

const UNIT_TITLES: Record<string, string> = {
  conversation: "Everyday conversation",
  family: "Family",
  people: "People",
  feelings: "Feelings",
  food: "Food & drink",
  colors: "Colors",
  animals: "Animals",
  classroom: "Classroom",
  home: "Around the home",
  time: "Time",
  questions: "Questions",
  actions: "Actions",
  transportation: "Getting around",
  objects: "Objects",
  concepts: "Concepts",
};

function buildCatalog(): PracticeCatalogItem[] {
  const labelByVocabularyId = new Map<string, string>(
    LABELS.map((labelId) => [vocabularyIdForLabel(labelId), labelId]),
  );

  // Iterate the curated vocabulary (its order within each category is the
  // curriculum order) and keep only the signs the recognizer grades.
  const items: PracticeCatalogItem[] = [];
  for (const vocab of VOCABULARY) {
    const labelId = labelByVocabularyId.get(vocab.id);
    if (!labelId) continue; // learn-only extra (help/stop/finish/school/plus)
    items.push({
      labelId,
      vocabularyId: vocab.id,
      label: vocab.label,
      category: vocab.category,
      prompt: vocab.prompt,
      coachingHint: vocab.coachingHint,
      hintKind: vocab.hintKind,
      study: getSignHintMetadata(vocab.id) ?? {},
      clipUrl: `/pilot/clips/${vocab.id}.mp4`,
    });
  }

  const unitRank = (category: string) => {
    const rank = UNIT_ORDER.indexOf(category);
    return rank === -1 ? UNIT_ORDER.length : rank;
  };
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        unitRank(a.item.category) - unitRank(b.item.category) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
}

export const PRACTICE_CATALOG: readonly PracticeCatalogItem[] = buildCatalog();
export const PRACTICE_CATALOG_COUNT = PRACTICE_CATALOG.length;

const CATALOG_BY_LABEL = new Map<string, PracticeCatalogItem>(
  PRACTICE_CATALOG.map((item) => [item.labelId, item]),
);

export function getCatalogItem(labelId: string): PracticeCatalogItem | undefined {
  return CATALOG_BY_LABEL.get(labelId);
}

export type PracticeUnit = {
  category: string;
  title: string;
  items: PracticeCatalogItem[];
};

export const PRACTICE_UNITS: readonly PracticeUnit[] = (() => {
  const units: PracticeUnit[] = [];
  for (const item of PRACTICE_CATALOG) {
    const last = units[units.length - 1];
    if (last && last.category === item.category) {
      last.items.push(item);
    } else {
      units.push({
        category: item.category,
        title: UNIT_TITLES[item.category] ?? item.category,
        items: [item],
      });
    }
  }
  return units;
})();

const CATALOG_BY_VOCABULARY_ID = new Map<string, PracticeCatalogItem>(
  PRACTICE_CATALOG.map((item) => [item.vocabularyId, item]),
);

/** Graded-catalog entry for a curated vocabulary id (undefined = learn-only). */
export function getCatalogItemForVocabularyId(
  vocabularyId: string,
): PracticeCatalogItem | undefined {
  return CATALOG_BY_VOCABULARY_ID.get(vocabularyId);
}

// The lesson surface browses the FULL curated vocabulary (the 95 graded signs
// plus the learn-only extras), grouped into the same curriculum units.
export type VocabularyUnit = {
  category: string;
  title: string;
  items: VocabularyItem[];
};

export function groupVocabularyIntoUnits(
  items: readonly VocabularyItem[],
): VocabularyUnit[] {
  const unitRank = (category: string) => {
    const rank = UNIT_ORDER.indexOf(category);
    return rank === -1 ? UNIT_ORDER.length : rank;
  };
  const sorted = items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        unitRank(a.item.category) - unitRank(b.item.category) ||
        a.index - b.index,
    )
    .map(({ item }) => item);
  const units: VocabularyUnit[] = [];
  for (const item of sorted) {
    const last = units[units.length - 1];
    if (last && last.category === item.category) {
      last.items.push(item);
    } else {
      units.push({
        category: item.category,
        title: UNIT_TITLES[item.category] ?? item.category,
        items: [item],
      });
    }
  }
  return units;
}
