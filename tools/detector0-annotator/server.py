#!/usr/bin/env python3
"""Local annotation server for the Detector 0 box-drawing GUI.

Serves app.html, the prepared frame PNGs, and the work index; accepts box
saves and writes them into a human-authored packet in the exact v0 frame_rows
schema. Stdlib only -- no network, no deps. Run AFTER prepare.py.

The output packet is written to ./output/ (gitignored). This tool lives in its
own git worktree, isolated from the autonomous loop's working tree, so nothing
here is touched by the loop's `git clean -fd`.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python server.py     # http://127.0.0.1:8765
  ...server.py --port 9000
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
CACHE = HERE / ".cache"
FRAMES_DIR = CACHE / "frames"
INDEX_PATH = CACHE / "index.json"
APP_HTML = HERE / "app.html"
OUT_DIR = HERE / "output"
OUT_PACKET = OUT_DIR / "return-to-form-tier0-localization-packet-human-v1.json"

TARGET_IDS = [
    "left_or_first_hand",
    "right_or_second_hand",
    "head_or_face",
    "upper_body_or_signing_space",
    "table_two_hand_union_or_contact_region",
]

_lock = threading.Lock()
_index = {}
_items_by_id = {}


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load_index() -> None:
    global _index, _items_by_id
    _index = json.loads(INDEX_PATH.read_text())
    _items_by_id = {it["item_id"]: it for it in _index["items"]}


def empty_target() -> dict:
    return {
        "presence": False,
        "center_xy_norm": None,
        "box_xyxy_norm": None,
        "visibility_confidence": 0,
        "occlusion_flag": False,
        "truncation_flag": False,
    }


def load_packet() -> dict:
    if OUT_PACKET.exists():
        return json.loads(OUT_PACKET.read_text())
    return {
        "schema_version": "asl-pilot-detector0-localization-packet/v1",
        "status": "human_authored_expansion_in_progress",
        "created_at": now_iso(),
        "coordinate_space": "normalized_full_frame_xyxy_top_left_origin",
        "label_sources_allowed": ["project_manual_box_label", "manual_verified_from_fixed_crop_context"],
        "target_schema": {"target_ids": TARGET_IDS},
        "annotator": "human:kelly",
        "frame_rows": [],
    }


def build_row(item: dict, targets_in: dict, review_status: str) -> dict:
    targets = {}
    for tid in TARGET_IDS:
        t = empty_target()
        incoming = (targets_in or {}).get(tid)
        if incoming and incoming.get("presence") and incoming.get("box_xyxy_norm"):
            box = [round(float(v), 4) for v in incoming["box_xyxy_norm"]]
            x1, y1, x2, y2 = box
            t.update({
                "presence": True,
                "box_xyxy_norm": box,
                "center_xy_norm": [round((x1 + x2) / 2, 4), round((y1 + y2) / 2, 4)],
                "visibility_confidence": float(incoming.get("visibility_confidence", 1.0)),
                "occlusion_flag": bool(incoming.get("occlusion_flag", False)),
                "truncation_flag": bool(incoming.get("truncation_flag", False)),
            })
        targets[tid] = t
    return {
        "row_id": f"det0-h1-{item['item_id']}",
        "clip_id": item["clip_id"],
        "label_id": item["label_id"],
        "split": item["split"],
        "source_id": item["source_id"],
        "source_split": item["source_split"],
        "source_record_id": item["source_record_id"],
        "source_video_sha256": item["source_video_sha256"],
        "signer_identity_hash": item["signer_identity_hash"],
        "frame_index": item["frame_index"],
        "frame_tensor_path": item["frame_tensor_path"],
        "frame_tensor_sha256": item["frame_tensor_sha256"],
        "label_source": "project_manual_box_label",
        "annotation_source": "project_manual_box_label",
        "annotator": "human:kelly",
        "reviewer": "human:kelly",
        "reviewed_at": now_iso(),
        "review_status": review_status or "manual_verified",
        "targets": targets,
    }


def save_row(item_id: str, targets_in: dict, review_status: str) -> dict:
    item = _items_by_id.get(item_id)
    if not item:
        raise KeyError(item_id)
    with _lock:
        packet = load_packet()
        rows = packet.get("frame_rows", [])
        row = build_row(item, targets_in, review_status)
        for i, existing in enumerate(rows):
            if existing.get("row_id") == row["row_id"]:
                rows[i] = row
                break
        else:
            rows.append(row)
        packet["frame_rows"] = rows
        packet["updated_at"] = now_iso()
        packet["row_count"] = len(rows)
        OUT_DIR.mkdir(parents=True, exist_ok=True)
        tmp = OUT_PACKET.with_suffix(".json.tmp")
        tmp.write_text(json.dumps(packet, indent=2))
        tmp.replace(OUT_PACKET)
    return {"ok": True, "row_count": len(rows), "row_id": row["row_id"]}


def saved_state() -> dict:
    """item_id -> saved targets, so the GUI can resume."""
    packet = load_packet()
    out = {}
    for row in packet.get("frame_rows", []):
        rid = row.get("row_id", "")
        item_id = rid[len("det0-h1-"):] if rid.startswith("det0-h1-") else None
        if item_id:
            out[item_id] = {"targets": row.get("targets", {}), "review_status": row.get("review_status")}
    return out


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, body, ctype="application/json"):
        data = body if isinstance(body, (bytes, bytearray)) else json.dumps(body).encode()
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, *a):  # quiet
        pass

    def do_GET(self):
        path = self.path.split("?", 1)[0]
        if path in ("/", "/index.html"):
            return self._send(200, APP_HTML.read_bytes(), "text/html; charset=utf-8")
        if path == "/api/index":
            return self._send(200, _index)
        if path == "/api/saved":
            return self._send(200, saved_state())
        if path.startswith("/frames/"):
            f = FRAMES_DIR / path[len("/frames/"):]
            if f.exists() and f.suffix == ".png":
                return self._send(200, f.read_bytes(), "image/png")
            return self._send(404, {"error": "not found"})
        return self._send(404, {"error": "not found"})

    def do_POST(self):
        if self.path != "/api/save":
            return self._send(404, {"error": "not found"})
        length = int(self.headers.get("Content-Length", 0))
        try:
            payload = json.loads(self.rfile.read(length) or b"{}")
            result = save_row(payload["item_id"], payload.get("targets", {}), payload.get("review_status"))
            return self._send(200, result)
        except KeyError as e:
            return self._send(400, {"error": f"unknown item_id {e}"})
        except Exception as e:  # noqa: BLE001
            return self._send(500, {"error": str(e)})


def main() -> int:
    global CACHE, FRAMES_DIR, INDEX_PATH, OUT_DIR, OUT_PACKET
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8765)
    ap.add_argument("--cache", type=Path, default=CACHE, help="dir holding index.json + frames/")
    ap.add_argument("--out", type=Path, default=OUT_PACKET, help="output packet path")
    args = ap.parse_args()
    cache = args.cache if args.cache.is_absolute() else (HERE / args.cache)
    CACHE = cache; FRAMES_DIR = cache / "frames"; INDEX_PATH = cache / "index.json"
    OUT_PACKET = args.out if args.out.is_absolute() else (HERE / args.out); OUT_DIR = OUT_PACKET.parent
    if not INDEX_PATH.exists():
        print(f"index not found: {INDEX_PATH}\nRun prepare.py first.")
        return 1
    load_index()
    print(f"Detector 0 annotator: http://127.0.0.1:{args.port}")
    print(f"  {len(_index['items'])} frames to annotate")
    print(f"  writing -> {OUT_PACKET}")
    ThreadingHTTPServer(("127.0.0.1", args.port), Handler).serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
