export default function Loading() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-panel-top">
          <div className="masthead">
            <div className="masthead-name">
              ASL <em>Pilot</em>
            </div>
            <div className="masthead-meta">Composing studio</div>
          </div>
          <div className="brand-mark">Preparing</div>
        </div>
        <div className="auth-panel-body">
          <h1>
            <span className="nonital">Lights</span>{" "}
            <span className="accent">up.</span>
          </h1>
          <p className="auth-lede">
            Preparing the camera viewport and loading your prompt catalog.
          </p>
        </div>
        <div className="auth-panel-footer" />
      </section>
      <div className="auth-form-side" />
    </main>
  );
}
