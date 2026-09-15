import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";
import "./ReportPrint.css";
import {
  type Assessment,
  fetchBmiAssessments,
  filterAssessments,
  filtersFromSearchParams,
  formatDate,
  getClassificationClass,
  getFullName,
} from "../utils/bmiReport";

// Standalone printable version of /report — opened in a new tab (see
// Report.tsx's openPrintableReport) rather than rendered inline, so it
// gets a clean document with no sidebar/nav chrome and its own tab the
// user can print/save-as-PDF independently of the dashboard. Filters
// travel as a query string rather than live component state, since the
// two tabs share nothing but that URL.
export default function ReportPrint() {
  const [searchParams] = useSearchParams();
  const filters = useMemo(() => filtersFromSearchParams(searchParams), [searchParams]);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setAssessments(await fetchBmiAssessments());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load report.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredReports = useMemo(() => filterAssessments(assessments, filters), [assessments, filters]);

  const counts = useMemo(() => {
    const byClass = { Normal: 0, Underweight: 0, Overweight: 0, Obese: 0 };
    for (const a of filteredReports) {
      if (a.who_classification in byClass) byClass[a.who_classification]++;
    }
    return byClass;
  }, [filteredReports]);

  const averageBMI =
    filteredReports.length > 0
      ? filteredReports.reduce((sum, a) => sum + a.bmi, 0) / filteredReports.length
      : 0;

  const appliedFilters = [
    filters.search && `Search: "${filters.search}"`,
    filters.rank && `Rank: ${filters.rank}`,
    filters.office && `Office: ${filters.office}`,
    filters.sex && `Sex: ${filters.sex}`,
    filters.classification && `Classification: ${filters.classification}`,
    filters.dateFilter !== "all" && `Period: ${filters.dateFilter === "today" ? "Today" : filters.dateFilter === "month" ? "This Month" : "This Year"}`,
  ].filter(Boolean) as string[];

  const generatedAt = new Date().toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="print-page">
      {/* Toolbar — hidden by @media print, so it never shows up in the
          printed/saved-as-PDF output itself. */}
      <div className="print-toolbar no-print">
        <span>Printable BMI Report</span>
        <button type="button" onClick={() => window.print()} disabled={loading || filteredReports.length === 0}>
          <Printer size={14} strokeWidth={2.25} />
          Print / Save as PDF
        </button>
      </div>

      {loading ? (
        <div className="print-status">Loading report…</div>
      ) : error ? (
        <div className="print-status print-status-error">{error}</div>
      ) : (
        <div className="print-sheet">
          <header className="print-header">
            <div>
              <span className="print-eyebrow">PNP ITMS — BMI Monitoring</span>
              <h1>BMI Assessment Report</h1>
            </div>
            <div className="print-meta">
              <span>Generated {generatedAt}</span>
              <span>{filteredReports.length} record{filteredReports.length === 1 ? "" : "s"}</span>
            </div>
          </header>

          {appliedFilters.length > 0 && (
            <p className="print-filters">
              <strong>Filters applied:</strong> {appliedFilters.join(" · ")}
            </p>
          )}

          <div className="print-summary">
            <div>
              <span>Total</span>
              <strong>{filteredReports.length}</strong>
            </div>
            <div>
              <span>Average BMI</span>
              <strong>{averageBMI > 0 ? averageBMI.toFixed(1) : "—"}</strong>
            </div>
            <div>
              <span>Normal</span>
              <strong>{counts.Normal}</strong>
            </div>
            <div>
              <span>Underweight</span>
              <strong>{counts.Underweight}</strong>
            </div>
            <div>
              <span>Overweight</span>
              <strong>{counts.Overweight}</strong>
            </div>
            <div>
              <span>Obese</span>
              <strong>{counts.Obese}</strong>
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <p className="print-empty">No records match the applied filters.</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Personnel</th>
                  <th>Rank</th>
                  <th>Office</th>
                  <th>Sex</th>
                  <th>Age</th>
                  <th>BMI</th>
                  <th>Classification</th>
                  <th>Assessment Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((a) => (
                  <tr key={a.assessment_id}>
                    <td>#{String(a.assessment_id).padStart(4, "0")}</td>
                    <td>{getFullName(a.personnel)}</td>
                    <td>{a.personnel?.rank ?? "—"}</td>
                    <td>{a.personnel?.office ?? "—"}</td>
                    <td>{a.personnel?.sex ?? "—"}</td>
                    <td>{a.personnel?.age ?? "—"}</td>
                    <td>{a.bmi > 0 ? a.bmi.toFixed(1) : "N/A"}</td>
                    <td>
                      <span className={`print-badge ${getClassificationClass(a.who_classification)}`}>
                        {a.who_classification}
                      </span>
                    </td>
                    <td>{formatDate(a.assessment_date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
