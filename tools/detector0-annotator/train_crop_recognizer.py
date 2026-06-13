#!/usr/bin/env python3
"""From-scratch crop-pixel sign RECOGNIZER: signing-space crop sequence -> 95-way.

Bypasses the lossy landmark step. A scratch CNN encodes each signing-space crop
(supplied by our region detector) into a per-frame feature; a BiGRU over the
sequence classifies the sign. No pretrained weights; our-models-only at runtime.

  /Users/kelly/Developer/asl-pilot/.venv/bin/python train_crop_recognizer.py \
      --data .cache/recog-crops --epochs 60 --device mps
"""
from __future__ import annotations
import argparse, json
from collections import defaultdict
from pathlib import Path
import numpy as np, torch, torch.nn as nn

HERE = Path(__file__).resolve().parent


def load_index(data_dir: Path):
    d = json.loads((data_dir / "rows.json").read_text())
    clips = defaultdict(lambda: {"label": None, "split": None, "fr": []})
    for r in d["rows"]:
        c = clips[r["clip_id"]]; c["label"] = r["label_id"]; c["split"] = r["split"]
        c["fr"].append((r["video_frame_index"], r["idx"]))
    labels = sorted({c["label"] for c in clips.values()}); lab2i = {l: i for i, l in enumerate(labels)}
    T = max(len(c["fr"]) for c in clips.values())
    seq = np.zeros((len(clips), T), np.int64); length = np.zeros(len(clips), np.int64)
    y = np.zeros(len(clips), np.int64); sp = []
    for k, c in enumerate(clips.values()):
        idxs = [i for _, i in sorted(c["fr"])]
        seq[k, :len(idxs)] = idxs; length[k] = len(idxs); y[k] = lab2i[c["label"]]; sp.append(c["split"])
    return seq, length, y, np.array(sp), labels, T


class FrameCNN(nn.Module):
    def __init__(self, out=128):
        super().__init__()
        def blk(i, o): return nn.Sequential(nn.Conv2d(i, o, 3, 2, 1), nn.BatchNorm2d(o), nn.ReLU(inplace=True))
        self.net = nn.Sequential(blk(3, 32), blk(32, 64), blk(64, 128), blk(128, out), nn.AdaptiveAvgPool2d(1))

    def forward(self, x):
        return self.net(x).reshape(x.size(0), -1)


