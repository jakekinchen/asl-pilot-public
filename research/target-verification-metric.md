# Target-Verification Metric

The pilot UX is guided: "practice THIS word -> did you get it?" That makes the
primary metric a binary target-verification gate, not open-vocabulary top-k.

For each test clip with true label `t`, the system verifies the already-known
target `t`. It accepts the attempt when `softmax(t) >= tau`.

False accepts are measured as wrong-prompt attempts: for each clip, every
non-target word `w != t` is evaluated, and FAR is the fraction where
`softmax(w) >= tau`.

## Command

CPU-only evaluation:

```sh
PYTHONDONTWRITEBYTECODE=1 /Users/kelly/Developer/asl-pilot/.venv/bin/python \
  tools/detector0-annotator/eval_target_verification.py --device cpu
```

Inputs:

- Checkpoint: `tools/detector0-annotator/output/recognizer-v4-w64.pt`
- Sequence data: `tools/detector0-annotator/.cache/recog-seq-w64-merged`
- Test clips: 2,369
- Classes: 95
- Sequence length: 20 frames
- Feature width: 90

## Headline Results

| metric | tau | recall / top-k | actual FAR |
|---|---:|---:|---:|
| target verification @ FAR<=10% | 0.00043080 | 0.6707 | 0.1000 |
| target verification @ FAR<=5% | 0.00534033 | 0.5167 | 0.0500 |
| top-1 reference | n/a | 0.2081 | n/a |
| top-5 reference | n/a | 0.5226 | n/a |

Interpretation: with a known prompted target and the v4 runtime-landmark
recognizer, the current model accepts 67.1% of true attempts at a 10.0% wrong
prompt false-accept rate. At a stricter 5.0% false-accept rate, true accept
recall is 51.7%.

Top-k is still useful as a classifier sanity check, but target verification is
the pilot gate because the app already knows the requested practice word.

## Per-Word Recall At FAR10

Global tau: `0.00043080`. FAR is global over wrong prompt attempts; per-word
recall is the fraction of true clips for that word accepted at this tau.

