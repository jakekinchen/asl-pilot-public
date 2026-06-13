"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type {
  LabelVisibilityStatus,
  RoiCropStatus,
  RoiReviewData,
  RoiReviewDecision,
  RoiReviewIntake,
  RoiReviewPacketStatus,
  RoiReviewReviewer,
} from "@/lib/roi-review-types";

type DraftResponse = {
  status?: string;
  returned_packet?: unknown;
  staged_packet?: string;
  runs?: Record<string, { exit_code: number | null; stdout: string; stderr: string }>;
  blockers?: string[];
  error?: string;
  next_action?: string;
};

const LABELS = ["answer", "first", "small", "stop", "wait"];
const EMPTY_REVIEWER: RoiReviewReviewer = {
  name: "",
  role: "",
  qualification: "",
  affiliation_or_context: "",
  contact_or_signed_evidence: "",
  reviewed_at: new Date().toISOString(),
};
const EMPTY_DECISION: RoiReviewDecision = {
  roi_crop_status: "needs_manual_roi",
  label_visibility_status: "ambiguous",
  recommended_next_step: "",
  notes: "",
};
const ROI_LABELS: Record<RoiCropStatus, string> = {
  approved_for_next_extraction: "Approve",
  needs_manual_roi: "Manual ROI",
  needs_keypoints: "Keypoints",
  reject_crop: "Reject",
};
const VISIBILITY_LABELS: Record<LabelVisibilityStatus, string> = {
  visible: "Visible",
  ambiguous: "Ambiguous",
  not_visible: "Not visible",
};

