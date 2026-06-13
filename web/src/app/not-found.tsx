import Link from "next/link";

export default function NotFound() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-panel-top">
          <div className="masthead">
            <div className="masthead-name">
              ASL <em>Pilot</em>
            </div>
            <div className="masthead-meta">№ 404 / OFF-CATALOG</div>
          </div>
          <div className="brand-mark">Page missing</div>
        </div>
        <div className="auth-panel-body">
          <h1>
            <span className="nonital">Page</span>{" "}
            <span className="accent">not</span> in catalog.
          </h1>
          <p className="auth-lede">
            The address you followed is not part of the pilot edition. Return
            to the studio to resume practice.
          </p>
        </div>
        <div className="auth-panel-footer" />
      </section>
      <div className="auth-form-side">
        <div className="auth-form">
          <div className="auth-form-heading">
            <span className="eyebrow">Way back</span>
            <h2>Return to studio</h2>
          </div>
          <Link className="primary-button centered-link" href="/">
            To practice
          </Link>
        </div>
      </div>
    </main>
  );
}
