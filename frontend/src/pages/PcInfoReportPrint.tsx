import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Printer } from "lucide-react";
import "./ReportPrint.css";
import {
  type Assessment,
  fetchPcInfoAssessments,
  filterPcInfoAssessments,
  formatDate,
  pcInfoFiltersFromSearchParams,
  riskBadgeClass,
} from "../utils/pcInfoReport";

// Standalone printable version of /pc-info/report — same pattern as
// ReportPrint.tsx for the BMI domain: opened in a new tab, filters read
// back out of the URL, no dashboard chrome.
export default function PcInfoReportPrint() {
  const [searchParams] = useSearchParams();
  const filters = useMemo(() => pcInfoFiltersFromSearchParams(searchParams), [searchParams]);

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        setAssessments(await fetchPcInfoAssessments());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load report.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredAssessments = useMemo(() => filterPcInfoAssessments(assessments, filters), [assessments, filters]);

  const highRiskCount = filteredAssessments.filter((a) => a.risk_level === "HIGH").length;
  const mediumRiskCount = filteredAssessments.filter((a) => a.risk_level === "MEDIUM").length;
  const lowRiskCount = filteredAssessments.filter((a) => a.risk_level === "LOW").length;
  const divisionsCovered = new Set(filteredAssessments.map((a) => a.division_name ?? "Unassigned")).size;

  const appliedFilters = [
    filters.search && `Search: "${filters.search}"`,
    filters.divisionFilter && `Division: ${filters.divisionFilter}`,
    filters.riskFilter && `Risk Level: ${filters.riskFilter}`,
    filters.osFilter && `OS Edition: ${filters.osFilter}`,
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
      <div className="print-toolbar no-print">
        <span>Printable PC Info Report</span>
        <button type="button" onClick={() => window.print()} disabled={loading || filteredAssessments.length === 0}>
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
              <span className="print-eyebrow">PNP ITMS — PC Information System</span>
              <h1>Security Assessment Report</h1>
            </div>
            <div className="print-meta">
              <span>Generated {generatedAt}</span>
              <span>{filteredAssessments.length} record{filteredAssessments.length === 1 ? "" : "s"}</span>
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
              <strong>{filteredAssessments.length}</strong>
            </div>
            <div>
              <span>High Risk</span>
              <strong>{highRiskCount}</strong>
            </div>
            <div>
              <span>Medium Risk</span>
              <strong>{mediumRiskCount}</strong>
            </div>
            <div>
              <span>Low Risk</span>
              <strong>{lowRiskCount}</strong>
            </div>
            <div>
              <span>Divisions</span>
              <strong>{divisionsCovered}</strong>
            </div>
          </div>

          {filteredAssessments.length === 0 ? (
            <p className="print-empty">No records match the applied filters.</p>
          ) : (
            <table className="print-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Serial No.</th>
                  <th>Owner</th>
                  <th>Division</th>
                  <th>OS Edition</th>
                  <th>Risk Level</th>
                  <th>Assessed Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.device_name}</td>
                    <td>{a.serial_no ?? "—"}</td>
                    <td>{a.owner_name ?? "Unassigned"}</td>
                    <td>{a.division_name ?? "Unassigned"}</td>
                    <td>{a.os_edition ?? "—"}</td>
                    <td>
                      <span className={`print-badge ${riskBadgeClass(a.risk_level)}`}>{a.risk_level ?? "Unknown"}</span>
                    </td>
                    <td>{formatDate(a.assessed_at ?? a.created_at)}</td>
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
