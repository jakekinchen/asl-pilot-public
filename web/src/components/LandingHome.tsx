"use client";

// Landing / demo entry point. Routes to the validated surfaces. Replaces the
// legacy PracticeApp that used to render at root. Pure links + styled-jsx; no
// model loading here, so it paints instantly as the demo's front door.

const SURFACES = [
  {
    href: "/practice",
    kicker: "Recommended",
    title: "Practice with your camera",
    body: "Sign any of 95 beginner words; the recognizer checks each attempt on-device and gives a targeted tip when it doesn't read. Free account saves your progress.",
    cta: "Start practicing",
    tone: "green",
  },
  {
    href: "/lesson",
    kicker: "Start here",
    title: "Learn the signs",
    body: "Browse the beginner catalog by topic — reference signer videos and step-by-step study cards for every word. No camera needed.",
    cta: "Open lessons",
    tone: "honey",
  },
  {
    href: "/analyze",
    kicker: "Under the hood",
    title: "Analyze a video",
    body: "Feed any signing clip and watch the from-scratch model read it frame-by-frame — or see the live tracker at /tracking. Nothing is uploaded.",
    cta: "Open analyzer",
    tone: "plain",
  },
] as const;

export function LandingHome() {
  return (
    <div className="lp-wrap">
      <div className="lp-grain" aria-hidden="true" />
      <header className="lp-head">
        <div className="lp-brand">
          <div className="lp-mark">A</div>
          <div>
            <b>ASL&nbsp;Pilot</b>
            <span>from-scratch sign recognition</span>
          </div>
        </div>
        <div className="lp-chips">
          <span className="lp-chip"><i className="lp-dot" /> on-device</span>
          <span className="lp-chip">no pretrained models</span>
        </div>
      </header>

      <main className="lp-main">
        <section className="lp-hero">
          <div className="lp-eyebrow">Browser-first · runs entirely on your device</div>
          <h1 className="lp-title">
            Recognizing American Sign Language,<br />
            <em>built from nothing.</em>
          </h1>
          <p className="lp-lede">
            A free little practice studio for ASL&nbsp;1 vocabulary. Every model
            here — hand detection, 21-point landmarks, the sign recognizer — was
            trained from scratch. No pretrained backbones, no cloud calls, no
            video leaves your browser. Pick a way in:
          </p>
        </section>

        <section className="lp-cards">
          {SURFACES.map((s, i) => (
            <a
              key={s.href}
              href={s.href}
              className={`lp-card lp-${s.tone}`}
              style={{ animationDelay: `${0.12 * i + 0.15}s` }}
            >
              <span className="lp-kicker">{s.kicker}</span>
              <h2 className="lp-card-title">{s.title}</h2>
              <p className="lp-card-body">{s.body}</p>
              <span className="lp-cta">
                {s.cta}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </a>
          ))}
        </section>
      </main>

      <footer className="lp-foot">
        <span>Sample clips: PopSign · CC BY 4.0</span>
        <a className="lp-foot-link" href="/validation">
          Model claims &amp; validation
        </a>
        <span>Scratch-trained · region → landmarks → recognizer · in-browser ONNX</span>
      </footer>

      <style jsx>{`
        .lp-wrap {
          --paper: #f4ecdc;
          --muted: #b6a98f;
          --faint: #87795f;
          --line: rgba(245, 228, 200, 0.12);
          --honey: #eab44d;
          --honey-2: #f6c869;
          --green: #56d39a;
          --green-deep: #2fae7d;
          position: relative;
          min-height: 100vh;
          max-width: 1180px;
          margin: 0 auto;
          padding: 30px 28px 40px;
          display: flex;
          flex-direction: column;
          color: var(--paper);
          font-family: "Manrope", system-ui, sans-serif;
          overflow: hidden;
          background-image: radial-gradient(1200px 760px at 82% -14%, rgba(234, 180, 77, 0.2), transparent 60%),
            radial-gradient(1000px 680px at -4% 116%, rgba(86, 211, 154, 0.13), transparent 55%);
        }
        .lp-grain {
          position: absolute;
          inset: 0;
          pointer-events: none;
          opacity: 0.5;
          background-image: radial-gradient(rgba(255, 255, 255, 0.025) 1px, transparent 1px);
          background-size: 3px 3px;
          mask-image: radial-gradient(120% 90% at 50% 0%, #000 40%, transparent 100%);
        }
        .lp-head {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          z-index: 1;
        }
        .lp-brand {
          display: flex;
          align-items: center;
          gap: 13px;
        }
        .lp-mark {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: grid;
          place-items: center;
          background: linear-gradient(150deg, var(--honey-2), var(--honey));
          color: #2a1d07;
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 700;
          font-size: 24px;
          box-shadow: 0 10px 26px -10px rgba(234, 180, 77, 0.65);
        }
        .lp-brand b {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 22px;
          display: block;
          line-height: 1;
        }
        .lp-brand span {
          color: var(--faint);
          font-size: 11px;
          letter-spacing: 0.22em;
          text-transform: uppercase;
          display: block;
          margin-top: 5px;
        }
        .lp-chips {
          display: flex;
          gap: 9px;
          flex-wrap: wrap;
        }
        .lp-chip {
          font-size: 12px;
          color: var(--muted);
          border: 1px solid var(--line);
          border-radius: 999px;
          padding: 7px 13px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.02);
        }
        .lp-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: var(--green);
          box-shadow: 0 0 0 0 rgba(86, 211, 154, 0.5);
          animation: lp-pulse 2.4s infinite;
        }
        @keyframes lp-pulse {
          0% { box-shadow: 0 0 0 0 rgba(86, 211, 154, 0.5); }
          70% { box-shadow: 0 0 0 7px rgba(86, 211, 154, 0); }
          100% { box-shadow: 0 0 0 0 rgba(86, 211, 154, 0); }
        }
        .lp-main {
          position: relative;
          z-index: 1;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 44px;
          padding: 40px 0;
        }
        .lp-eyebrow {
          font-size: 12.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--honey);
          font-weight: 600;
          opacity: 0;
          animation: lp-rise 0.7s cubic-bezier(0.2, 0.9, 0.2, 1) 0.05s forwards;
        }
        .lp-title {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: clamp(38px, 6.4vw, 78px);
          line-height: 1.02;
          letter-spacing: -0.015em;
          margin: 16px 0 0;
          opacity: 0;
          animation: lp-rise 0.8s cubic-bezier(0.2, 0.9, 0.2, 1) 0.12s forwards;
        }
        .lp-title em {
          font-style: italic;
          background: linear-gradient(100deg, var(--honey-2), var(--green));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .lp-lede {
          max-width: 60ch;
          color: var(--muted);
          font-size: clamp(15px, 1.5vw, 17.5px);
          line-height: 1.6;
          margin: 22px 0 0;
          opacity: 0;
          animation: lp-rise 0.8s cubic-bezier(0.2, 0.9, 0.2, 1) 0.2s forwards;
        }
        @keyframes lp-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .lp-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 18px;
        }
        @media (max-width: 860px) {
          .lp-cards { grid-template-columns: 1fr; }
        }
        .lp-card {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 26px 24px 22px;
          border-radius: 20px;
          border: 1px solid var(--line);
          background: linear-gradient(168deg, rgba(36, 29, 21, 0.92), rgba(20, 17, 13, 0.92));
          text-decoration: none;
          color: var(--paper);
          box-shadow: 0 26px 60px -34px rgba(0, 0, 0, 0.8);
          opacity: 0;
          transform: translateY(16px);
          animation: lp-rise 0.7s cubic-bezier(0.2, 0.9, 0.2, 1) forwards;
          transition: transform 0.22s, border-color 0.22s, box-shadow 0.22s;
          overflow: hidden;
        }
        .lp-card::before {
          content: "";
          position: absolute;
          inset: 0 0 auto 0;
          height: 3px;
          background: var(--edge, var(--line));
          opacity: 0.85;
        }
        .lp-honey { --edge: linear-gradient(90deg, var(--honey-2), var(--honey)); }
        .lp-green { --edge: linear-gradient(90deg, var(--green), var(--green-deep)); }
        .lp-plain { --edge: linear-gradient(90deg, rgba(245,228,200,0.4), transparent); }
        .lp-card:hover {
          transform: translateY(-5px);
          border-color: rgba(245, 228, 200, 0.26);
          box-shadow: 0 34px 70px -30px rgba(0, 0, 0, 0.85);
        }
        .lp-kicker {
          font-size: 10.5px;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--faint);
          font-weight: 600;
        }
        .lp-honey .lp-kicker { color: var(--honey); }
        .lp-green .lp-kicker { color: var(--green); }
        .lp-card-title {
          font-family: "Fraunces", "Manrope", serif;
          font-weight: 600;
          font-size: 25px;
          line-height: 1.1;
          margin: 2px 0 0;
        }
        .lp-card-body {
          color: var(--muted);
          font-size: 14px;
          line-height: 1.55;
          margin: 0;
          flex: 1;
        }
        .lp-cta {
          margin-top: 10px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          font-weight: 700;
          font-size: 14px;
          color: var(--honey);
        }
        .lp-green .lp-cta { color: var(--green); }
        .lp-plain .lp-cta { color: var(--paper); }
        .lp-cta svg { transition: transform 0.22s; }
        .lp-card:hover .lp-cta svg { transform: translateX(4px); }
        .lp-foot {
          position: relative;
          z-index: 1;
          margin-top: 8px;
          padding-top: 18px;
          border-top: 1px solid var(--line);
          display: flex;
          justify-content: space-between;
          gap: 14px;
          flex-wrap: wrap;
          color: var(--faint);
          font-size: 12px;
        }
        .lp-foot-link {
          color: var(--faint);
          text-decoration: underline;
          text-underline-offset: 3px;
          transition: color 0.2s ease;
        }
        .lp-foot-link:hover {
          color: var(--honey-2);
        }
      `}</style>
    </div>
  );
}
