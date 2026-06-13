#!/usr/bin/env python3
"""Export the scratch browser pipeline models to ONNX and verify CPU parity.

Exports:
  - GridDetector region model
  - HeatmapNet hand-landmark model
  - Recognizer sequence classifier

The export path is deliberately fail-closed: if onnx or onnxruntime is missing
from the torch venv, it prints the exact install command and does not write
unverified ONNX artifacts.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python export_models_web.py
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import numpy as np
import torch

HERE = Path(__file__).resolve().parent
if str(HERE) not in sys.path:
    sys.path.insert(0, str(HERE))

from train_detector_grid import GridDetector  # noqa: E402
from train_hands_landmarks_heatmap import HeatmapNet  # noqa: E402
from train_recognizer import FEAT, Recognizer  # noqa: E402

PYTHON = "/Users/kelly/Developer/asl-pilot/.venv/bin/python"
INSTALL_CMD = f"{PYTHON} -m pip install onnx onnxruntime"


@dataclass(frozen=True)
class ExportResult:
    name: str
    onnx_path: Path
    size_mb: float
    max_abs_diff: float
    mean_abs_diff: float


def require_export_deps() -> None:
    missing = [name for name in ("onnx", "onnxruntime") if importlib.util.find_spec(name) is None]
    if missing:
        print(f"missing export dependency in torch venv: {', '.join(missing)}")
        print(f"install with: {INSTALL_CMD}")
        raise SystemExit(2)


def load_state(path: Path) -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(path)
    return torch.load(path, map_location="cpu", weights_only=False)


def tensor_to_numpy(x: torch.Tensor) -> np.ndarray:
    return x.detach().cpu().numpy()


def flatten_outputs(out: Any) -> list[torch.Tensor]:
    if isinstance(out, torch.Tensor):
        return [out]
    return list(out)


def output_diff(torch_out: Any, ort_out: list[np.ndarray]) -> tuple[float, float]:
    max_abs = 0.0
    total_abs = 0.0
    total_n = 0
    for expected, actual in zip(flatten_outputs(torch_out), ort_out):
        delta = np.abs(tensor_to_numpy(expected) - actual)
        max_abs = max(max_abs, float(delta.max(initial=0.0)))
        total_abs += float(delta.sum())
        total_n += int(delta.size)
    mean_abs = total_abs / max(total_n, 1)
    return max_abs, mean_abs


def check_onnx(path: Path) -> None:
    import onnx

    model = onnx.load(str(path))
    onnx.checker.check_model(model)


def verify_ort(path: Path, input_names: list[str], inputs: tuple[torch.Tensor, ...], torch_out: Any) -> tuple[float, float]:
    import onnxruntime as ort

    sess = ort.InferenceSession(str(path), providers=["CPUExecutionProvider"])
    feed = {name: tensor_to_numpy(value) for name, value in zip(input_names, inputs)}
    ort_out = sess.run(None, feed)
    return output_diff(torch_out, ort_out)


def export_and_verify(
    *,
    name: str,
    model: torch.nn.Module,
    inputs: tuple[torch.Tensor, ...],
    input_names: list[str],
    output_names: list[str],
    dynamic_axes: dict[str, dict[int, str]],
    out_path: Path,
    opset: int,
    atol: float,
) -> ExportResult:
    model.eval()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with torch.no_grad():
        torch_out = model(*inputs)

    torch.onnx.export(
        model,
        inputs,
        str(out_path),
        dynamo=False,
        export_params=True,
        opset_version=opset,
        do_constant_folding=True,
        input_names=input_names,
        output_names=output_names,
        dynamic_axes=dynamic_axes,
    )
    check_onnx(out_path)
    max_abs, mean_abs = verify_ort(out_path, input_names, inputs, torch_out)
    if max_abs > atol:
        raise RuntimeError(f"{name} ONNX parity failed: max_abs_diff={max_abs:.6g} > {atol:g}")
    size_mb = out_path.stat().st_size / (1024 * 1024)
    print(f"{name}: {out_path} | {size_mb:.3f} MiB | max_abs_diff={max_abs:.6g} mean_abs_diff={mean_abs:.6g}")
    return ExportResult(name, out_path, size_mb, max_abs, mean_abs)


def build_grid_detector(ckpt_path: Path) -> tuple[torch.nn.Module, tuple[torch.Tensor, ...], dict[str, Any]]:
    ckpt = load_state(ckpt_path)
    target_ids = ckpt.get("target_ids") or ["left_or_first_hand", "right_or_second_hand", "head_or_face", "upper_body_or_signing_space"]
    grid = int(ckpt["grid"])
    image_px = int(ckpt.get("image_px") or grid * 8)
    model = GridDetector(n_targets=len(target_ids), grid=grid)
    model.load_state_dict(ckpt["state_dict"])
    sample = torch.rand(2, int(ckpt.get("input_channels", 5)), image_px, image_px)
    meta = {"grid": grid, "image_px": image_px, "target_ids": target_ids}
    return model, (sample,), meta


def build_heatmap_net(ckpt_path: Path) -> tuple[torch.nn.Module, tuple[torch.Tensor, ...], dict[str, Any]]:
    ckpt = load_state(ckpt_path)
    targets = ckpt.get("targets") or ["left_or_first_hand", "right_or_second_hand"]
    k = int(ckpt["k"])
    g = int(ckpt["g"])
    width = int(ckpt.get("width", 32))
    model = HeatmapNet(n_targets=len(targets), k=k, g=g, width=width)
    model.load_state_dict(ckpt["state_dict"])
    sample = torch.rand(2, 5, 128, 128)
    meta = {"k": k, "g": g, "width": width, "targets": targets}
    return model, (sample,), meta


def build_recognizer(ckpt_path: Path, time_steps: int) -> tuple[torch.nn.Module, tuple[torch.Tensor, ...], dict[str, Any]]:
    ckpt = load_state(ckpt_path)
    labels = ckpt["labels"]
    feat = int(ckpt.get("feat", FEAT))
    trained_t = int(ckpt.get("T", time_steps))
    hidden = int(ckpt["state_dict"]["gru.weight_hh_l0"].shape[1])
    t = max(2, min(time_steps, trained_t))
    model = Recognizer(feat=feat, hidden=hidden, n_classes=len(labels))
    model.load_state_dict(ckpt["state_dict"])
    sample_x = torch.rand(2, t, feat)
    sample_lengths = torch.tensor([t, max(1, t - 2)], dtype=torch.long)
    meta = {"T": trained_t, "sample_T": t, "feat": feat, "hidden": hidden, "classes": len(labels)}
    return model, (sample_x, sample_lengths), meta


def write_manifest(path: Path, results: list[ExportResult], metadata: dict[str, Any], opset: int, atol: float) -> None:
    payload = {
        "schema_version": "asl-pilot-web-onnx-export/v1",
        "opset": opset,
        "parity_atol": atol,
        "exports": [
            {
                "name": r.name,
                "onnx": str(r.onnx_path),
                "size_mb": round(r.size_mb, 3),
                "max_abs_diff": r.max_abs_diff,
                "mean_abs_diff": r.mean_abs_diff,
                "metadata": metadata[r.name],
            }
            for r in results
        ],
    }
    path.write_text(json.dumps(payload, indent=1) + "\n")
    print(f"manifest: {path}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--region", type=Path, default=HERE / "output/detector0-grid-big2.pt")
    ap.add_argument("--landmark", type=Path, default=HERE / "output/detector0-hand-landmarks-merged-w64.pt")
    ap.add_argument("--recognizer", type=Path, default=HERE / "output/recognizer-v4-w64.pt")
    ap.add_argument("--out-dir", type=Path, default=HERE / "output/web-onnx")
    ap.add_argument("--opset", type=int, default=17)
    ap.add_argument("--atol", type=float, default=1e-3)
    ap.add_argument("--recognizer-time", type=int, default=20)
    ap.add_argument("--threads", type=int, default=1)
    ap.add_argument("--check-deps", action="store_true", help="only check ONNX export dependencies")
    args = ap.parse_args()

    os.environ.setdefault("PYTHONDONTWRITEBYTECODE", "1")
    torch.set_num_threads(args.threads)
    torch.manual_seed(0)
    require_export_deps()
    if args.check_deps:
        print("onnx and onnxruntime are available")
        return

    metadata: dict[str, Any] = {}
    results: list[ExportResult] = []

    region, inputs, metadata["region"] = build_grid_detector(args.region)
    results.append(export_and_verify(
        name="region",
        model=region,
        inputs=inputs,
        input_names=["frames_xy"],
        output_names=["objectness_logits", "boxes_xyxy_norm"],
        dynamic_axes={
            "frames_xy": {0: "batch"},
            "objectness_logits": {0: "batch"},
            "boxes_xyxy_norm": {0: "batch"},
        },
        out_path=args.out_dir / "detector0-grid-big2.onnx",
        opset=args.opset,
        atol=args.atol,
    ))

    landmark, inputs, metadata["landmark"] = build_heatmap_net(args.landmark)
    results.append(export_and_verify(
        name="landmark",
        model=landmark,
        inputs=inputs,
        input_names=["crops_xy"],
        output_names=["presence_logits", "heatmaps"],
        dynamic_axes={
            "crops_xy": {0: "batch"},
            "presence_logits": {0: "batch"},
            "heatmaps": {0: "batch"},
        },
        out_path=args.out_dir / "detector0-hand-landmarks-merged-w64.onnx",
        opset=args.opset,
        atol=args.atol,
    ))

    recognizer, inputs, metadata["recognizer"] = build_recognizer(args.recognizer, args.recognizer_time)
    results.append(export_and_verify(
        name="recognizer",
        model=recognizer,
        inputs=inputs,
        input_names=["sequence", "lengths"],
        output_names=["logits"],
        dynamic_axes={
            "sequence": {0: "batch", 1: "time"},
            "lengths": {0: "batch"},
            "logits": {0: "batch"},
        },
        out_path=args.out_dir / "recognizer-v4-w64.onnx",
        opset=args.opset,
        atol=args.atol,
    ))

    write_manifest(args.out_dir / "manifest.json", results, metadata, args.opset, args.atol)


if __name__ == "__main__":
    main()
