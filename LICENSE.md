# License

## Project

This is a **noncommercial academic / school project** by the repository author (`kelly@bloomtech.com`). The project is derived from the assignment brief `superbuilders-partner-project-asl-learning-with-computer-vision.pdf` and is intended for school-project submission and educational review.

## Rights status

- **All code, scripts, configs, docs, and validation artifacts** in this repository are © 2026 the repository author. **No license to redistribute, sublicense, or use commercially is granted by default.** Reviewers may read, run locally, and audit the repository as part of evaluating the school project; redistribution requires written permission from the author.
- **Vocabulary and hint content** in [`web/src/lib/vocabulary.ts`](web/src/lib/vocabulary.ts) and [`web/src/lib/sign-hint-metadata.json`](web/src/lib/sign-hint-metadata.json) is source-curated by the author from ASL 1 educational sources; see [`docs/review/final-vocabulary-review.json`](docs/review/final-vocabulary-review.json) `source_basis` for hash-pinned references. No external Deaf-educator or ASL-instructor approval is claimed; see [`docs/runbooks/vocabulary-reviewer-chain.md`](docs/runbooks/vocabulary-reviewer-chain.md) for the optional Ed25519-signed external-review workflow.
- **Signer data** (raw clips, identity evidence, consent receipts) collected via [`docs/runbooks/first-party-collection.md`](docs/runbooks/first-party-collection.md) is governed by [`docs/privacy/dataset-consent-form.md`](docs/privacy/dataset-consent-form.md). Such data is **never committed to this repository** in raw form and is **not licensed for redistribution** under any terms. The consent form is the controlling document for collected signer data.
- **Third-party dependencies** carry their own licenses; see `web/package.json` + `web/package-lock.json` + `requirements.txt` for the dependency list and each dependency's upstream license. The `audit_local_ml_environment` and `audit_source_register` chains hash-pin the dependency manifests.

## Trained-model status

At the time of this license text, the recognition lane is **not trained**. No trained model artifact is distributed by this repository. When training is completed, the model card at `web/public/model/model-card.json` will be flipped to `status: trained` via [`scripts/promote_trained_model_card.mjs`](scripts/promote_trained_model_card.mjs); any redistribution of the trained ONNX artifact is governed by this license (no grant by default).

## Hard constraints (mirror of [`CLAUDE.md`](CLAUDE.md))

- No pretrained CV/sign/landmark/model dependencies in the promoted lane ([`#arch-no-pretrained`](ARCHITECTURE.md#arch-no-pretrained)).
- No raw learner video upload during normal practice ([`#arch-camera-privacy`](ARCHITECTURE.md#arch-camera-privacy)).
- First-party consented data only for training; public ASL datasets are research references unless explicit rights review clears the exact use ([`#arch-data-provenance`](ARCHITECTURE.md#arch-data-provenance)).

## Contact

For redistribution permission, external-review commission, or any other license question: `kelly@bloomtech.com`.

## Acknowledgements

The source assignment brief is owned by its issuer (SuperBuilders / partner program); this project's derivation respects that brief's terms. The Anthropic Claude Code orchestrator + OpenAI Codex observer infrastructure used to author this code (see [`docs/autonomous-orchestrator-protocol.md`](docs/autonomous-orchestrator-protocol.md)) carries its own terms with each respective provider.

— end LICENSE.md —
