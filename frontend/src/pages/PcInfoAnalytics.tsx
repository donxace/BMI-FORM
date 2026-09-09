import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";
import { CheckCircle2, LayoutDashboard, FileText, AlertTriangle, ShieldAlert } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type Assessment = {
  id: number;
  device_type: "desktops" | "laptops" | null;
  device_id: number | null;
  serial_no: string | null;
  os_edition: string | null;
  os_build: string | null;
  tpm_present: boolean | null;
  defender_enabled: boolean | null;
  risk_score: number | null;
  risk_level: string | null;
  hostname: string | null;
  assessed_at: string | null;
  created_at: string;
  device_name: string;
  owner_name: string | null;
  division_name: string | null;
  device_status: boolean | null;
};

const DIVISION_COLORS = ["#1d4ed8", "#7c3aed", "#0d9488", "#f59e0b", "#ef4444", "#22c55e", "#0891b2", "#db2777"];
const RISK_ORDER = ["HIGH", "MEDIUM", "LOW"];
const PERIOD_LABELS: Record<string, string> = { today: "Today", month: "This Month", year: "This Year" };

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("pcInfoAuthToken")}` };
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function riskBadgeClass(level: string | null) {
  if (level === "HIGH") return "obese";
  if (level === "MEDIUM") return "overweight";
  if (level === "LOW") return "normal";
  return "underweight";
}

export default function PcInfoAnalytics() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [divisionFilter, setDivisionFilter] = useState("");
  const [riskFilter, setRiskFilter] = useState("");
  const [osFilter, setOsFilter] = useState("");
  const [period, setPeriod] = useState("all");

  const currentDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/pc-info/assessments`, { headers: authHeaders() });
        if (!response.ok) throw new Error("Failed to load analytics data.");
        setAssessments(await response.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load analytics data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  function clearFilters() {
    setDivisionFilter("");
    setRiskFilter("");
    setOsFilter("");
    setPeriod("all");
  }

  const filteredAssessments = useMemo(() => {
    const now = new Date();
    return assessments.filter((a) => {
      const division = a.division_name ?? "Unassigned";
      const matchesDivision = !divisionFilter || division === divisionFilter;
      const matchesRisk = !riskFilter || a.risk_level === riskFilter;
      const matchesOs = !osFilter || a.os_edition === osFilter;

      let matchesPeriod = true;
      const dateValue = a.assessed_at ?? a.created_at;
      if (period !== "all" && dateValue) {
        const assessed = new Date(dateValue);
        if (period === "today") matchesPeriod = assessed.toDateString() === now.toDateString();
        else if (period === "month") matchesPeriod = assessed.getMonth() === now.getMonth() && assessed.getFullYear() === now.getFullYear();
        else if (period === "year") matchesPeriod = assessed.getFullYear() === now.getFullYear();
      } else if (period !== "all" && !dateValue) {
        matchesPeriod = false;
      }

      return matchesDivision && matchesRisk && matchesOs && matchesPeriod;
    });
  }, [assessments, divisionFilter, riskFilter, osFilter, period]);

  const totalAssessments = filteredAssessments.length;
  const highRiskCount = filteredAssessments.filter((a) => a.risk_level === "HIGH").length;
  const lowRiskCount = filteredAssessments.filter((a) => a.risk_level === "LOW").length;
  const divisionsCovered = new Set(filteredAssessments.map((a) => a.division_name ?? "Unassigned")).size;
  const avgRiskScore = useMemo(() => {
    const scored = filteredAssessments.filter((a) => a.risk_score !== null);
    if (scored.length === 0) return 0;
    return scored.reduce((sum, a) => sum + (a.risk_score ?? 0), 0) / scored.length;
  }, [filteredAssessments]);

  const distinctDivisions = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.division_name ?? "Unassigned"))).sort(),
    [assessments]
  );
  const distinctOsEditions = useMemo(
    () => Array.from(new Set(assessments.map((a) => a.os_edition).filter((v): v is string => !!v))).sort(),
    [assessments]
  );

  const osCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of filteredAssessments) {
      const label = a.os_edition ?? "Unknown";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [filteredAssessments]);

  const mostCommonOs = osCounts[0]?.[0] ?? "—";

  const riskCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of filteredAssessments) {
      const level = a.risk_level ?? "UNKNOWN";
      counts.set(level, (counts.get(level) ?? 0) + 1);
    }
    return RISK_ORDER.filter((level) => counts.has(level))
      .map((level) => ({
        level,
        count: counts.get(level) ?? 0,
        percentage: totalAssessments > 0 ? Math.round(((counts.get(level) ?? 0) / totalAssessments) * 100) : 0,
      }))
      .concat(
        counts.has("UNKNOWN")
          ? [{ level: "UNKNOWN", count: counts.get("UNKNOWN") ?? 0, percentage: totalAssessments > 0 ? Math.round(((counts.get("UNKNOWN") ?? 0) / totalAssessments) * 100) : 0 }]
          : []
      );
  }, [filteredAssessments, totalAssessments]);

  const divisionAnalytics = useMemo(() => {
    const byDivision = new Map<string, { count: number; high: number; low: number }>();
    for (const a of filteredAssessments) {
      const name = a.division_name ?? "Unassigned";
      const entry = byDivision.get(name) ?? { count: 0, high: 0, low: 0 };
      entry.count += 1;
      if (a.risk_level === "HIGH") entry.high += 1;
      if (a.risk_level === "LOW") entry.low += 1;
      byDivision.set(name, entry);
    }
    return Array.from(byDivision.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.count - a.count);
  }, [filteredAssessments]);

  const divisionNames = useMemo(() => divisionAnalytics.map((d) => d.name).slice(0, 8), [divisionAnalytics]);

  const divisionTrendData = useMemo(() => {
    const buckets = new Map<string, Record<string, any>>();
    for (const a of filteredAssessments) {
      const dateValue = a.assessed_at ?? a.created_at;
      if (!dateValue) continue;
      const parsed = new Date(dateValue);
      if (isNaN(parsed.getTime())) continue;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      const label = parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const name = a.division_name ?? "Unassigned";
      if (!divisionNames.includes(name)) continue;

      const bucket = buckets.get(key) ?? { month: label, sortKey: key };
      bucket[name] = (bucket[name] ?? 0) + 1;
      buckets.set(key, bucket);
    }
    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredAssessments, divisionNames]);

  const recentAssessments = useMemo(
    () => [...filteredAssessments].sort((a, b) => {
      const aTime = new Date(a.assessed_at ?? a.created_at).getTime();
      const bTime = new Date(b.assessed_at ?? b.created_at).getTime();
      return bTime - aTime;
    }).slice(0, 8),
    [filteredAssessments]
  );

  const highRiskAttention = useMemo(
    () => filteredAssessments
      .filter((a) => a.risk_level === "HIGH")
      .sort((a, b) => (b.risk_score ?? 0) - (a.risk_score ?? 0)),
    [filteredAssessments]
  );

  function toggleDivisionFilter(name: string) {
    setDivisionFilter((prev) => (prev === name ? "" : name));
  }

  function toggleRiskFilter(level: string) {
    setRiskFilter((prev) => (prev === level ? "" : level));
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onClear: () => void }[] = [];
    if (divisionFilter) pills.push({ key: "division", label: `Division: ${divisionFilter}`, onClear: () => setDivisionFilter("") });
    if (riskFilter) pills.push({ key: "risk", label: `Risk: ${riskFilter}`, onClear: () => setRiskFilter("") });
    if (osFilter) pills.push({ key: "os", label: `OS: ${osFilter}`, onClear: () => setOsFilter("") });
    if (period !== "all") pills.push({ key: "period", label: `Period: ${PERIOD_LABELS[period] ?? period}`, onClear: () => setPeriod("all") });
    return pills;
  }, [divisionFilter, riskFilter, osFilter, period]);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate("/pc-info/dashboard")}>PC Information System</span> / Analytics
          </div>
          <h1>PC Info Analytics</h1>
          <p>Analyze fleet risk distribution, division coverage, and security assessment trends.</p>
        </div>
        <div className="analytics-header-right">
          <div className="analytics-quicknav">
            <button onClick={() => navigate("/pc-info/dashboard")}><LayoutDashboard size={13} strokeWidth={2.25} /> Dashboard</button>
            <button onClick={() => navigate("/pc-info/report")}><FileText size={13} strokeWidth={2.25} /> Report</button>
          </div>
          <div className="analytics-date">
            <span>TODAY</span>
            <strong>{currentDate}</strong>
          </div>
        </div>
      </div>

      <section className="analytics-card">
        <div className="section-header">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>Analytics Filters</h2>
              <p>Adjust the population used for the analytics below.</p>
            </div>
          </div>
          <button className="clear-analytics-button" onClick={clearFilters}>Clear Filters</button>
        </div>

        <div className="analytics-filter-grid">
          <div className="analytics-field">
            <label>DIVISION</label>
            <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
              <option value="">All Divisions</option>
              {distinctDivisions.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label>RISK LEVEL</label>
            <select value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}>
              <option value="">All Levels</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
            </select>
          </div>

          <div className="analytics-field">
            <label>OS EDITION</label>
            <select value={osFilter} onChange={(e) => setOsFilter(e.target.value)}>
              <option value="">All Editions</option>
              {distinctOsEditions.map((os) => (
                <option key={os} value={os}>{os}</option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label>PERIOD</label>
            <select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>
        </div>

        {activeFilterPills.length > 0 && (
          <div className="active-filter-pills">
            {activeFilterPills.map((pill) => (
              <button key={pill.key} className="filter-pill" onClick={pill.onClear}>
                {pill.label}
                <span className="filter-pill-x">×</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="analytics-summary">
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Clear filters and view all assessments"
          onClick={clearFilters}
          onKeyDown={(e) => { if (e.key === "Enter") clearFilters(); }}
        >
          <div className="analytics-icon blue">#</div>
          <div><span>ASSESSMENTS</span><strong>{totalAssessments}</strong><small>Filtered records</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Filter to high-risk assessments"
          onClick={() => toggleRiskFilter("HIGH")}
          onKeyDown={(e) => { if (e.key === "Enter") toggleRiskFilter("HIGH"); }}
        >
          <div className="analytics-icon red"><AlertTriangle size={18} strokeWidth={2} /></div>
          <div><span>HIGH RISK</span><strong>{highRiskCount}</strong><small>{totalAssessments > 0 ? `${((highRiskCount / totalAssessments) * 100).toFixed(1)}%` : "0%"} of filtered</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Filter to low-risk assessments"
          onClick={() => toggleRiskFilter("LOW")}
          onKeyDown={(e) => { if (e.key === "Enter") toggleRiskFilter("LOW"); }}
        >
          <div className="analytics-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
          <div><span>LOW RISK</span><strong>{lowRiskCount}</strong><small>{totalAssessments > 0 ? `${((lowRiskCount / totalAssessments) * 100).toFixed(1)}%` : "0%"} of filtered</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Jump to division breakdown"
          onClick={() => scrollToSection("division-analysis")}
          onKeyDown={(e) => { if (e.key === "Enter") scrollToSection("division-analysis"); }}
        >
          <div className="analytics-icon teal">D</div>
          <div><span>DIVISIONS</span><strong>{divisionsCovered}</strong><small>Covered</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Jump to risk distribution"
          onClick={() => scrollToSection("risk-distribution")}
          onKeyDown={(e) => { if (e.key === "Enter") scrollToSection("risk-distribution"); }}
        >
          <div className="analytics-icon purple"><ShieldAlert size={18} strokeWidth={2} /></div>
          <div><span>AVG RISK SCORE</span><strong>{avgRiskScore.toFixed(1)}</strong><small>Out of 100</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title={`Filter to ${mostCommonOs}`}
          onClick={() => osCounts[0] && setOsFilter((prev) => (prev === osCounts[0][0] ? "" : osCounts[0][0]))}
          onKeyDown={(e) => { if (e.key === "Enter" && osCounts[0]) setOsFilter((prev) => (prev === osCounts[0][0] ? "" : osCounts[0][0])); }}
        >
          <div className="analytics-icon orange">OS</div>
          <div><span>TOP OS</span><strong>{mostCommonOs}</strong><small>Most common edition</small></div>
        </div>
      </section>

      <section className="analytics-card">
        <div className="card-heading">
          <div>
            <h3>Assessments Needing Attention</h3>
            <p>High-risk machines, ranked by risk score.</p>
          </div>
          <span className={`card-tag ${highRiskAttention.length > 0 ? "warning" : ""}`}>
            {highRiskAttention.length > 0 ? `${highRiskAttention.length} HIGH RISK` : "NONE FLAGGED"}
          </span>
        </div>

        {highRiskAttention.length === 0 ? (
          <div className="analytics-empty">
            <CheckCircle2 size={16} strokeWidth={2} style={{ marginRight: 6, verticalAlign: "-3px", color: "#15803d" }} />
            No high-risk machines in this view.
          </div>
        ) : (
          <div className="recent-list">
            {highRiskAttention.slice(0, 6).map((a) => (
              <div className="recent-row" key={`attention-${a.id}`}>
                <div className="recent-avatar" style={{ background: "#fef2f2", color: "#dc2626" }}>
                  <AlertTriangle size={14} strokeWidth={2.25} />
                </div>
                <div className="recent-person">
                  <strong>{a.device_name}</strong>
                  <small>{a.owner_name ?? "Unassigned"} · {a.division_name ?? "Unassigned"}</small>
                </div>
                <span className="classification-badge obese">
                  <span className="classification-dot" />
                  Score {a.risk_score ?? "—"}
                </span>
                <div className="recent-date">Assessed {formatDate(a.assessed_at ?? a.created_at)}</div>
              </div>
            ))}
            {highRiskAttention.length > 6 && (
              <div className="analytics-empty">+{highRiskAttention.length - 6} more high-risk machine(s) in this view.</div>
            )}
          </div>
        )}
      </section>

      <section className="analytics-card">
        <div className="card-heading">
          <div>
            <h3>Assessments by Division</h3>
            <p>Monthly assessment volume across the top divisions.</p>
          </div>
          <span className="card-tag">MONTHLY TREND</span>
        </div>

        {divisionTrendData.length === 0 ? (
          <div className="analytics-empty">No historical trend data available.</div>
        ) : (
          <div style={{ width: "100%", height: 350, marginTop: "1rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={divisionTrendData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }} barCategoryGap="24%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "0.85rem" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} />
                <YAxis allowDecimals={false} stroke="#64748b" style={{ fontSize: "0.85rem" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
                  contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                  labelStyle={{ fontWeight: 700, color: "#172033", marginBottom: 4 }}
                />
                <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "0.85rem" }} />
                {divisionNames.map((name, index) => (
                  <Bar
                    key={name}
                    dataKey={name}
                    name={name}
                    stackId="divisions"
                    fill={DIVISION_COLORS[index % DIVISION_COLORS.length]}
                    radius={index === divisionNames.length - 1 ? [6, 6, 0, 0] : undefined}
                    maxBarSize={48}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="analytics-grid">
        <div className="analytics-card" id="risk-distribution">
          <div className="card-heading">
            <div>
              <h3>Risk Level Distribution</h3>
              <p>Breakdown of assessments by risk level.</p>
            </div>
          </div>

          <div className="distribution">
            {riskCounts.length === 0 ? (
              <div className="analytics-empty">No assessments recorded yet.</div>
            ) : (
              riskCounts.map((item) => (
                <div
                  className={`distribution-row clickable ${riskFilter === item.level ? "active" : ""}`}
                  key={item.level}
                  role="button" tabIndex={0}
                  title={`Filter to ${item.level}`}
                  onClick={() => toggleRiskFilter(item.level)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleRiskFilter(item.level); }}
                >
                  <div className="distribution-info">
                    <span>{item.level}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{
                        width: `${item.percentage}%`,
                        background: item.level === "HIGH" ? "#dc2626" : item.level === "MEDIUM" ? "#c2410c" : item.level === "LOW" ? "#15803d" : "#64748b",
                      }}
                    />
                  </div>
                  <span className="percentage">{item.percentage}%</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Security Profile</h3>
              <p>Key population statistics for the current filters.</p>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <span className="insight-icon blue">#</span>
              <div><strong>Total Assessments</strong><p>{totalAssessments} assessments across {divisionsCovered} divisions.</p></div>
            </div>
            <div className="insight-item">
              <span className="insight-icon purple"><ShieldAlert size={16} strokeWidth={2} /></span>
              <div><strong>Average Risk Score</strong><p>{avgRiskScore.toFixed(1)} out of 100 across filtered assessments.</p></div>
            </div>
            <div className="insight-item">
              <span className="insight-icon orange">OS</span>
              <div><strong>Most Common OS</strong><p>{mostCommonOs} is the most represented edition.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-card" id="division-analysis">
        <div className="card-heading">
          <div>
            <h3>Division Risk Analysis</h3>
            <p>Compare assessment volume and risk across divisions. Click a row to filter by that division.</p>
          </div>
          <span className="card-tag">{divisionAnalytics.length} DIVISIONS</span>
        </div>

        {divisionAnalytics.length === 0 ? (
          <div className="analytics-empty">No division data available.</div>
        ) : (
          <div className="office-table-wrapper">
            <table className="analytics-table">
              <thead>
                <tr>
                  <th>DIVISION</th>
                  <th>ASSESSMENTS</th>
                  <th>HIGH RISK</th>
                  <th>LOW RISK</th>
                </tr>
              </thead>
              <tbody>
                {divisionAnalytics.map((item) => (
                  <tr
                    key={item.name}
                    className={`clickable-row ${divisionFilter === item.name ? "active" : ""}`}
                    title={`Filter to ${item.name}`}
                    onClick={() => toggleDivisionFilter(item.name)}
                  >
                    <td><strong>{item.name}</strong></td>
                    <td>{item.count}</td>
                    <td><span className="mini-badge obese">{item.high}</span></td>
                    <td><span className="mini-badge normal">{item.low}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="analytics-card">
        <div className="card-heading">
          <div>
            <h3>Recent Assessment Activity</h3>
            <p>Latest assessment records within the selected filters.</p>
          </div>
          <span className="card-tag">LATEST</span>
        </div>

        {loading ? (
          <div className="analytics-loading">
            <div className="analytics-spinner" />
            <p>Loading analytics...</p>
          </div>
        ) : error ? (
          <div className="analytics-error">
            <strong>Unable to load analytics</strong>
            <span>{error}</span>
          </div>
        ) : recentAssessments.length === 0 ? (
          <div className="analytics-empty">No assessment records match the selected filters.</div>
        ) : (
          <div className="recent-list">
            {recentAssessments.map((a) => (
              <div className="recent-row" key={a.id}>
                <div className="recent-avatar">{(a.os_edition ?? "PC").slice(0, 2).toUpperCase()}</div>
                <div className="recent-person">
                  <strong>{a.device_name}</strong>
                  <small>{a.owner_name ?? "Unassigned"} · {a.division_name ?? "Unassigned"}</small>
                </div>
                <span className={`classification-badge ${riskBadgeClass(a.risk_level)}`}>
                  <span className="classification-dot" />
                  {a.risk_level ?? "Unknown"}
                </span>
                <div className="recent-date">{formatDate(a.assessed_at ?? a.created_at)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
