import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";

type NotValidatedLane = {
  lane: string;
  status: string;
  boundary: string;
};

type LabelSupport = {
  registry_path?: string;
  status?: string;
  cv_supported_labels?: string[];
  cv_supported_count?: number;
  learn_only_count?: number;
  failed_cv_labels?: unknown[];
};

type ProgressLedger = {
  label?: string;
  current_state?: string;
  completed?: string[];
  remaining?: string[];
  blockers?: string[];
  next_step?: string;
};

type ClaimMatrix = {
  schema_version: string;
  status: string;
  active_cv_claim: unknown;
  label_support?: LabelSupport;
  not_validated_lanes?: NotValidatedLane[];
  progress_ledger?: ProgressLedger;
  provenance_note?: string;
};

type EvidenceReference = {
  label: string;
  kind: string;
  path: string;
  href?: string;
};

export const metadata: Metadata = {
  title: "Validation | ASL Pilot",
  description: "Reviewer-facing ASL Pilot validation claim matrix.",
};

const evidenceReferences: EvidenceReference[] = [
  {
    label: "Product scope design",
    kind: "M3BE receipt",
    path: "docs/validation/return-to-form-product-fallback-scope-design-v1.json",
  },
  {
    label: "Practice fail-closed integration",
    kind: "M3BF receipt",
    path: "docs/validation/return-to-form-product-interactive-integration-no-promotion-v1.json",
  },
  {
    label: "Lesson fail-closed integration",
    kind: "M3BG receipt",
    path: "docs/validation/return-to-form-lesson-interactive-integration-no-promotion-v1.json",
  },
  {
    label: "Validation transparency integration",
    kind: "M3BH receipt",
    path: "docs/validation/return-to-form-validation-interactive-integration-no-promotion-v1.json",
  },
  {
    label: "Public claim matrix",
    kind: "Runtime JSON",
    path: "web/public/model/claim-matrix.json",
    href: "/model/claim-matrix.json",
  },
  {
    label: "Browser model card",
    kind: "Runtime JSON",
    path: "web/public/model/model-card.json",
    href: "/model/model-card.json",
  },
  {
    label: "Browser bundle gates",
    kind: "Runtime JSON",
    path: "web/public/model/browser-model-bundle.json",
    href: "/model/browser-model-bundle.json",
  },
];

function readClaimMatrix(): ClaimMatrix {
  const matrixPath = path.join(process.cwd(), "public", "model", "claim-matrix.json");
  return JSON.parse(fs.readFileSync(matrixPath, "utf8")) as ClaimMatrix;
}

function formatLaneName(value: string) {
  return value.split("_").join(" ");
}

export default function ValidationPage() {
  const matrix = readClaimMatrix();
  const labelSupport = matrix.label_support ?? {};
  const lanes = matrix.not_validated_lanes ?? [];
  const ledger = matrix.progress_ledger ?? {};
  const browserLane = lanes.find((lane) => lane.lane === "browser_raw_rgb_webcam_recognition");

  return (
    <main className="validation-shell">
      <header className="validation-topbar">
        <div className="masthead">
          <div className="masthead-name">
            ASL <em>Pilot</em>
          </div>
          <div className="masthead-meta">Validation</div>
        </div>
        <Link className="ghost-button centered-link" href="/">
          Practice
        </Link>
      </header>

      <section className="validation-summary">
        <div>
          <span className="eyebrow">Reviewer Matrix</span>
          <h1>ASL Pilot Validation</h1>
          <p>
            There is no active CV claim. The only recognition path is the rawframe lane, which is currently
            not_trained. Every prompt-catalog label is learn-only and every attempt is server-side fail-closed
            until a trained rawframe model card is promoted via the trained-card promotion script.
          </p>
        </div>
        <dl className="validation-kpis">
          <div>
            <dt>Matrix status</dt>
            <dd>{matrix.status}</dd>
          </div>
          <div>
            <dt>Active CV claim</dt>
            <dd>none</dd>
          </div>
          <div>
            <dt>Browser model</dt>
            <dd>{browserLane?.status ?? "not_trained"}</dd>
          </div>
          <div>
            <dt>CV-supported labels</dt>
            <dd>{labelSupport.cv_supported_count ?? 0}</dd>
          </div>
          <div>
            <dt>Learn-only prompts</dt>
            <dd>{labelSupport.learn_only_count ?? 0}</dd>
          </div>
        </dl>
      </section>

      <section className="validation-grid">
        <article className="validation-panel validation-panel-wide">
          <div className="panel-heading">
            <span>Not Validated</span>
            <strong>Fail closed</strong>
          </div>
          <div className="boundary-list">
            {lanes.map((lane) => (
              <div key={lane.lane}>
                <span>{formatLaneName(lane.lane)}</span>
                <strong>{lane.status}</strong>
                <p>{lane.boundary}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="validation-panel">
          <div className="panel-heading">
            <span>Current state</span>
            <strong>{ledger.label ?? "Evidence"}</strong>
          </div>
          <p>{ledger.current_state ?? ""}</p>
        </article>

        <article className="validation-panel">
          <div className="panel-heading">
            <span>Completed</span>
            <strong>{ledger.completed?.length ?? 0}</strong>
          </div>
          <ul className="validation-list">
            {(ledger.completed ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="validation-panel">
          <div className="panel-heading">
            <span>Remaining</span>
            <strong>{ledger.remaining?.length ?? 0}</strong>
          </div>
          <ul className="validation-list">
            {(ledger.remaining ?? []).map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {ledger.next_step ? <p>{ledger.next_step}</p> : null}
        </article>

        {ledger.blockers && ledger.blockers.length > 0 ? (
          <article className="validation-panel">
            <div className="panel-heading">
              <span>Blockers</span>
              <strong>{ledger.blockers.length}</strong>
            </div>
            <ul className="validation-list">
              {ledger.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        ) : null}

        {matrix.provenance_note ? (
          <article className="validation-panel validation-panel-wide">
            <div className="panel-heading">
              <span>Provenance</span>
              <strong>Note</strong>
            </div>
            <p>{matrix.provenance_note}</p>
          </article>
        ) : null}

        <article className="validation-panel validation-panel-wide" data-testid="validation-evidence-links">
          <div className="panel-heading">
            <span>Evidence links</span>
            <strong>No promotion</strong>
          </div>
          <p>
            These references make the current fail-closed state inspectable without changing the
            browser model, final gates, or validation claims.
          </p>
          <div className="validation-evidence-list">
            {evidenceReferences.map((item) => (
              <div className="validation-evidence-row" key={item.path}>
                <div>
                  {item.href ? <a href={item.href}>{item.label}</a> : <span>{item.label}</span>}
                  <small>{item.kind}</small>
                </div>
                <code>{item.path}</code>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