export function RoiReviewApp() {
  const [data, setData] = useState<RoiReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewer, setReviewer] = useState<RoiReviewReviewer>(EMPTY_REVIEWER);
  const [packetStatus, setPacketStatus] = useState<RoiReviewPacketStatus>("reviewed_roi_keypoint_packet_rejected");
  const [decisions, setDecisions] = useState<Record<string, RoiReviewDecision>>(
    Object.fromEntries(LABELS.map((label) => [label, { ...EMPTY_DECISION }])),
  );
  const [activeLabel, setActiveLabel] = useState("answer");
  const [result, setResult] = useState<DraftResponse | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/review/asl-citizen-primarymath-roi", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(await response.text());
        return response.json() as Promise<RoiReviewData>;
      })
      .then((payload) => {
        if (!cancelled) {
          setData(payload);
          setLoading(false);
        }
      })
      .catch((fetchError) => {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Unable to load review data.");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const active = data?.labels.find((label) => label.label_id === activeLabel) ?? data?.labels[0] ?? null;
  const completedCount = useMemo(() => {
    return Object.values(decisions).filter((decision) =>
      decision.recommended_next_step.trim() &&
      decision.notes.trim() &&
      decision.roi_crop_status &&
      decision.label_visibility_status
    ).length;
  }, [decisions]);
  const canSubmit = completedCount === (data?.labels.length ?? LABELS.length) &&
    Object.values(reviewer).every((value) => value.trim().length > 0);

  const intake = useMemo<RoiReviewIntake>(() => ({
    schema_version: "asl-pilot-asl-citizen-primarymath-roi-review-intake/v1",
    status: packetStatus,
    reviewer,
    decisions,
  }), [decisions, packetStatus, reviewer]);

  const updateDecision = useCallback((labelId: string, patch: Partial<RoiReviewDecision>) => {
    setDecisions((current) => ({
      ...current,
      [labelId]: {
        ...(current[labelId] ?? EMPTY_DECISION),
        ...patch,
      },
    }));
  }, []);

  const setAllApproved = useCallback(() => {
    setPacketStatus("reviewed_roi_keypoint_packet_ready_for_manifest_export");
    setDecisions(Object.fromEntries((data?.labels ?? []).map((label) => [
      label.label_id,
      {
        roi_crop_status: "approved_for_next_extraction",
        label_visibility_status: "visible",
        recommended_next_step: "Export reviewed ROI manifests for this label.",
        notes: "Contact sheet reviewed; ROI coverage and label visibility are acceptable for the next extraction step.",
      },
    ])));
  }, [data?.labels]);

  const setAllManual = useCallback(() => {
    setPacketStatus("reviewed_roi_keypoint_packet_rejected");
    setDecisions(Object.fromEntries((data?.labels ?? []).map((label) => [
      label.label_id,
      {
        roi_crop_status: "needs_manual_roi",
        label_visibility_status: "ambiguous",
        recommended_next_step: "Do not export reviewed ROI manifests until manual ROI or keypoint remediation is complete.",
        notes: "Contact sheet requires reviewer follow-up before manifest export.",
      },
    ])));
  }, [data?.labels]);

  const submit = useCallback(async (action: "draft" | "stage_audit_export") => {
    setBusy(true);
    setResult(null);
    try {
      const response = await fetch("/api/review/asl-citizen-primarymath-roi", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, intake }),
      });
      const payload = await response.json() as DraftResponse;
      setResult(payload);
    } catch (submitError) {
      setResult({ error: submitError instanceof Error ? submitError.message : "Review action failed." });
    } finally {
      setBusy(false);
    }
  }, [intake]);

  const downloadPacket = useCallback(() => {
    const packet = result?.returned_packet;
    if (!packet) return;
    const blob = new Blob([`${JSON.stringify(packet, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "returned-roi-review.json";
    link.click();
    URL.revokeObjectURL(url);
  }, [result?.returned_packet]);

  if (loading) {
    return <main className="roi-review-shell"><div className="roi-review-status">Loading review packet</div></main>;
  }
  if (error || !data || !active) {
    return <main className="roi-review-shell"><div className="roi-review-status">{error ?? "Review packet unavailable."}</div></main>;
  }

  return (
    <main className="roi-review-shell">
      <header className="roi-review-topbar">
        <div>
          <div className="brand-mark">ASL Pilot</div>
          <h1>ROI Review</h1>
        </div>
        <div className="roi-review-gate">
          <span>{data.current_gate.review_status}</span>
          <span>{completedCount}/{data.labels.length}</span>
        </div>
      </header>

      <section className="roi-review-layout">
        <aside className="roi-review-sidebar">
          <div className="roi-review-panel">
            <h2>Reviewer</h2>
            <input value={reviewer.name} onChange={(event) => setReviewer({ ...reviewer, name: event.target.value })} placeholder="Name" />
            <input value={reviewer.role} onChange={(event) => setReviewer({ ...reviewer, role: event.target.value })} placeholder="Role" />
            <input value={reviewer.qualification} onChange={(event) => setReviewer({ ...reviewer, qualification: event.target.value })} placeholder="Qualification" />
            <input value={reviewer.affiliation_or_context} onChange={(event) => setReviewer({ ...reviewer, affiliation_or_context: event.target.value })} placeholder="Affiliation/context" />
            <input value={reviewer.contact_or_signed_evidence} onChange={(event) => setReviewer({ ...reviewer, contact_or_signed_evidence: event.target.value })} placeholder="Contact or evidence reference" />
            <input value={reviewer.reviewed_at} onChange={(event) => setReviewer({ ...reviewer, reviewed_at: event.target.value })} placeholder="Reviewed at ISO timestamp" />
          </div>

          <div className="roi-review-panel">
            <h2>Packet</h2>
            <select value={packetStatus} onChange={(event) => setPacketStatus(event.target.value as RoiReviewPacketStatus)}>
              {data.allowed.packet_statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <div className="roi-review-actions compact">
              <button type="button" onClick={setAllApproved}>Approve all</button>
              <button type="button" onClick={setAllManual}>Manual all</button>
            </div>
          </div>

          <nav className="roi-review-label-list" aria-label="Review labels">
            {data.labels.map((label) => (
              <button
                key={label.label_id}
                type="button"
                className={label.label_id === activeLabel ? "active" : ""}
                onClick={() => setActiveLabel(label.label_id)}
              >
                <span>{label.label_id}</span>
                <small>{decisions[label.label_id]?.roi_crop_status ?? "pending"}</small>
              </button>
            ))}
          </nav>
        </aside>

        <section className="roi-review-workspace">
          <div className="roi-review-image-strip">
            <div className="roi-review-image-frame">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={active.contact_sheet.url} alt={`${active.label_id} contact sheet`} />
            </div>
            <div className="roi-review-evidence">
              <h2>{active.label_id}</h2>
              <p>{active.review_priority}</p>
              <p>{active.sampled_clip_count} clips · {active.contact_sheet.sha256.slice(0, 12)}</p>
              {active.low_recall_evidence.length > 0 && (
                <dl>
                  {active.low_recall_evidence.map((item) => (
                    <div key={`${item.source}-${item.recall}`}>
                      <dt>{item.source}</dt>
                      <dd>{item.recall.toFixed(3)} / {item.support}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>

          <div className="roi-review-decision">
            <Segmented
              label="ROI crop"
              value={decisions[active.label_id]?.roi_crop_status}
              options={data.allowed.roi_crop_statuses}
              labels={ROI_LABELS}
              onChange={(value) => updateDecision(active.label_id, { roi_crop_status: value })}
            />
            <Segmented
              label="Visibility"
              value={decisions[active.label_id]?.label_visibility_status}
              options={data.allowed.label_visibility_statuses}
              labels={VISIBILITY_LABELS}
              onChange={(value) => updateDecision(active.label_id, { label_visibility_status: value })}
            />
            <textarea
              value={decisions[active.label_id]?.recommended_next_step ?? ""}
              onChange={(event) => updateDecision(active.label_id, { recommended_next_step: event.target.value })}
              placeholder="Recommended next step"
              rows={3}
            />
            <textarea
              value={decisions[active.label_id]?.notes ?? ""}
              onChange={(event) => updateDecision(active.label_id, { notes: event.target.value })}
              placeholder="Review notes"
              rows={4}
            />
          </div>
        </section>

        <aside className="roi-review-output">
          <div className="roi-review-panel">
            <h2>Output</h2>
            <p>{data.current_gate.archive_path}</p>
            <p>{data.current_gate.archive_sha256.slice(0, 20)}</p>
            <div className="roi-review-actions">
              <button type="button" disabled={busy || !canSubmit} onClick={() => void submit("draft")}>Draft JSON</button>
              <button type="button" disabled={busy || !canSubmit} onClick={() => void submit("stage_audit_export")}>Stage + audit</button>
              <button type="button" disabled={!result?.returned_packet} onClick={downloadPacket}>Download</button>
            </div>
          </div>

          {result && (
            <div className="roi-review-result">
              <strong>{result.status ?? "error"}</strong>
              {result.error && <p>{result.error}</p>}
              {result.blockers?.map((blocker) => <p key={blocker}>{blocker}</p>)}
              {result.next_action && <p>{result.next_action}</p>}
              {result.runs && Object.entries(result.runs).map(([name, run]) => (
                <details key={name}>
                  <summary>{name}: {run.exit_code}</summary>
                  <pre>{run.stdout || run.stderr}</pre>
                </details>
              ))}
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function Segmented<T extends string>({
  label,
  value,
  options,
  labels,
  onChange,
}: {
  label: string;
  value: T;
  options: T[];
  labels: Record<T, string>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="roi-review-segmented">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            key={option}
            type="button"
            className={option === value ? "selected" : ""}
            onClick={() => onChange(option)}
          >
            {labels[option]}
          </button>
        ))}
      </div>
    </div>
  );
}
