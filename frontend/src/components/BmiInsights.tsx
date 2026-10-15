import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sparkles,
  RefreshCw,
  TriangleAlert,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Repeat,
} from "lucide-react";
import "./BmiInsights.css";

/*
 * ============================================================
 * BMI INSIGHTS (admin dashboard)
 *
 * A plain-language summary of exactly what the dashboard's month
 * filter is showing: where personnel stand against the PNP
 * acceptable BMI for their age, the highest-priority cases, who
 * improved since their last assessment, the trend against the
 * previous month and suggested follow-up. Produced by the local AI
 * model when one is running, otherwise by built-in rules. Data-
 * quality warnings always come from rules and are shown first.
 * Endpoint: GET /bmi-insights/dashboard.
 *
 * Built on the dashboard's own classes (card, card-header,
 * secondary-button in Dashboard.css) so it looks like the rest of
 * the page.
 * ============================================================
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

export type InsightScopeFilters = {
  // Inclusive start and exclusive end, 'YYYY-MM-DD'. Both null = all records.
  from: string | null;
  to: string | null;
};

type DashboardInsights = {
  source: "local-model" | "rules";
  model: string | null;
  note: string | null;
  generated_at: string;
  scope: { label: string; from: string | null; to: string | null };
  stats: {
    total: number;
    personnel: number;
    standing: {
      within: number;
      above: number;
      underweight: number;
      unknown: number;
    };
    progress: {
      basis: "previous" | "first";
      reassessed: number;
      improved: number;
      worsened: number;
      unchanged: number;
    } | null;
  };
  summary: string;
  findings: string[];
  suggestions: string[];
  data_quality: string[];
};

function percent(part: number, whole: number) {
  return whole > 0 ? `${Math.round((part / whole) * 100)}%` : "0%";
}

export default function BmiInsights({
  scope,
  ready,
}: {
  scope: InsightScopeFilters;
  // False while the dashboard itself is still loading its records.
  ready: boolean;
}) {
  const [data, setData] = useState<DashboardInsights | null>(null);
  const [loading, setLoading] = useState(false);
  // Kept with the month it was for, so it is not shown against another one.
  const [failure, setFailure] = useState<{
    text: string;
    from: string | null;
    to: string | null;
  } | null>(null);

  // Ignore an answer that arrives after a newer request was made.
  const requestId = useRef(0);

  const { from, to } = scope;

  const load = useCallback(
    async (refresh: boolean) => {
      const id = ++requestId.current;

      setLoading(true);
      setFailure(null);

      const params = new URLSearchParams();
      if (from) params.set("from", from);
      if (to) params.set("to", to);
      if (refresh) params.set("refresh", "1");

      try {
        const response = await fetch(
          `${API_BASE_URL}/bmi-insights/dashboard?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("authToken")}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const body: DashboardInsights = await response.json();

        if (id === requestId.current) {
          setData(body);
        }
      } catch (err) {
        if (id === requestId.current) {
          setFailure({
            text:
              err instanceof Error
                ? `Could not load insights (${err.message}).`
                : "Could not load insights.",
            from,
            to,
          });
        }
      } finally {
        if (id === requestId.current) {
          setLoading(false);
        }
      }
    },
    [from, to]
  );

  // Re-run whenever the month filter changes. A short delay stops a burst
  // of quick changes from starting several (slow) model runs.
  useEffect(() => {
    if (!ready) {
      return;
    }

    const timer = window.setTimeout(() => load(false), 350);

    return () => window.clearTimeout(timer);
  }, [ready, load]);

  // The result on screen is only valid while it describes the month that
  // is selected now; right after a change show the skeleton instead.
  const current =
    data !== null &&
    (data.scope.from ?? null) === from &&
    (data.scope.to ?? null) === to;

  const error =
    failure && failure.from === from && failure.to === to ? failure.text : "";

  const showing = loading || !ready || (!error && !current);
  const stats = data?.stats;
  const progress = stats?.progress ?? null;

  return (
    <section
      className="card bmi-insights-card"
      aria-live="polite"
      aria-busy={showing}
    >
      <div className="card-header">
        <div>
          <h3 className="bi-title">
            <span className="bi-title-icon">
              <Sparkles size={14} strokeWidth={2.25} />
            </span>
            BMI Insights
          </h3>
          <p>
            {data && !showing
              ? `Duty fitness of personnel assessed ${
                  data.scope.label === "all records"
                    ? "across all records"
                    : `in ${data.scope.label}`
                }, against the PNP acceptable BMI for their age.`
              : "Based on the month selected above. Change the month to update it."}
          </p>
        </div>

        <button
          type="button"
          className="secondary-button bi-refresh"
          onClick={() => load(true)}
          disabled={showing}
        >
          <RefreshCw
            size={13}
            strokeWidth={2.25}
            className={showing ? "bi-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {showing && (
        <div className="bi-skeleton" role="status">
          <div className="bi-tiles">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="bi-skel bi-skel-tile" />
            ))}
          </div>
          <span className="bi-skel bi-skel-line wide" />
          <span className="bi-skel bi-skel-line" />
          <p className="bi-loading">
            Analyzing assessments… the local AI model can take a little while.
          </p>
        </div>
      )}

      {error && !showing && (
        <div className="bi-box bi-error" role="alert">
          {error}
        </div>
      )}

      {data && stats && !showing && !error && (
        <>
          <div className="bi-meta">
            <span
              className={`bi-source ${
                data.source === "local-model" ? "ai" : "rules"
              }`}
            >
              {data.source === "local-model"
                ? `Local AI · ${data.model}`
                : "Rule-based"}
            </span>

            <span>
              {stats.total} assessments · {stats.personnel} personnel ·
              generated{" "}
              {new Date(data.generated_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {data.note && <p className="bi-note">{data.note}</p>}

          {data.data_quality.length > 0 && (
            <div className="bi-box bi-alert" role="alert">
              <div className="bi-box-title">
                <TriangleAlert size={13} strokeWidth={2.25} />
                Check these records
              </div>
              <ul className="bi-list">
                {data.data_quality.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {stats.personnel > 0 && (
            <div className="bi-tiles">
              <div className="bi-tile bi-within">
                <div className="bi-tile-top">
                  <span>Within PNP Standard</span>
                  <span className="bi-tile-icon">
                    <ShieldCheck size={15} strokeWidth={2} />
                  </span>
                </div>
                <strong>{stats.standing.within}</strong>
                <small>
                  {percent(stats.standing.within, stats.personnel)} of personnel
                </small>
              </div>

              <div className="bi-tile bi-above">
                <div className="bi-tile-top">
                  <span>Above Standard</span>
                  <span className="bi-tile-icon">
                    <TrendingUp size={15} strokeWidth={2} />
                  </span>
                </div>
                <strong>{stats.standing.above}</strong>
                <small>
                  {percent(stats.standing.above, stats.personnel)} overweight or
                  obese
                </small>
              </div>

              <div className="bi-tile bi-under">
                <div className="bi-tile-top">
                  <span>Underweight</span>
                  <span className="bi-tile-icon">
                    <TrendingDown size={15} strokeWidth={2} />
                  </span>
                </div>
                <strong>{stats.standing.underweight}</strong>
                <small>
                  {percent(stats.standing.underweight, stats.personnel)} of
                  personnel
                </small>
              </div>

              <div className="bi-tile bi-reassessed">
                <div className="bi-tile-top">
                  <span>Improved</span>
                  <span className="bi-tile-icon">
                    <Repeat size={15} strokeWidth={2} />
                  </span>
                </div>
                <strong>{progress ? progress.improved : "—"}</strong>
                <small>
                  {progress
                    ? `of ${progress.reassessed} re-assessed · ${progress.worsened} worsened`
                    : "No re-assessments yet"}
                </small>
              </div>
            </div>
          )}

          <div className="bi-box bi-summary">
            <div className="bi-box-title">Summary</div>
            <p>{data.summary}</p>
          </div>

          {(data.findings.length > 0 || data.suggestions.length > 0) && (
            <div className="bi-columns">
              {data.findings.length > 0 && (
                <div className="bi-box">
                  <div className="bi-box-title">Findings</div>
                  <ul className="bi-list">
                    {data.findings.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {data.suggestions.length > 0 && (
                <div className="bi-box">
                  <div className="bi-box-title">Suggested Actions</div>
                  <ul className="bi-list">
                    {data.suggestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <p className="bi-disclaimer">
            For health awareness only. This is not a diagnosis; refer
            personnel to the health service for medical advice.
          </p>
        </>
      )}
    </section>
  );
}
