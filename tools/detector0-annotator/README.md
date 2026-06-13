# Detector 0 Annotator Workbench

This is a local-only helper for reviewing Detector 0 hand boxes from already
tracked Tier 0 tensor payloads. It prepares ignored PNG frame references and an
ignored local index, then lets a reviewer draw normalized top-left `xyxy` boxes
in a static browser page.

## Boundaries

- Inputs are tracked `data/tensors/return-to-form-tier0/{split}/*-regions.pt`
  tensor payloads and tracked Detector 0 packet/manifest metadata.
- The prepared cache, PNGs, and browser exports are ignored by default.
- Browser exports are draft human-review artifacts only. They are not
  authoritative labels until a later committed ingestion slice reviews and
  promotes them.
- The tool does not upload media or labels, call network APIs, run inference,
  decode source video, create automatic labels, train Detector 0, mutate label
  packets, or change claim surfaces.
- The promoted-lane guardrail remains unchanged: no pretrained detector,
  landmark, backbone, feature-extractor, generated-label, pseudo-label, or
  pretrained feature-cache dependency is introduced by this workbench.

## Prepare A Local Cache

Run from the repo root:

```sh
.venv/bin/python tools/detector0-annotator/prepare.py --include-existing-only --max-frames 4
```

The command writes:

- `tools/detector0-annotator/.cache/index.json`
- `tools/detector0-annotator/.cache/images/*.png`

Both paths are intentionally ignored.

For a larger local review set, omit `--max-frames`. Keep generated outputs out
of commits unless a later mission explicitly changes the policy.

## Use The Static Page

Open `tools/detector0-annotator/app.html` in a browser, choose
`tools/detector0-annotator/.cache/index.json`, select a frame and target, drag a
box on the image, then export a draft JSON file to a local ignored location such
as `tools/detector0-annotator/exports/`.

Coordinate space is `normalized_full_frame_top_left_xyxy` over the rendered
`full_frame_reference` PNG.
