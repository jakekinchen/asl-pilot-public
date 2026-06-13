import SIGN_HINT_METADATA_JSON from "./sign-hint-metadata.json";

export type HintKind =
  | "handshape"
  | "movement"
  | "location"
  | "orientation"
  | "timing"
  | "framing";

export type SignHintMetadata = {
  handshape?: string;
  movement?: string;
  location?: string;
  orientation?: string;
  timing?: string;
  framing?: string;
};

export const SIGN_HINT_METADATA: Readonly<Record<string, SignHintMetadata>> =
  Object.freeze(SIGN_HINT_METADATA_JSON.items as Record<string, SignHintMetadata>);

export function getSignHintMetadata(id: string): SignHintMetadata | undefined {
  return SIGN_HINT_METADATA[id];
}

export type VocabularyItem = {
  id: string;
  label: string;
  category: string;
  prompt: string;
  coachingHint: string;
  hintKind: HintKind;
  reviewStatus: "source_curated" | "reviewed";
};

type VocabularySeed = [
  id: string,
  label: string,
  category: string,
  prompt: string,
  coachingHint: string,
  hintKind: HintKind,
];

const VOCABULARY_SEEDS: VocabularySeed[] = [
  ["hello", "Hello", "conversation", "Sign HELLO.", "Start with a clear greeting sign near the face and keep your hand visible in frame.", "location"],
  ["bye", "Bye", "conversation", "Sign BYE.", "Use a small, controlled waving movement with the hand fully visible.", "movement"],
  ["thank_you", "Thank you", "conversation", "Sign THANK YOU.", "Begin near the chin and move outward; keep the palm orientation clear.", "movement"],
  ["please", "Please", "conversation", "Sign PLEASE.", "Keep the open hand on the chest area and make the movement smooth.", "location"],
  ["yes", "Yes", "conversation", "Sign YES.", "Use a firm fist handshape and a clear nodding motion.", "movement"],
  ["no", "No", "conversation", "Sign NO.", "Keep the closing fingers visible and avoid moving too far from the signing space.", "handshape"],
  ["like", "Like", "conversation", "Sign LIKE.", "Start at the chest and keep the finger movement small enough for the camera to see.", "location"],
  ["not", "Not", "conversation", "Sign NOT.", "Keep the negative movement clear, centered, and visible from start to finish.", "movement"],
  ["have", "Have", "conversation", "Sign HAVE.", "Keep both hands visible near the torso and hold the ending shape briefly.", "location"],
  ["can", "Can", "conversation", "Sign CAN.", "Use a clear downward movement with both hands staying in frame.", "movement"],
  ["go", "Go", "conversation", "Sign GO.", "Keep the directional movement centered and finish with a short hold.", "movement"],
  ["book", "Book", "classroom", "Sign BOOK.", "Keep both palms visible and open the hands like a book.", "movement"],
  ["pen", "Pen", "classroom", "Sign PEN.", "Keep the writing movement small and centered so it stays in frame.", "movement"],
  ["pencil", "Pencil", "classroom", "Sign PENCIL.", "Keep the writing handshape visible and make the small motion easy to see.", "handshape"],
  ["read", "Read", "classroom", "Sign READ.", "Keep the base hand steady and the reading movement in the camera view.", "movement"],
  ["table", "Table", "classroom", "Sign TABLE.", "Keep both hands visible and make the flat surface shape clear.", "orientation"],
  ["chair", "Chair", "classroom", "Sign CHAIR.", "Keep the handshape compact and show the repeated contact clearly.", "handshape"],
  ["help", "Help", "classroom", "Sign HELP.", "Keep both hands visible as one hand supports and lifts the other.", "movement"],
  ["stop", "Stop", "classroom", "Sign STOP.", "Keep the chopping hand and base palm visible at the moment of contact.", "movement"],
  ["finish", "Finish", "classroom", "Sign FINISH.", "Keep both hands visible as they flip outward with a clear finish.", "movement"],
  ["school", "School", "classroom", "Sign SCHOOL.", "Keep both palms visible and show the clap/contact clearly.", "movement"],
  ["plus", "Plus", "classroom", "Sign PLUS.", "Keep both index fingers visible as they cross to form the plus shape.", "handshape"],
  ["room", "Room", "home", "Sign ROOM.", "Keep both hands visible and show the box-like shape with a clear finish.", "movement"],
  ["home", "Home", "home", "Sign HOME.", "Keep the face-side locations visible and make the two touches distinct.", "location"],
  ["bed", "Bed", "home", "Sign BED.", "Keep the head-side hand placement visible and hold the ending shape briefly.", "location"],
  ["who", "Who", "questions", "Sign WHO.", "Keep the index finger and chin area visible for the question sign.", "location"],
  ["where", "Where", "questions", "Sign WHERE.", "Keep the index finger upright and use a small side-to-side motion.", "orientation"],
  ["why", "Why", "questions", "Sign WHY.", "Start near the forehead and finish with the handshape visible.", "location"],
  ["morning", "Morning", "time", "Sign MORNING.", "Keep the base arm and rising hand visible so the location reads clearly.", "location"],
  ["night", "Night", "time", "Sign NIGHT.", "Keep both hands visible and show the top hand moving over the base hand.", "movement"],
  ["tomorrow", "Tomorrow", "time", "Sign TOMORROW.", "Start near the cheek and move forward with the thumb visible.", "movement"],
  ["yesterday", "Yesterday", "time", "Sign YESTERDAY.", "Show the movement from cheek toward shoulder with clear start and finish.", "movement"],
  ["now", "Now", "time", "Sign NOW.", "Keep both hands visible and move downward together.", "movement"],
  ["time", "Time", "time", "Sign TIME.", "Keep the wrist or watch-area reference visible and finish cleanly.", "location"],
  ["after", "After", "time", "Sign AFTER.", "Keep the movement away from the starting hand visible and centered.", "movement"],
  ["before", "Before", "time", "Sign BEFORE.", "Keep the movement direction clear and avoid drifting out of frame.", "movement"],
  ["later", "Later", "time", "Sign LATER.", "Keep the delayed-time movement compact and hold the final position briefly.", "timing"],
  ["mom", "Mom", "family", "Sign MOM.", "Place the open hand near the chin area and keep thumb contact visible.", "location"],
  ["dad", "Dad", "family", "Sign DAD.", "Place the open hand near the forehead area and keep thumb contact visible.", "location"],
  ["brother", "Brother", "family", "Sign BROTHER.", "Keep the handshape near the forehead and finish at the base hand.", "movement"],
  ["aunt", "Aunt", "family", "Sign AUNT.", "Keep the handshape near the face and make the small movement visible.", "location"],
  ["uncle", "Uncle", "family", "Sign UNCLE.", "Keep the handshape near the face and avoid covering the movement.", "location"],
  ["grandma", "Grandma", "family", "Sign GRANDMA.", "Start near the chin and keep the outward movement visible.", "movement"],
  ["grandpa", "Grandpa", "family", "Sign GRANDPA.", "Start near the forehead and keep the outward movement visible.", "movement"],
  ["boy", "Boy", "people", "Sign BOY.", "Keep the forehead-area hand movement visible and hold the finish briefly.", "location"],
  ["girl", "Girl", "people", "Sign GIRL.", "Keep the face-side movement visible and centered for the camera.", "location"],
  ["child", "Child", "people", "Sign CHILD.", "Keep the hand height and downward reference movement visible.", "location"],
  ["man", "Man", "people", "Sign MAN.", "Show the forehead-to-chest movement clearly.", "movement"],
  ["person", "Person", "people", "Sign PERSON.", "Keep both hands vertical and move downward together.", "orientation"],
  ["happy", "Happy", "feelings", "Sign HAPPY.", "Keep the chest-level movement smooth and both hands visible if using two hands.", "movement"],
  ["sad", "Sad", "feelings", "Sign SAD.", "Keep the downward motion near the face visible and controlled.", "movement"],
  ["sick", "Sick", "feelings", "Sign SICK.", "Keep the hand placements near forehead and stomach visible.", "location"],
  ["fine", "Fine", "feelings", "Sign FINE.", "Keep the hand near the chest and show a clear outward movement.", "movement"],
  ["mad", "Mad", "feelings", "Sign MAD.", "Keep the face-area handshape visible and make the emotion movement clear.", "handshape"],
  ["bad", "Bad", "feelings", "Sign BAD.", "Keep the palm change and outward movement visible in the camera frame.", "movement"],
  ["hot", "Hot", "feelings", "Sign HOT.", "Keep the face-side start and outward finish visible.", "movement"],
  ["hungry", "Hungry", "feelings", "Sign HUNGRY.", "Keep the chest or torso movement centered and easy to see.", "location"],
  ["thirsty", "Thirsty", "feelings", "Sign THIRSTY.", "Keep the throat-side movement visible and avoid covering the handshape.", "location"],
  ["food", "Food", "food", "Sign FOOD.", "Keep the fingertips near the mouth visible and repeat the motion clearly.", "handshape"],
  ["drink", "Drink", "food", "Sign DRINK.", "Use the cup handshape and tilt it toward the mouth area.", "orientation"],
  ["water", "Water", "food", "Sign WATER.", "Use the W handshape and keep the chin contact visible.", "handshape"],
  ["milk", "Milk", "food", "Sign MILK.", "Use the opening and closing handshape with a steady rhythm.", "handshape"],
  ["apple", "Apple", "food", "Sign APPLE.", "Keep the knuckle/cheek location visible and rotate clearly.", "location"],
  ["carrot", "Carrot", "food", "Sign CARROT.", "Keep the handshape and mouth-area movement visible.", "handshape"],
  ["cereal", "Cereal", "food", "Sign CEREAL.", "Keep the spoon-like movement centered and visible near the mouth.", "movement"],
  ["red", "Red", "colors", "Sign RED.", "Keep the finger movement near the chin/lips visible.", "location"],
  ["blue", "Blue", "colors", "Sign BLUE.", "Use the B handshape and shake it slightly in clear view.", "handshape"],
  ["green", "Green", "colors", "Sign GREEN.", "Use the G handshape and keep the small shake visible.", "handshape"],
  ["yellow", "Yellow", "colors", "Sign YELLOW.", "Use the Y handshape and keep the small shake visible.", "handshape"],
  ["black", "Black", "colors", "Sign BLACK.", "Move the index finger across the forehead area clearly.", "movement"],
  ["white", "White", "colors", "Sign WHITE.", "Start at the chest and pull the hand outward with a clear finish.", "movement"],
  ["orange", "Orange", "colors", "Sign ORANGE.", "Keep the handshape near the mouth visible and use a steady squeeze motion.", "handshape"],
  ["brown", "Brown", "colors", "Sign BROWN.", "Keep the handshape and face-side movement visible.", "handshape"],
  ["animal", "Animal", "animals", "Sign ANIMAL.", "Keep both hands near the torso and make the repeated movement clear.", "movement"],
  ["cat", "Cat", "animals", "Sign CAT.", "Keep the whisker-like movement near the face visible.", "movement"],
  ["dog", "Dog", "animals", "Sign DOG.", "Keep the movement centered and visible through the full sign.", "movement"],
  ["bird", "Bird", "animals", "Sign BIRD.", "Keep the beak handshape near the face visible.", "handshape"],
  ["fish", "Fish", "animals", "Sign FISH.", "Keep the hand flat and show the swimming movement clearly.", "movement"],
  ["frog", "Frog", "animals", "Sign FROG.", "Keep the handshape near the chin visible and make the movement distinct.", "handshape"],
  ["horse", "Horse", "animals", "Sign HORSE.", "Keep the handshape near the head visible and repeat the motion clearly.", "handshape"],
  ["car", "Car", "transportation", "Sign CAR.", "Keep both hands visible and show the steering movement clearly.", "movement"],
  ["airplane", "Airplane", "transportation", "Sign AIRPLANE.", "Keep the airplane handshape visible and move it through the frame.", "movement"],
  ["tv", "TV", "objects", "Sign TV.", "Keep the letters or handshape changes centered and easy to see.", "handshape"],
  ["call_on_phone", "Call on phone", "objects", "Sign CALL ON PHONE.", "Keep the phone handshape near the ear or cheek visible.", "location"],
  ["hat", "Hat", "objects", "Sign HAT.", "Keep the head-side hand placement visible and hold the finish briefly.", "location"],
  ["shoe", "Shoe", "objects", "Sign SHOE.", "Keep both hands visible and show the repeated contact clearly.", "handshape"],
  ["all", "All", "concepts", "Sign ALL.", "Keep both hands visible and make the circular movement easy to follow.", "movement"],
  ["another", "Another", "concepts", "Sign ANOTHER.", "Keep the directional movement compact and centered.", "movement"],
  ["any", "Any", "concepts", "Sign ANY.", "Keep the handshape visible and avoid drifting outside the signing space.", "orientation"],
  ["every", "Every", "concepts", "Sign EVERY.", "Keep the repeated movement steady and visible.", "timing"],
  ["make", "Make", "actions", "Sign MAKE.", "Keep both hands visible and show the twisting movement clearly.", "movement"],
  ["find", "Find", "actions", "Sign FIND.", "Keep the handshape and closing movement visible in the center of frame.", "handshape"],
  ["give", "Give", "actions", "Sign GIVE.", "Keep both hands visible and make the outward movement distinct.", "movement"],
  ["see", "See", "actions", "Sign SEE.", "Keep the eye-side start and forward movement visible.", "location"],
  ["look", "Look", "actions", "Sign LOOK.", "Keep the face-side handshape visible and direct the movement clearly.", "orientation"],
  ["listen", "Listen", "actions", "Sign LISTEN.", "Keep the ear-side location visible and hold the handshape briefly.", "location"],
  ["talk", "Talk", "actions", "Sign TALK.", "Keep both hands near the mouth visible and use a steady rhythm.", "timing"],
  ["say", "Say", "actions", "Sign SAY.", "Keep the mouth-side movement visible and finish cleanly.", "movement"],
  ["think", "Think", "actions", "Sign THINK.", "Keep the forehead-side touch or location visible.", "location"],
  ["open", "Open", "actions", "Sign OPEN.", "Keep both hands visible and make the opening movement clear.", "movement"],
];

export const VOCABULARY: VocabularyItem[] = VOCABULARY_SEEDS.map(
  ([
    id,
    label,
    category,
    prompt,
    coachingHint,
    hintKind,
  ]): VocabularyItem => ({
    id,
    label,
    category,
    prompt,
    coachingHint,
    hintKind,
    reviewStatus: "source_curated",
  }),
);

export const VOCABULARY_COUNT = VOCABULARY.length;

export function getVocabularyItem(id: string): VocabularyItem | undefined {
  return VOCABULARY.find((item) => item.id === id);
}

export function getNextVocabularyItem(currentId: string): VocabularyItem {
  const index = VOCABULARY.findIndex((item) => item.id === currentId);
  return VOCABULARY[(index + 1) % VOCABULARY.length];
}
