# Final Demo Pipeline Path

This diagram documents the final assignment-demo path for run10. It separates
offline supervision and training from the browser practice-feedback runtime.
The demo recognizer cleared the MVP verification gate, but it is still recorded
as demo evidence only: the public model-card and active vocabulary claim remain
fail-closed.

```mermaid
flowchart TB
  classDef data fill:#eff6ff,stroke:#2563eb,color:#0f172a
  classDef guard fill:#fff7ed,stroke:#ea580c,color:#431407
  classDef offline fill:#f5f3ff,stroke:#7c3aed,color:#2e1065
  classDef model fill:#ecfdf5,stroke:#059669,color:#052e16
  classDef runtime fill:#f0fdfa,stroke:#0f766e,color:#042f2e
  classDef boundary fill:#fef2f2,stroke:#dc2626,color:#450a0a

  subgraph Data["Source data and rights gates"]
    PopSign["PopSign ASL v1 raw videos<br/>CC BY 4.0; 95 classes"]:::data
    ASLCitizen["ASL Citizen raw videos<br/>school-assignment training only"]:::data
    Negatives["Validation-only negative videos<br/>not used for training"]:::data
    SourceRegister["Dataset source register<br/>rights, splits, attribution"]:::guard
  end

  subgraph Offline["Offline build and training"]
    Teacher["Offline teacher labels<br/>RTMPose-style hand keypoints<br/>supervision only"]:::offline
    SimCC["Scratch SimCC w48 hand student<br/>predicts hand coordinates"]:::model
    Extract["Sequence extraction cache<br/>T=32 frames; 90 features/frame<br/>330,309 rows from 10,335 clips"]:::offline
    Train["Run10 Transformer recognizer<br/>d256 / 6 layers / 8 heads<br/>240 epochs on Brev L40S"]:::model
    Thresholds["Monitor-fit FAR10 thresholds<br/>browser sidecar"]:::guard
  end

  subgraph Browser["Browser demo runtime"]
    Camera["Learner camera stays local<br/>no raw video upload"]:::runtime
    RegionGrid["Region grid and signing crop"]:::runtime
    Hands2["Scratch hands2 detector"]:::runtime
    BrowserSimCC["Scratch SimCC w48 ONNX"]:::runtime
    Features["90-dim sequence features"]:::runtime
    ONNX["recognizer-simccw48.onnx<br/>run10"]:::model
    Feedback["Practice feedback<br/>accept / retry hint"]:::runtime
  end

  subgraph Claims["Claim boundary"]
    DemoOnly["Assignment-demo evidence only<br/>practice feedback, not grading"]:::boundary
    NoPromotion["No product promotion<br/>model-card: not_trained<br/>activeLabels: empty"]:::boundary
  end

  PopSign --> SourceRegister
  ASLCitizen --> SourceRegister
  Negatives --> SourceRegister
  SourceRegister --> Teacher
  Teacher -.-> SimCC
  PopSign --> Extract
  ASLCitizen --> Extract
  SimCC --> Extract
  Extract --> Train
  Train --> Thresholds
  Train --> ONNX
  Thresholds --> Feedback

  Camera --> RegionGrid --> Hands2 --> BrowserSimCC --> Features --> ONNX --> Feedback

  Feedback --> DemoOnly --> NoPromotion
```

## Evidence Links

- Active demo decision: [`GOAL.md`](../../GOAL.md)
- Source rights and dataset boundaries: [`dataset-source-register.json`](dataset-source-register.json)
- Run10 training receipt: [`return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json`](../validation/return-to-form-m3jb-recognizer-transformer-run10-simccw48-fulltrain-v1.json)
- Run10 trust audit: [`return-to-form-m3jb-run10-trust-audit-v1.json`](../validation/return-to-form-m3jb-run10-trust-audit-v1.json)
- Near-live browser eval: [`return-to-form-m3jb-run10-heldout-nearlive-eval-v1.json`](../validation/return-to-form-m3jb-run10-heldout-nearlive-eval-v1.json)
- PopSign-only fallback / ablation: [`return-to-form-m3jb-run12-popsignonly-v1.json`](../validation/return-to-form-m3jb-run12-popsignonly-v1.json)

## Current Run10 Numbers

| measure | value |
|---|---:|
| Test verification recall at FAR10 | 0.9209 |
| Honest monitor-fit recall on test | 0.9087 |
| Honest realized FAR | 0.0880 |
| Test top-1 | 0.5428 |
| Test top-5 | 0.8261 |
| Near-live browser true accept | 33/40 |
| Near-live browser wrong-prompt accept | 6.1% |

## Boundary Notes

- RTMPose-style labels are offline supervision only. They are not browser
  runtime dependencies and are not shipped as the recognizer.
- The run10 recognizer is the assignment-demo artifact. It is not promoted
  through the rawframe product model-card path.
- ASL Citizen rows improved the run10 training signal but carry noncommercial
  school-assignment constraints. Run12 measures the PopSign-only recognizer
  fallback cost without swapping the deployed demo artifact.
