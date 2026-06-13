# Final Validation Report Template

## summary

- promoted model artifact:
- model version:
- active labels:
- content vocabulary count:
- recognition coverage claim:
- controlled conditions:

## controlled conditions

- camera type:
- browser:
- lighting:
- signing distance:
- body framing:
- background:
- fps/window length:

## dataset and split

- sources:
- split method:
- signer/session disjoint:
- train/val/test counts:
- excluded sources/labels:

## metrics

| metric | value | gate | status |
|---|---:|---:|---|
| macro recall | | | |
| top-1 accuracy | | | |
| top-3 recall | | | |
| hard-negative FAR | | <=0.05 target | |
| zero-accepted true classes | | 0 target | |
| browser latency p50 | | | |
| browser latency p95 | | | |

## thresholds

- per-class threshold file:
- margin threshold:
- entropy threshold:
- capture quality gates:

## known limitations

- active labels vs content-only labels:
- camera/framing limitations:
- lighting limitations:
- signer diversity limitations:
- signs commonly confused:

## evidence files

- `docs/validation/abstention-calibration.json`
- `docs/validation/hard-negative-report.json`
- `docs/validation/browser-latency-report.json`
- `docs/validation/no-pretrained-lane-audit.json`
- `docs/model/final-model-card.md`
- `docs/validation/final-claim-matrix.json`
