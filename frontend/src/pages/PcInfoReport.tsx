import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Search,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Building2,
  ShieldAlert,
  Download,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Printer,
} from "lucide-react";
import "./Report.css";
import {
  type Assessment,
  fetchPcInfoAssessments,
  filterPcInfoAssessments,
  formatDate,
  pcInfoFiltersToSearchParams,
  riskBadgeClass,
} from "../utils/pcInfoReport";

function formatDateForExcel(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US");
}

export default function PcInfoReport() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [osFilter, setOsFilter] = useState("");

  const currentDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setAssessments(await fetchPcInfoAssessments());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const distinctDivisions = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.division_name ?? "Unassigned"))).sort(),
    [assessments]
  );
  const distinctOsEditions = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.os_edition).filter((v): v is string => !!v))).sort(),
    [assessments]
  );

  const filteredAssessments = useMemo(
    () => filterPcInfoAssessments(assessments, { search, divisionFilter, riskFilter, osFilter }),
    [assessments, search, divisionFilter, riskFilter, osFilter]
  );

  const totalReports = filteredAssessments.length;
  const highRiskCount = filteredAssessments.filter((a) => a.risk_level === "HIGH").length;
  const lowRiskCount = filteredAssessments.filter((a) => a.risk_level === "LOW").length;
  const divisionsCovered = new Set(filteredAssessments.map((a) => a.division_name ?? "Unassigned")).size;
  const matchedCount = filteredAssessments.filter((a) => a.device_status !== null).length;

  const topOs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of filteredAssessments) {
      const label = a.os_edition ?? "";
      if (!label) continue;
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    let best: string | null = null;
    let bestCount = 0;
    for (const [os, count] of counts) {
      if (count > bestCount) { best = os; bestCount = count; }
    }
    return best;
  }, [filteredAssessments]);

  const mostCommonOs = topOs ?? "—";

  function clearFilters() {
    setSearch("");
    setDivisionFilter("");
    setRiskFilter("");
    setOsFilter("");
  }

  function scrollToFilters() {
    document.getElementById("report-filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const exportToExcel = () => {
    if (filteredAssessments.length === 0) {
      window.alert("There are no records to export.");
      return;
    }

    const excelData = filteredAssessments.map((a, index) => ({
      "No.": index + 1,
      "Device": a.device_name,
      "Serial No.": a.serial_no ?? "",
      "Owner": a.owner_name ?? "Unassigned",
      "Division": a.division_name ?? "Unassigned",
      "OS Edition": a.os_edition ?? "",
      "Risk Level": a.risk_level ?? "",
      "Risk Score": a.risk_score ?? "",
      "Assessed Date": formatDateForExcel(a.assessed_at ?? a.created_at),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [{ wch: 6 }, { wch: 26 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PC Info Report");
    XLSX.writeFile(workbook, `PcInfo_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSummaryToExcel = () => {
    if (filteredAssessments.length === 0) {
      window.alert("There are no records to export.");
      return;
    }

    const summaryData = [
      { Metric: "Filtered Records", Value: totalReports },
      { Metric: "High Risk", Value: highRiskCount },
      { Metric: "Low Risk", Value: lowRiskCount },
      { Metric: "Divisions Covered", Value: divisionsCovered },
      { Metric: "Matched to Inventory", Value: matchedCount },
      { Metric: "Most Common OS Edition", Value: mostCommonOs },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    worksheet["!cols"] = [{ wch: 22 }, { wch: 22 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, `PcInfo_Report_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Opens a new tab at /pc-info/report/print carrying the current filters
  // as a query string — same pattern as BMI's Report.tsx.
  const openPrintableReport = () => {
    const query = pcInfoFiltersToSearchParams({ search, divisionFilter, riskFilter, osFilter }).toString();
    window.open(`/pc-info/report/print${query ? `?${query}` : ""}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="report-page">

      <div className="report-header">
        <div>
          <div className="breadcrumb">PC Information System / Reports</div>
          <h1>PC Info Reports</h1>
          <p>Generate and export security assessment reports based on division and risk filters.</p>
        </div>
        <div className="report-date">
          <span>TODAY</span>
          <strong>{currentDate}</strong>
        </div>
      </div>

      <section className="report-generator">
        <div className="generator-content">
          <div className="generator-icon">XLS</div>
          <div>
            <span className="generator-label">REPORT GENERATOR</span>
            <h2>Export Filtered Assessment Records</h2>
            <p>Apply the filters below, then export the matching assessments into an Excel spreadsheet.</p>
          </div>
        </div>

        <div className="generator-actions">
          <button className="summary-export-button" onClick={exportSummaryToExcel} disabled={filteredAssessments.length === 0}>
            Export Summary
          </button>
          <button className="print-report-button" onClick={openPrintableReport} disabled={filteredAssessments.length === 0}>
            <span><Printer size={14} strokeWidth={2.25} /></span>
            Printable Format
          </button>
          <button className="excel-export-button" onClick={exportToExcel} disabled={filteredAssessments.length === 0}>
            <span><Download size={14} strokeWidth={2.25} /></span>
            Export Excel
          </button>
        </div>
      </section>

      <section className="report-summary">
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Clear filters and view all records"
          onClick={clearFilters}
          onKeyDown={(e) => { if (e.key === "Enter") clearFilters(); }}
        >
          <div className="summary-icon blue"><Hash size={18} strokeWidth={2} /></div>
          <div><span>FILTERED RECORDS</span><strong>{totalReports}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${riskFilter === "HIGH" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to high-risk assessments"
          onClick={() => setRiskFilter((prev) => (prev === "HIGH" ? "" : "HIGH"))}
          onKeyDown={(e) => { if (e.key === "Enter") setRiskFilter((prev) => (prev === "HIGH" ? "" : "HIGH")); }}
        >
          <div className="summary-icon red"><AlertTriangle size={18} strokeWidth={2} /></div>
          <div><span>HIGH RISK</span><strong>{highRiskCount}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${riskFilter === "LOW" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to low-risk assessments"
          onClick={() => setRiskFilter((prev) => (prev === "LOW" ? "" : "LOW"))}
          onKeyDown={(e) => { if (e.key === "Enter") setRiskFilter((prev) => (prev === "LOW" ? "" : "LOW")); }}
        >
          <div className="summary-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
          <div><span>LOW RISK</span><strong>{lowRiskCount}</strong></div>
        </div>
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Jump to the division filter"
          onClick={scrollToFilters}
          onKeyDown={(e) => { if (e.key === "Enter") scrollToFilters(); }}
        >
          <div className="summary-icon orange"><Building2 size={18} strokeWidth={2} /></div>
          <div><span>DIVISIONS COVERED</span><strong>{divisionsCovered}</strong></div>
        </div>
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Go to Dashboard"
          onClick={() => navigate("/pc-info/dashboard")}
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/pc-info/dashboard"); }}
        >
          <div className="summary-icon purple"><ShieldAlert size={18} strokeWidth={2} /></div>
          <div><span>MATCHED TO INVENTORY</span><strong>{matchedCount}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${topOs && osFilter === topOs ? "active" : ""}`}
          role="button" tabIndex={0}
          title={`Filter to ${mostCommonOs}`}
          onClick={() => topOs && setOsFilter((prev) => (prev === topOs ? "" : topOs))}
          onKeyDown={(e) => { if (e.key === "Enter" && topOs) setOsFilter((prev) => (prev === topOs ? "" : topOs)); }}
        >
          <div className="summary-icon teal">OS</div>
          <div><span>MOST COMMON OS</span><strong>{mostCommonOs}</strong></div>
        </div>
      </section>

      <section className="report-card" id="report-filters">
        <div className="section-header">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>Assessment Filters</h2>
              <p>Select the assessments you want included in the Excel report.</p>
            </div>
          </div>
          <button className="clear-report-button" onClick={clearFilters}>Clear Filters</button>
        </div>

        <div className="report-filter-grid">
          <div className="report-field search-field">
            <label>SEARCH DEVICE</label>
            <div className="report-search">
              <span><Search size={14} strokeWidth={2} /></span>
              <input type="text" placeholder="Device, serial no., owner..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="report-field">
            <label>DIVISION</label>
            <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
              <option value="">All Divisions</option>
              {distinctDivisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>RISK LEVEL</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="">All Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="report-field">
            <label>OS EDITION</label>
            <select value={osFilter} onChange={(e) => setOsFilter(e.target.value)}>
              <option value="">All Editions</option>
              {distinctOsEditions.map((os) => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section className="report-card table-card">
        <div className="table-header">
          <div className="section-title">
            <span className="section-number">02</span>
            <div>
              <h2>Export Preview</h2>
              <p>These are the records that will be included in your Excel report.</p>
            </div>
          </div>
          <span className="report-count">{filteredAssessments.length} records</span>
        </div>

        {error && (
          <div className="report-error">
            <strong>Unable to load reports</strong>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="report-loading">
            <div className="loading-spinner" />
            <p>Loading report records...</p>
          </div>
        ) : (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>DEVICE</th>
                  <th>SERIAL NO.</th>
                  <th>OWNER</th>
                  <th>DIVISION</th>
                  <th>OS EDITION</th>
                  <th>RISK LEVEL</th>
                  <th>ASSESSED DATE</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssessments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-report">
                      <strong>No matching records</strong>
                      <span>Change your filters to generate a report.</span>
                    </td>
                  </tr>
                ) : (
                  filteredAssessments.map((a) => (
                    <tr key={a.id}>
                      <td><strong>{a.device_name}</strong></td>
                      <td>{a.serial_no ?? "—"}</td>
                      <td>{a.owner_name ?? "Unassigned"}</td>
                      <td>{a.division_name ?? "Unassigned"}</td>
                      <td>{a.os_edition ?? "—"}</td>
                      <td>
                        <span className={`classification-badge ${riskBadgeClass(a.risk_level)}`}>
                          <span className="classification-dot" />
                          {a.risk_level ?? "Unknown"}
                        </span>
                      </td>
                      <td>{formatDate(a.assessed_at ?? a.created_at)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredAssessments.length > 0 && (
          <div className="report-footer">
            Showing <strong>{filteredAssessments.length}</strong> of <strong>{assessments.length}</strong> records
          </div>
        )}
      </section>

      <section className="report-bottom-grid">
        <div className="report-card">
          <div className="small-card-header">
            <div>
              <h3>Excel Report Contents</h3>
              <p>Information included in the exported spreadsheet</p>
            </div>
          </div>

          <div className="report-content-list">
            <div><span><Check size={12} strokeWidth={2.5} /></span>Device Identification</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Serial Numbers</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Owner & Division</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>OS Edition</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Risk Level & Score</div>
          </div>
        </div>

        <div className="report-card">
          <div className="small-card-header">
            <div>
              <h3>Export Actions</h3>
              <p>Generate reports from the current filters</p>
            </div>
          </div>

          <div className="report-actions">
            <button onClick={exportToExcel} disabled={filteredAssessments.length === 0}>
              <span><FileSpreadsheet size={16} strokeWidth={2} /></span>
              <div>
                <strong>Export Excel Report</strong>
                <small>Export all filtered assessment records</small>
              </div>
              <b><ChevronRight size={16} strokeWidth={2} /></b>
            </button>

            <button onClick={exportSummaryToExcel} disabled={filteredAssessments.length === 0}>
              <span><Hash size={16} strokeWidth={2} /></span>
              <div>
                <strong>Export Summary</strong>
                <small>Export assessment statistics</small>
              </div>
              <b><ChevronRight size={16} strokeWidth={2} /></b>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
