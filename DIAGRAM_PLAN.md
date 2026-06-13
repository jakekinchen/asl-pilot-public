# DIAGRAM_PLAN

## Diagram 1 — Learner practice flow

Purpose: prove the required user journey.

Must show:

```text
login -> start session -> prompt -> camera permission -> capture -> inference -> pass/fail -> hint -> retry/next -> progress saved
```

Architecture anchors:

- `ARCHITECTURE.md#arch-product-scope`
- `ARCHITECTURE.md#arch-learner-flow`
- `ARCHITECTURE.md#arch-accounts-progress`

## Diagram 2 — Browser privacy boundary

Purpose: prove raw video stays local.

Must show:

```text
camera frames -> browser frame window -> inference engine -> decision/hint -> progress metadata only -> database
```

Architecture anchors:

- `ARCHITECTURE.md#arch-camera-privacy`
- `ARCHITECTURE.md#arch-persistence`

## Diagram 3 — Model/data pipeline

Purpose: prove scratch model training and provenance gates.

Must show:

```text
source access -> rights matrix -> subset manifest -> frame decode -> crops -> smoke run -> training -> validation -> thresholds -> ONNX/export -> browser manifest
```

Architecture anchors:

- `ARCHITECTURE.md#arch-no-pretrained`
- `ARCHITECTURE.md#arch-data-provenance`
- `ARCHITECTURE.md#arch-training-pipeline`

## Diagram 4 — Active module vs full vocabulary

Purpose: avoid dishonest recognition claims.

Must show:

```text
100 content vocabulary items -> active sign module subset -> model labels -> UI recognition gate
```

Architecture anchors:

- `ARCHITECTURE.md#arch-active-module`
- `ARCHITECTURE.md#arch-downscope-ladder`

## Diagram 5 — Pass/fail decision gates

Purpose: make abstention explainable.

Must show:

```text
inference result -> active label check -> confidence threshold -> margin -> entropy -> capture quality -> hard-negative -> pass/fail + reason -> hint
```

Architecture anchors:

- `ARCHITECTURE.md#arch-passfail-thresholds`
- `ARCHITECTURE.md#arch-postprocess`
- `ARCHITECTURE.md#arch-vocab-hints`

## Diagram 6 — 48-hour execution timeline

Purpose: coordinate parallel work.

Must show:

```text
H0-H3 local gates
H3-H6 Brev setup
H6-H24 parallel M3/M4/M5
H24-H32 collect/choose
H32-H40 thresholds/hard negatives
H40-H46 export/browser
H46-H48 final audit
```

Architecture anchors:

- `ARCHITECTURE.md#arch-training-pipeline`
- `ARCHITECTURE.md#arch-downscope-ladder`
