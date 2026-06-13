# Requirements Matrix

Every item below is sourced from `docs/source-materials/pdf-extracted-text.md`.

Source PDF SHA-256: `ae0604d350d3cc4043d8d740abe828ba889bdf88e3b7fe40d5dae275de07171a`

| ID | Requirement | Evidence |
| --- | --- | --- |
| R1 | Build a browser-based American Sign Language learning app. | Page 1, Product Overview |
| R2 | Target college ASL 1 or equivalent beginner learners. | Page 1, Target Users |
| R3 | Assume new learners need repeated practice, clear feedback, and progress tracking. | Page 1, Target Users |
| R4 | Do not assume learners understand sign linguistics, model confidence, or CV limitations. | Page 1, Target Users |
| R5 | Build a controlled production pilot, not a full public product or research-grade assessment system. | Page 1, Product Overview |
| R40 | Pilot must be usable enough for structured learner testing while keeping model scope, pedagogy, and privacy expectations realistic. | Page 1, Product Overview |
| R6 | Core flow includes login, practice, prompt, camera permission, signing attempt, CV evaluation, pass/fail, hint, retry, and saved progress. | Page 1, Core Learning Flow |
| R7 | Support American Sign Language only. | Page 2, Requirement 1 |
| R8 | Do not support BSL, other signed languages, or automatic translation between signed languages. | Page 2, Requirement 1 |
| R9 | Support isolated beginner ASL vocabulary signs. | Page 2, Requirement 2 |
| R10 | Include 75-100 beginner vocabulary items appropriate for ASL 1 learners. | Page 2, Requirement 2; Page 5, Success Criteria and Final Deliverables |
| R11 | Do not attempt full sentence recognition, conversational interpretation, open-ended signing, or phrase-level translation. | Page 2, Requirement 2; Page 4, Out of Scope |
| R12 | Run as a modern web browser app on a computer with camera access. | Page 2, Requirement 3 |
| R13 | Request learner camera access and use live camera feed for signing attempts. | Page 2, Requirement 4 |
| R14 | Handle denied, unavailable, or unsupported camera access. | Page 2, Requirement 4 |
| R15 | Default sign recognition runs in the browser. | Page 2, Requirement 5 |
| R16 | Camera frames stay local during normal practice sessions. | Page 2, Requirement 5; Page 4, Requirement 13 |
| R17 | Future server-side inference interface may exist, but server-side inference is not required and not the default path. | Page 2, Requirement 5; Page 4, Out of Scope |
| R18 | Engineering team curates or collects the dataset used to train the model. | Page 2, Requirement 6 |
| R19 | Include model training process, validation process, and model versioning strategy. | Page 2, Requirement 6 |
| R20 | Do not treat the model as only a black-box dependency. | Page 2, Requirement 6 |
| R21 | Do not use pretrained models for CV or sign recognition. | Page 3, Requirement 7 |
| R22 | Do not use pretrained sign classifiers, hand/pose landmark detectors, feature extractors, or general-purpose CV backbones. | Page 3, Requirement 7 |
| R23 | Programming frameworks, data processing libraries, and ML libraries are allowed; architecture and weights must be trained by the team. | Page 3, Requirement 7 |
| R24 | Define and document controlled pilot quality: camera/lighting, distance/framing, held-out validation, accuracy targets, thresholds, limitations. | Page 3, Requirement 8 |
| R25 | Pilot need not be classroom-assessment-grade, research-grade, or reliable across all real-world environments. | Page 3, Requirement 8 |
| R26 | For each prompted sign, return pass/fail based on learner attempt. | Page 3, Requirement 9 |
| R27 | Use documented confidence thresholds and avoid marking uncertain predictions correct. | Page 3, Requirement 9 |
| R28 | Failed attempts receive targeted hints, not only "incorrect." | Page 3, Requirement 10 |
| R29 | Hints relate to observable or teachable aspects: handshape, movement, location, orientation, timing, or framing. | Page 3, Requirement 10 |
| R30 | Include learner accounts with login and saved practice history across sessions. | Page 3, Requirement 11 |
| R31 | Teacher/admin accounts, rostering, and SSO are out of scope. | Page 3, Requirement 11; Page 4, Out of Scope |
| R32 | Save learner progress over time. | Page 4, Requirement 12 |
| R33 | Track vocabulary attempted, pass/fail outcomes, attempt counts, mastery/completion status, and recent history. | Page 4, Requirement 12 |
| R34 | Do not upload raw video by default. | Page 4, Requirement 13 |
| R35 | Future data collection requires explicit consent and separate documentation. | Page 4, Requirement 13 |
| R36 | UX must be simple enough for beginners without technical assistance. | Page 4, Requirement 14 |
| R37 | Practice screen shows prompt, camera preview, attempt state, result, hint, retry, and next action. | Page 4, Requirement 14 |
| R38 | Final docs cover product scope, model approach, dataset approach, validation criteria, privacy assumptions, limitations, and no-pretrained evidence. | Page 4, Requirement 15 |
| R39 | Production-scale public deployment is out of scope for the pilot. | Page 5, Out of Scope for Pilot |
| D1 | Submit working browser-based ASL learning application. | Page 5, Final Deliverables |
| D2 | Submit trained sign recognition model for 75-100 beginner ASL vocabulary signs. | Page 5, Final Deliverables |
| D3 | Submit documented dataset and model training process showing no pretrained models were used. | Page 5, Final Deliverables |
| D4 | Submit validation report with accuracy targets, test conditions, and known limitations. | Page 5, Final Deliverables |
| D5 | Submit learner account and progress-tracking system. | Page 5, Final Deliverables |
| D6 | Submit practice interface with camera access, pass/fail feedback, targeted hints, retry behavior, and saved progress. | Page 5, Final Deliverables |
| D7 | Submit privacy documentation explaining camera/video handling. | Page 5, Final Deliverables |

## Acceptance Notes

- The no-pretrained rule rules out MediaPipe Hands, MediaPipe Gesture Recognizer, YOLO-derived boxes, OpenPose, pretrained CNN backbones, and public sign-language classifiers as the recognition path.
- Public datasets can only be used after license review and team curation; they do not satisfy the assignment if the team treats their labels/modeling as a black box.
- The browser app may persist learner account/progress data server-side, but it must not send raw camera frames during normal practice.
