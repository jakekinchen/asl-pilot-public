"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-panel-top">
          <div className="masthead">
            <div className="masthead-name">
              ASL <em>Pilot</em>
            </div>
            <div className="masthead-meta">№ 500 / DARK ROOM</div>
          </div>
          <div className="brand-mark">Studio dark</div>
        </div>
        <div className="auth-panel-body">
          <h1>
            <span className="nonital">A frame</span>{" "}
            <span className="accent">slipped.</span>
          </h1>
          <p className="auth-lede">
            The studio is temporarily unavailable. Reset the session to try
            again — your saved practice history is untouched.
          </p>
        </div>
        <div className="auth-panel-footer" />
      </section>
      <div className="auth-form-side">
        <div className="auth-form">
          <div className="auth-form-heading">
            <span className="eyebrow">Recovery</span>
            <h2>Reset session</h2>
          </div>
          <button className="primary-button" onClick={reset} type="button">
            Try again
          </button>
        </div>
      </div>
    </main>
  );
}