class CropRecognizer(nn.Module):
    def __init__(self, n_classes, hidden=128, feat=128):
        super().__init__()
        self.cnn = FrameCNN(feat)
        self.gru = nn.GRU(feat, hidden, 2, batch_first=True, bidirectional=True, dropout=0.2)
        self.head = nn.Sequential(nn.Linear(2 * hidden, hidden), nn.ReLU(inplace=True), nn.Dropout(0.3), nn.Linear(hidden, n_classes))

    def forward(self, x, lengths):                     # x (B,T,3,P,P)
        B, T = x.shape[:2]
        f = self.cnn(x.reshape(B * T, *x.shape[2:])).reshape(B, T, -1)
        out, _ = self.gru(f)
        mask = (torch.arange(T, device=x.device)[None, :] < lengths[:, None]).float().unsqueeze(-1)
        pooled = (out * mask).sum(1) / mask.sum(1).clamp(min=1)
        return self.head(pooled)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", type=Path, default=HERE / ".cache/recog-crops")
    ap.add_argument("--epochs", type=int, default=60)
    ap.add_argument("--batch", type=int, default=32)
    ap.add_argument("--lr", type=float, default=1.5e-3)
    ap.add_argument("--device", default="mps")
    ap.add_argument("--seed", type=int, default=0)
    ap.add_argument("--limit-train", type=int, default=0, help="overfit sanity: cap train clips")
    ap.add_argument("--out", type=Path, default=HERE / "output/recognizer-crop.json")
    args = ap.parse_args()
    torch.manual_seed(args.seed); np.random.seed(args.seed)
    dev = torch.device("mps") if (args.device == "mps" and torch.backends.mps.is_available()) else torch.device("cpu")

    crops = np.load(args.data / "crops.npy", mmap_mode="r")  # (Nc,P,P,3) uint8
    seq, length, y, sp, labels, T = load_index(args.data)
    pool = np.where((sp == "train") | (sp == "validation"))[0]
    rng = np.random.RandomState(args.seed); rng.shuffle(pool)
    n_mon = max(args.batch, int(0.1 * len(pool)))
    mon, tr, te = pool[:n_mon], pool[n_mon:], np.where(sp == "test")[0]
    if args.limit_train:
        tr = tr[:args.limit_train]; mon = tr  # overfit sanity: can the model memorize?
    print(f"clips {len(seq)} | train {len(tr)} mon {len(mon)} test {len(te)} | classes {len(labels)} | T {T} | crops {crops.shape}")

    Lt = torch.from_numpy(length).to(dev); yt = torch.from_numpy(y).to(dev)

    def fetch(idx, train=False):
        s = seq[idx]                                    # (B,T) crop indices
        imgs = crops[s.reshape(-1)].reshape(*s.shape, *crops.shape[1:])  # (B,T,P,P,3) uint8
        x = torch.from_numpy(np.ascontiguousarray(imgs)).to(dev).float().div_(255).permute(0, 1, 4, 2, 3).contiguous()  # B,T,3,P,P
        if train:
            if np.random.rand() < 0.5:
                x = x.flip(-1)                          # horizontal flip
            x = (x * (0.8 + 0.4 * np.random.rand())).clamp_(0, 1)  # brightness
        return x

    model = CropRecognizer(len(labels)).to(dev)
    opt = torch.optim.Adam(model.parameters(), lr=args.lr, weight_decay=1e-4)
    sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, args.epochs)
    ce = nn.CrossEntropyLoss()

    def evaluate(idx):
        model.eval(); t1 = t5 = n = 0
        with torch.no_grad():
            for k in range(0, len(idx), args.batch):
                bi = idx[k:k + args.batch]
                logits = model(fetch(bi), Lt[torch.as_tensor(bi, device=dev)]); yi = yt[torch.as_tensor(bi, device=dev)]
                t1 += (logits.argmax(-1) == yi).sum().item()
                t5 += (logits.topk(5, -1).indices == yi[:, None]).any(-1).sum().item(); n += len(bi)
        return t1 / n, t5 / n

    best = -1; best_state = None
    for ep in range(args.epochs):
        model.train(); order = tr.copy(); np.random.shuffle(order)
        for k in range(0, len(order), args.batch):
            bi = order[k:k + args.batch]
            loss = ce(model(fetch(bi, train=True), Lt[torch.as_tensor(bi, device=dev)]), yt[torch.as_tensor(bi, device=dev)])
            opt.zero_grad(); loss.backward(); opt.step()
        sched.step()
        if ep % 5 == 0 or ep == args.epochs - 1:
            v1, v5 = evaluate(mon)
            if v1 > best: best = v1; best_state = {k: v.detach().cpu().clone() for k, v in model.state_dict().items()}
            print(f"ep {ep:3d} loss {loss.item():.3f} mon top1 {v1:.3f} top5 {v5:.3f} (best {best:.3f})")
    if best_state: model.load_state_dict(best_state)
    t1, t5 = evaluate(te)
    print(f"\n=== CROP-RECOGNIZER TEST: top1 {t1:.3f}  top5 {t5:.3f}  (chance {1/len(labels):.3f}, {len(labels)} classes) ===")
    args.out.parent.mkdir(parents=True, exist_ok=True)
    torch.save({"state_dict": model.state_dict(), "labels": labels, "T": T}, args.out.with_suffix(".pt"))
    args.out.write_text(json.dumps({"schema_version": "asl-pilot-recognizer-crop/v1", "classes": len(labels),
                                    "test_top1": round(t1, 4), "test_top5": round(t5, 4), "epochs": args.epochs}, indent=1))
    print(f"weights -> {args.out.with_suffix('.pt')}")


if __name__ == "__main__":
    main()
