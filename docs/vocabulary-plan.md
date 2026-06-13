# Vocabulary Plan

## product requirement

The pilot must include 75-100 beginner ASL vocabulary items appropriate for ASL 1 learners.

## recognition honesty rule

A vocabulary item can be:

- `active`: model can evaluate it under current active module claim;
- `content_only`: app can prompt/teach it, but cannot pass/fail it;
- `disabled`: hidden or unavailable.

## seed files

- `configs/vocabulary_seed_100.csv` — candidate content list.
- `configs/active-sign-modules.example.json` — smoke/10/20 active module examples.
- `configs/sign-hints.example.json` — starter hint metadata.

## active module promotion gates

- source rights clear;
- data support available;
- train/val/test split viable;
- model metrics reported;
- thresholds calibrated;
- hard-negative behavior measured;
- browser manifest updated;
- final claim matrix updated.
