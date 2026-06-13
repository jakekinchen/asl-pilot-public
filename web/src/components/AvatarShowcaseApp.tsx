"use client";

import { useEffect, useState } from "react";
import { type ReferenceAvatarPlayback } from "@/components/ReferenceAvatar3D";
import { HumanAvatar3D } from "@/components/HumanAvatar3D";
import {
  type AvatarReferenceClip,
  type AvatarClipLoadStatus,
  avatarClipPathForVocabulary,
  loadAvatarReferenceClip,
} from "@/lib/avatar-motion";

// ---------------------------------------------------------------------------
// /avatar — a no-auth showcase of the 3D reference avatar driven by the
// extracted per-word motion data (body + dense RTMPose hands). Pick a word and
// watch the avatar perform the sign. Doubles as the "how it's signed" panel for
// the demo. Nothing here uploads or uses the camera.
// ---------------------------------------------------------------------------

const WORDS = ["man", "please", "frog", "grandpa", "happy", "hello", "table", "bad"] as const;

export function AvatarShowcaseApp() {
  const [word, setWord] = useState<string>(WORDS[5]); // hello
  const [clip, setClip] = useState<AvatarReferenceClip | null>(null);
  const [status, setStatus] = useState<AvatarClipLoadStatus>("idle");
  const [isPlaying, setIsPlaying] = useState(true);
  const [loop, setLoop] = useState(true);
  const [speed, setSpeed] = useState<0.5 | 1>(1);
  const [mirrored, setMirrored] = useState(false);
  const [restartToken, setRestartToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setClip(null);
    loadAvatarReferenceClip(avatarClipPathForVocabulary(word))
      .then((c) => {
        if (cancelled) return;
        setClip(c);
        setStatus("ready");
        setIsPlaying(true);
        setRestartToken((t) => t + 1);
      })
      .catch(() => {
        if (!cancelled) setStatus("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [word]);

  const playback: ReferenceAvatarPlayback = { isPlaying, loop, speed, mirrored, restartToken };

  return (
    <div className="av-wrap">
      <header className="av-head">
        <div className="av-brand">
          <div className="av-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>reference avatar</span>
          </div>
        </div>
        <div className="av-pill">
          <span className={`av-dot ${status === "ready" ? "on" : status === "missing" || status === "error" ? "warn" : ""}`} />
          <span>
            {status === "loading"
              ? "Loading motion…"
              : status === "missing"
                ? "No motion data for this word"
                : status === "ready"
                  ? "Motion-captured · plays on-device"
                  : "Pick a word"}
          </span>
        </div>
      </header>

      <main className="av-main">
        <section className="av-side">
          <div className="av-eyebrow">How it&apos;s signed</div>
          <p className="av-lead">
            A 3D avatar performing the sign, driven by motion data extracted from real
            signing — body pose plus dense hand tracking. No video, no upload.
          </p>
          <div className="av-words">
            {WORDS.map((w) => (
              <button
                key={w}
                type="button"
                className={`av-word ${w === word ? "active" : ""}`}
                onClick={() => setWord(w)}
              >
                {w}
              </button>
            ))}
          </div>

          <div className="av-controls">
            <button type="button" className="av-ctrl" onClick={() => setIsPlaying((p) => !p)}>
              {isPlaying ? "❚❚ Pause" : "▶ Play"}
            </button>
            <button type="button" className="av-ctrl" onClick={() => setRestartToken((t) => t + 1)}>
              ↻ Replay
            </button>
            <button
              type="button"
              className={`av-ctrl ${speed === 0.5 ? "on" : ""}`}
              onClick={() => setSpeed((s) => (s === 1 ? 0.5 : 1))}
            >
              {speed === 0.5 ? "0.5× slow" : "1× speed"}
            </button>
            <button
              type="button"
              className={`av-ctrl ${mirrored ? "on" : ""}`}
              onClick={() => setMirrored((m) => !m)}
            >
              ⇋ Mirror
            </button>
            <button
              type="button"
              className={`av-ctrl ${loop ? "on" : ""}`}
              onClick={() => setLoop((l) => !l)}
            >
              ↺ Loop
            </button>
          </div>
          <span className="av-credit">Motion: PopSign clips · CC BY 4.0 · extracted on-device tooling</span>
        </section>

        <section className="av-stage">
          <div className="av-frame">
            <HumanAvatar3D clip={clip} playback={playback} />
            <div className="av-word-tag">{word}</div>
          </div>
        </section>
      </main>

      <footer className="av-foot">
        <span className="av-tag">
          <span className="av-dot on" /> 3D reference avatar · scratch-built · no pretrained runtime models
        </span>
        <span>body pose + RTMPose hand landmarks → animated skeleton</span>
      </footer>

      <style jsx>{`
        .av-wrap {
          --line: rgba(245, 228, 200, 0.12);
          --paper: #f3e9d8;
          --muted: #b6a98f;
          --faint: #8a7d65;
          --honey: #eab44d;
          --honey-2: #f6c869;
          --green: #56d39a;
          --r: 22px;
          max-width: 1180px;
          margin: 0 auto;
          padding: 26px 26px 36px;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          background-image: radial-gradient(1100px 700px at 80% -12%, rgba(234, 180, 77, 0.16), transparent 60%),
            radial-gradient(900px 600px at 2% 112%, rgba(86, 211, 154, 0.1), transparent 55%);
        }
        .av-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
        .av-brand { display: flex; align-items: center; gap: 13px; }
        .av-mark {
          width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center;
          background: linear-gradient(150deg, var(--honey-2), var(--honey)); color: #2a1d07;
          font-family: "Fraunces", "Manrope", serif; font-weight: 700; font-size: 23px;
        }
        .av-brand b { font-family: "Fraunces", "Manrope", serif; font-weight: 600; font-size: 21px; display: block; line-height: 1; }
        .av-brand span { color: var(--faint); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; display: block; margin-top: 4px; }
        .av-pill {
          font-size: 13px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px;
          padding: 8px 14px; display: flex; align-items: center; gap: 9px; background: rgba(255,255,255,0.02); max-width: 360px;
        }
        .av-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--faint); flex: none; }
        .av-dot.on { background: var(--green); }
        .av-dot.warn { background: var(--honey); }
        .av-main { flex: 1; display: grid; grid-template-columns: 0.8fr 1.2fr; gap: 30px; margin-top: 32px; align-items: stretch; }
        @media (max-width: 900px) { .av-main { grid-template-columns: 1fr; } }
        .av-side {
          background: linear-gradient(170deg, #241d15, #1d1812); border: 1px solid var(--line);
          border-radius: var(--r); padding: 30px 28px; display: flex; flex-direction: column;
          box-shadow: 0 30px 70px -30px rgba(0, 0, 0, 0.7);
        }
        .av-eyebrow { font-size: 12.5px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--honey); font-weight: 600; }
        .av-lead { color: var(--muted); font-size: 14.5px; margin: 12px 0 22px; line-height: 1.55; }
        .av-words { display: flex; flex-wrap: wrap; gap: 8px; }
        .av-word {
          appearance: none; cursor: pointer; background: rgba(255,255,255,0.04); border: 1px solid var(--line);
          color: var(--paper); font: inherit; font-weight: 600; font-size: 14px; text-transform: lowercase;
          padding: 9px 15px; border-radius: 999px; font-family: "Fraunces", "Manrope", serif; transition: 0.16s;
        }
        .av-word:hover { border-color: rgba(234,180,77,0.4); }
        .av-word.active { background: linear-gradient(150deg, var(--honey-2), var(--honey)); color: #2a1d07; border-color: transparent; }
        .av-controls { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; padding-top: 26px; }
        .av-ctrl {
          appearance: none; cursor: pointer; background: rgba(255,255,255,0.04); border: 1px solid var(--line);
          color: var(--paper); font: inherit; font-weight: 600; font-size: 13px; padding: 9px 13px; border-radius: 11px; transition: 0.16s;
        }
        .av-ctrl:hover { background: rgba(255,255,255,0.08); }
        .av-ctrl.on { border-color: rgba(234,180,77,0.5); color: var(--honey); }
        .av-credit { margin-top: 14px; color: var(--faint); font-size: 11px; }
        .av-stage { display: flex; }
        .av-frame {
          position: relative; flex: 1; border-radius: var(--r); overflow: hidden; background: #0c0a07;
          border: 1px solid var(--line); min-height: 420px; box-shadow: 0 30px 70px -30px rgba(0,0,0,0.7);
        }
        .av-word-tag {
          position: absolute; left: 16px; bottom: 14px; z-index: 3;
          font-family: "Fraunces", "Manrope", serif; font-weight: 600; font-size: 30px; text-transform: lowercase;
          color: var(--paper); text-shadow: 0 2px 18px rgba(0,0,0,0.7); pointer-events: none;
        }
        .av-foot {
          margin-top: 28px; display: flex; justify-content: space-between; align-items: center; gap: 14px; flex-wrap: wrap;
          color: var(--faint); font-size: 12.5px; border-top: 1px solid var(--line); padding-top: 18px;
        }
        .av-tag { display: inline-flex; align-items: center; gap: 8px; }
      `}</style>
    </div>
  );
}
