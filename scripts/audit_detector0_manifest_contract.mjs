import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const expectedTargetIds = [
  "left_or_first_hand",
  "right_or_second_hand",
  "head_or_face",
  "upper_body_or_signing_space",
];
const blockers = [];
const checks = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function addCheck(id, label, passed, evidence, blocker) {
  checks.push({
    id,
    label,
    status: passed ? "passed" : "failed",
    evidence,
  });
  if (!passed) blockers.push(blocker ?? `${label} failed`);
}

const detectorCard = readJson("web/public/model/detector0-card.json");
addCheck(
  "detector_card_identity",
  "Detector 0 card is a not-trained research-only scaffold",
  detectorCard.schema_version === "asl-pilot-detector0-card/v1"
    && detectorCard.status === "not_trained"
    && detectorCard.promotion_state === "research_only"
    && detectorCard.browser_artifact === null,
  {
    schema_version: detectorCard.schema_version,
    status: detectorCard.status,
    promotion_state: detectorCard.promotion_state,
    browser_artifact: detectorCard.browser_artifact,
  },
  "detector0-card must be not_trained, research_only, and have no browser artifact",
);
addCheck(
  "detector_targets",
  "Detector 0 target ids match the return-to-form target contract",
  JSON.stringify(detectorCard.target_ids) === JSON.stringify(expectedTargetIds),
  { target_ids: detectorCard.target_ids },
  "detector0-card target_ids do not match the expected contract",
);
addCheck(
  "detector_no_pretrained_components",
  "Detector 0 card declares no pretrained components",
  Array.isArray(detectorCard.architecture?.pretrained_components)
    && detectorCard.architecture.pretrained_components.length === 0,
  { pretrained_components: detectorCard.architecture?.pretrained_components },
  "detector0-card architecture.pretrained_components must be an empty array",
);
addCheck(
  "detector_runtime_gates",
  "Detector 0 runtime gates are all disabled",
  detectorCard.runtime_gates?.detector0_tracking === false
    && detectorCard.runtime_gates?.box_driven_avatar === false
    && detectorCard.runtime_gates?.recognition_pass_fail === false,
  detectorCard.runtime_gates ?? {},
  "detector0-card runtime gates must remain false",
);

const bundle = readJson("web/public/model/browser-model-bundle.json");
addCheck(
  "bundle_schema",
  "Browser bundle schema and paths are anchored to current model manifests",
  bundle.schema_version === "asl-pilot-browser-model-bundle/v1"
    && bundle.recognition?.model_card_path === "/model/model-card.json"
    && bundle.detector0_tracking?.detector_card_path === "/model/detector0-card.json",
  {
    schema_version: bundle.schema_version,
    model_card_path: bundle.recognition?.model_card_path,
    detector_card_path: bundle.detector0_tracking?.detector_card_path,
  },
  "browser-model-bundle schema or model paths are invalid",
);
addCheck(
  "bundle_fail_closed",
  "Browser bundle disables recognition, detector tracking, box-driven avatar, and authored demos",
  bundle.recognition?.enabled === false
    && bundle.recognition?.model_status === "not_trained"
    && bundle.detector0_tracking?.enabled === false
    && bundle.detector0_tracking?.promotion_state === "research_only"
    && bundle.detector0_tracking?.browser_artifact === null
    && bundle.box_driven_avatar?.enabled === false
    && bundle.authored_avatar_demos?.enabled === false
    && bundle.authored_avatar_demos?.reviewed_clip_count === 0,
  {
    recognition: bundle.recognition,
    detector0_tracking: bundle.detector0_tracking,
    box_driven_avatar: bundle.box_driven_avatar,
    authored_avatar_demos: bundle.authored_avatar_demos,
  },
  "browser-model-bundle must remain fail-closed while no promoted artifacts exist",
);

const detectorTypes = read("web/src/lib/detector0-types.ts");
for (const targetId of expectedTargetIds) {
  addCheck(
    `detector_type_${targetId}`,
    `Detector type source includes ${targetId}`,
    detectorTypes.includes(`"${targetId}"`),
    { targetId },
    `detector0-types.ts is missing ${targetId}`,
  );
}
addCheck(
  "detector_engine_fail_closed",
  "Detector 0 engine stub cannot fabricate browser outputs",
  read("web/src/lib/detector0-engine.ts").includes("Detector 0 has no promoted browser artifact.")
    && read("web/src/lib/detector0-engine.ts").includes("canDriveAvatar: false"),
  {},
  "detector0-engine must throw fail-closed and deny avatar driving",
);

const summary = {
  status: blockers.length === 0 ? "passed" : "failed",
  checked_at: new Date().toISOString(),
  checks,
  blockers,
};
console.log(JSON.stringify(summary, null, 2));

if (blockers.length > 0) {
  console.error("Detector 0 manifest contract audit failed:");
  for (const blocker of blockers) console.error(`- ${blocker}`);
  process.exit(1);
}