| word | test clips | recall@FAR10 | mean p(target) | median p(target) |
|---|---:|---:|---:|---:|
| thankyou | 25 | 0.9600 | 0.4734 | 0.3236 |
| hello | 25 | 0.9200 | 0.3313 | 0.0205 |
| man | 25 | 0.9200 | 0.5828 | 0.7312 |
| red | 25 | 0.9200 | 0.2004 | 0.0252 |
| dad | 25 | 0.8800 | 0.2808 | 0.0915 |
| fish | 25 | 0.8800 | 0.4435 | 0.2823 |
| hat | 25 | 0.8800 | 0.4030 | 0.1905 |
| please | 25 | 0.8800 | 0.2681 | 0.1964 |
| sad | 25 | 0.8800 | 0.4968 | 0.6619 |
| table | 25 | 0.8800 | 0.4811 | 0.4876 |
| time | 25 | 0.8800 | 0.2703 | 0.0516 |
| no | 25 | 0.8400 | 0.2235 | 0.0282 |
| yesterday | 25 | 0.8400 | 0.2678 | 0.0364 |
| all | 25 | 0.8000 | 0.2121 | 0.0359 |
| apple | 25 | 0.8000 | 0.2788 | 0.0213 |
| black | 25 | 0.8000 | 0.3309 | 0.1265 |
| can | 25 | 0.8000 | 0.2794 | 0.0483 |
| drink | 25 | 0.8000 | 0.2557 | 0.0376 |
| fine | 25 | 0.8000 | 0.4207 | 0.1582 |
| hungry | 25 | 0.8000 | 0.2521 | 0.0212 |
| not | 25 | 0.8000 | 0.2361 | 0.0836 |
| water | 25 | 0.8000 | 0.1148 | 0.0178 |
| blue | 25 | 0.7600 | 0.1553 | 0.0130 |
| boy | 25 | 0.7600 | 0.1179 | 0.0065 |
| frog | 25 | 0.7600 | 0.3790 | 0.1685 |
| later | 25 | 0.7600 | 0.2440 | 0.0243 |
| mad | 25 | 0.7600 | 0.1790 | 0.0079 |
| room | 25 | 0.7600 | 0.4758 | 0.3991 |
| animal | 25 | 0.7200 | 0.1303 | 0.0215 |
| another | 25 | 0.7200 | 0.4319 | 0.1684 |
| any | 25 | 0.7200 | 0.2031 | 0.0106 |
| bed | 25 | 0.7200 | 0.2900 | 0.0443 |
| bye | 25 | 0.7200 | 0.1469 | 0.0154 |
| go | 25 | 0.7200 | 0.0884 | 0.0043 |
| grandma | 25 | 0.7200 | 0.1996 | 0.0133 |
| grandpa | 25 | 0.7200 | 0.2200 | 0.0201 |
| home | 25 | 0.7200 | 0.2803 | 0.0271 |
| horse | 25 | 0.7200 | 0.3310 | 0.0351 |
| look | 25 | 0.7200 | 0.0902 | 0.0055 |
| tomorrow | 25 | 0.7200 | 0.1848 | 0.0054 |
| uncle | 25 | 0.7200 | 0.2610 | 0.0186 |
| why | 25 | 0.7200 | 0.2802 | 0.0091 |
| TV | 25 | 0.6800 | 0.2997 | 0.0204 |
| bad | 25 | 0.6800 | 0.1480 | 0.0218 |
| chair | 25 | 0.6800 | 0.1872 | 0.0277 |
| make | 25 | 0.6800 | 0.2113 | 0.0192 |
| open | 25 | 0.6800 | 0.2287 | 0.0036 |
| talk | 25 | 0.6800 | 0.2084 | 0.0028 |
| think | 25 | 0.6800 | 0.1582 | 0.0128 |
| where | 25 | 0.6800 | 0.1295 | 0.0108 |
| aunt | 25 | 0.6400 | 0.0443 | 0.0010 |
| bird | 25 | 0.6400 | 0.2832 | 0.0138 |
| find | 25 | 0.6400 | 0.1387 | 0.0095 |
| happy | 25 | 0.6400 | 0.1856 | 0.0106 |
| like | 25 | 0.6400 | 0.1126 | 0.0017 |
| mom | 25 | 0.6400 | 0.1768 | 0.0074 |
| read | 25 | 0.6400 | 0.0838 | 0.0013 |
| say | 25 | 0.6400 | 0.0712 | 0.0044 |
| shoe | 25 | 0.6400 | 0.1092 | 0.0049 |
| before | 25 | 0.6000 | 0.1545 | 0.0078 |
| brother | 25 | 0.6000 | 0.3104 | 0.0025 |
| callonphone | 25 | 0.6000 | 0.1165 | 0.0048 |
| cat | 25 | 0.6000 | 0.0381 | 0.0012 |
| cereal | 25 | 0.6000 | 0.0730 | 0.0012 |
| every | 25 | 0.6000 | 0.1648 | 0.0010 |
| girl | 25 | 0.6000 | 0.1228 | 0.0014 |
| give | 25 | 0.6000 | 0.0666 | 0.0009 |
| have | 25 | 0.6000 | 0.1144 | 0.0050 |
| milk | 25 | 0.6000 | 0.1100 | 0.0023 |
| morning | 25 | 0.6000 | 0.0741 | 0.0016 |
| night | 25 | 0.6000 | 0.1470 | 0.0388 |
| orange | 25 | 0.6000 | 0.2234 | 0.0012 |
| pen | 25 | 0.6000 | 0.1476 | 0.0035 |
| pencil | 25 | 0.6000 | 0.2556 | 0.0021 |
| thirsty | 25 | 0.6000 | 0.1586 | 0.0034 |
| yellow | 25 | 0.6000 | 0.0917 | 0.0012 |
| car | 25 | 0.5600 | 0.0400 | 0.0023 |
| carrot | 25 | 0.5600 | 0.2315 | 0.0037 |
| green | 25 | 0.5600 | 0.1086 | 0.0006 |
| hot | 25 | 0.5600 | 0.2728 | 0.0012 |
| see | 25 | 0.5600 | 0.1214 | 0.0005 |
| sick | 25 | 0.5600 | 0.1568 | 0.0054 |
| white | 25 | 0.5600 | 0.2266 | 0.0442 |
| yes | 25 | 0.5600 | 0.0906 | 0.0011 |
| after | 25 | 0.5200 | 0.1310 | 0.0008 |
| book | 25 | 0.5200 | 0.1127 | 0.0012 |
| brown | 25 | 0.5200 | 0.1274 | 0.0009 |
| now | 25 | 0.5200 | 0.1829 | 0.0007 |
| who | 25 | 0.5200 | 0.0666 | 0.0012 |
| listen | 25 | 0.4800 | 0.0330 | 0.0004 |
| person | 25 | 0.4800 | 0.0757 | 0.0002 |
| child | 25 | 0.3600 | 0.0851 | 0.0001 |
| airplane | 25 | 0.2000 | 0.0007 | 0.0000 |
| food | 25 | 0.1200 | 0.0006 | 0.0000 |
| dog | 19 | 0.0526 | 0.0002 | 0.0000 |

## Orchestrator Notes

- This report evaluates recognizer v4 on runtime-landmark sequences only; it
  does not run training or create model artifacts.
- The FAR denominator is `test_clips * (classes - 1)`, so FAR is a per-attempt
  wrong-prompt accept probability.
- The strongest FAR10 words are currently `thankyou`, `hello`, `man`, `red`,
  `dad`, `fish`, `hat`, `please`, `sad`, `table`, and `time`.
- The weakest FAR10 words are `dog`, `food`, `airplane`, `child`, `person`, and
  `listen`; the orchestrator should treat those as poor pilot targets unless the
  landmark/recognizer path improves.
