# Superbuilders Partner Project - ASL Learning with Computer Vision

Source PDF: `superbuilders-partner-project-asl-learning-with-computer-vision.pdf`

Source PDF SHA-256: `ae0604d350d3cc4043d8d740abe828ba889bdf88e3b7fe40d5dae275de07171a`

Extraction method: PyMuPDF (`pymupdf`) in the local `.venv`, using `page.get_text("text")`. The PDF is five pages and was generated from a browser printout on May 18, 2026.

## Page 1

# Superbuilders Partner Project - ASL Learning with Computer Vision

## 1. Product Overview

Superbuilders Partner Project - ASL Learning with Computer Vision is a browser-based American Sign Language learning application for college ASL 1 learners. The application presents a beginner vocabulary word on screen, asks the learner to sign the concept using their computer camera, and uses a computer vision model to evaluate the attempt. The learner receives an immediate pass/fail result and, when the attempt is incorrect, a targeted hint to support improvement.

The goal is to build a controlled production pilot, not a full public product or research-grade assessment system. The pilot must be usable enough for structured learner testing while keeping the model scope, pedagogy, and privacy expectations realistic.

## 2. Target Users

Primary users are college students enrolled in an introductory ASL 1 course or equivalent beginner learning environment.

The application should assume learners are new to ASL and need repeated practice, clear feedback, and progress tracking. The app should not assume the learner already understands sign linguistics, model confidence, or computer vision limitations.

## 3. Core Learning Flow

1. The learner logs into the web application.
2. The learner begins a vocabulary practice session.
3. A beginner ASL vocabulary prompt appears on screen.
4. The learner grants camera access.
5. The learner signs the prompted concept.
6. The computer vision system evaluates the signing attempt.
7. The application returns a pass/fail result.
8. If the learner fails, the application provides a targeted hint.
9. The learner can retry the sign.
10. The application saves learner progress over time.

## Page 2

## 4. Required Pilot Scope

The following items are required for the pilot submission.

### Requirement 1: ASL-Only Pilot

The application must support American Sign Language only. The pilot must not attempt to support British Sign Language, other signed languages, or automatic translation between signed languages.

### Requirement 2: Beginner Vocabulary Recognition

The application must support isolated beginner ASL vocabulary signs. The pilot must include 75-100 beginner vocabulary items appropriate for ASL 1 learners.

The pilot must not attempt full sentence recognition, conversational ASL interpretation, open-ended signing, or phrase-level translation.

### Requirement 3: Browser-Based Application

The application must run as a web browser app. Learners must be able to use the application through a modern browser on a computer with camera access.

### Requirement 4: Camera Access

The application must request access to the learner's computer camera and use the live camera feed to capture signing attempts.

The application must clearly handle cases where camera access is denied, unavailable, or technically unsupported.

### Requirement 5: Browser-First Computer Vision Inference

The default pilot implementation must run sign recognition in the browser. Camera frames should stay local during normal practice sessions.

The architecture may include an interface that allows future server-side inference, but server-side inference is not required for the pilot.

### Requirement 6: Engineer-Owned Dataset and Model Training

The engineering team must be responsible for curating or collecting the dataset used to train the sign recognition model.

The project must include a model training process, validation process, and model versioning strategy.

Engineers must not treat the model as a black-box dependency only.

## Page 3

### Requirement 7: No Pretrained Models

Participants are not allowed to use pretrained models for the computer vision or sign recognition system. This restriction includes pretrained sign language classifiers, pretrained hand or pose landmark detectors, pretrained feature extractors, and pretrained general-purpose computer vision backbones.

Participants may use programming frameworks, data processing libraries, and machine learning libraries, but the model architecture and weights used for recognition must be trained by the team for this project.

### Requirement 8: Controlled Pilot Quality

The model must meet controlled pilot quality criteria. This means the team must define and document:

- Supported camera and lighting conditions
- Expected signing distance and body framing
- A held-out validation set
- Recognition accuracy targets
- Confidence thresholds for pass/fail decisions
- Known limitations and failure cases

The pilot is not required to be classroom-assessment-grade, research-grade, or reliable across all real-world environments.

### Requirement 9: Pass/Fail Evaluation

For each prompted vocabulary sign, the computer vision model must return a pass or fail result based on the learner's attempt.

The pass/fail decision must use documented confidence thresholds and must avoid marking uncertain predictions as correct.

### Requirement 10: Targeted Pedagogical Hints

When a learner fails an attempt, the application must provide a targeted hint instead of only saying "incorrect."

Hints should be tied to observable or teachable aspects of the expected sign, such as handshape, movement, location, orientation, timing, or camera framing. Hints may be rule-based in the pilot.

### Requirement 11: Learner Accounts

The pilot must include learner accounts. Learners must be able to log in and return to their saved practice history.

The pilot does not require teacher accounts, administrator dashboards, classroom rostering, or single sign-on integration.

## Page 4

### Requirement 12: Saved Progress

The application must save learner progress over time. At minimum, the system should track:

- Vocabulary items attempted
- Pass/fail outcomes
- Number of attempts
- Current mastery or completion status
- Recent practice history

### Requirement 13: Privacy-Conscious Video Handling

Raw video must not be uploaded by default during normal practice sessions. Camera input should be processed locally in the browser for the pilot.

If future data collection is proposed, it must require explicit learner consent and must be documented separately from the default pilot behavior.

### Requirement 14: Web App Usability

The learner experience must be simple enough for a beginner to use without technical assistance. The practice screen must clearly show the prompt, camera preview, attempt state, result, hint, and retry or next action.

### Requirement 15: Pilot Documentation

The final submission must document the product scope, model approach, dataset approach, validation criteria, privacy assumptions, known limitations, and evidence that pretrained models were not used.

## 5. Out of Scope for Pilot

The following features are intentionally out of scope:

- Multi-language sign support
- Full ASL conversation recognition
- Sentence or phrase translation
- Teacher or administrator portal
- Classroom rostering
- SSO integrations such as Google Classroom or Clever
- Server-side video inference as the default recognition path
- Uploading raw learner video by default
- Pretrained computer vision models, pretrained sign recognition models, pretrained landmark detectors, or pretrained feature extractors
- Research-grade bias analysis or formal published-study validation

## Page 5

- Production-scale public deployment

## 6. Success Criteria

The pilot is successful if:

- A learner can create an account, log in, and complete a browser-based ASL vocabulary practice session.
- The app can prompt 75-100 beginner ASL vocabulary signs.
- The learner can grant camera access and submit signing attempts.
- The computer vision model can return pass/fail feedback under documented controlled conditions.
- Incorrect attempts receive targeted hints.
- Learner progress is saved and visible across sessions.
- The team can explain how the model was trained from scratch, validated, versioned, and limited.
- Raw video remains local during normal pilot use.

## 7. Final Deliverables

The engineering team must submit:

1. A working browser-based ASL learning application.
2. A trained sign recognition model for 75-100 beginner ASL vocabulary signs.
3. A documented dataset and model training process showing that no pretrained models were used.
4. A validation report with accuracy targets, test conditions, and known limitations.
5. A learner account and progress-tracking system.
6. A practice interface with camera access, pass/fail feedback, targeted hints, retry behavior, and saved progress.
7. Privacy documentation explaining how camera/video data is handled.
