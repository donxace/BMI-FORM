import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import "./PcInfoDashboard.css";
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  ChevronRight,
  Radar,
  Gauge,
  Upload,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PC_INFO_CATEGORIES } from "../pcInfoCategories";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

// Reference palette for this page — kept in one place, and matching the
// --pcinfo-* CSS variables in PcInfoDashboard.css, so every chart and
// icon badge draws from the same 4 accents.
const BLUE = "#5b7fee";
const TEAL = "#14b892";
const ORANGE = "#d98a2b";
const RED = "#e2483a";

type Assessment = {
  id: number;
  serial_no: string | null;
  device_type: "desktops" | "laptops" | null;
  device_id: number | null;
  hostname: string | null;
  computer_name: string | null;
  assessed_at: string | null;
  created_at: string;
  motherboard_manufacturer: string | null;
  motherboard_product: string | null;
  motherboard_serial: string | null;
  os_edition: string | null;
  secure_boot_status: string | null;
  tpm_present: boolean | null;
  defender_enabled: boolean | null;
  firewall_domain: boolean | null;
  firewall_private: boolean | null;
  firewall_public: boolean | null;
  risk_score: number | null;
  risk_level: string | null;
  // Added by the backend on top of the raw SecurityAssessment row — see
  // PcInfoService.findAllAssessments.
  device_name: string;
  owner_name: string | null;
  division_name: string | null;
  device_status: boolean | null;
};

const DEVICE_TYPE_LABELS: Record<string, string> = {
  desktops: "Desktop",
  laptops: "Laptop",
};

const ITEMS_PER_PAGE = 10;

type ComponentFinding = {
  id: number;
  status: string | null;
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("pcInfoAuthToken")}` };
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

const chartTooltipStyle = {
  background: "#ffffff",
  border: "1px solid #e5e9ef",
  borderRadius: 6,
  fontSize: "0.78rem",
  color: "#172033",
};

export default function PcInfoDashboard() {
  const navigate = useNavigate();
  // pcinfo_viewer is read-only — importing a new assessment CSV is
  // hidden for that role (the backend rejects the request anyway, but
  // hiding the button avoids a confusing 401).
  const pcInfoRole = localStorage.getItem("pcInfoUserRole");
  const canImport = pcInfoRole === "pcinfo_admin" || pcInfoRole === "pcinfo_editor" || pcInfoRole === "admin";
  const canDelete = pcInfoRole === "pcinfo_admin" || pcInfoRole === "admin";
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [componentFindings, setComponentFindings] = useState<ComponentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const [assessmentsRes, componentRes] = await Promise.all([
        fetch(`${API_BASE_URL}/pc-info/assessments`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/pc-info/component-status`, { headers: authHeaders() }),
      ]);
      if (!assessmentsRes.ok) throw new Error("Failed to load PC assessments.");
      setAssessments(await assessmentsRes.json());
      setComponentFindings(componentRes.ok ? await componentRes.json() : []);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load PC assessments.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleImportFile(file: File) {
    setImporting(true);
    setImportMessage(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`${API_BASE_URL}/pc-info/import`, {
        method: "POST",
        headers: authHeaders(),
        body: formData,
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.message || "Import failed.");
      setImportMessage({
        type: "success",
        text: `Imported assessment #${body.assessmentId}${
          body.matchedDevice ? ` — matched to ${body.matchedDevice.type} #${body.matchedDevice.id}` : " — no matching device found"
        }. Risk: ${body.riskLevel ?? "unknown"} (${body.riskScore ?? "?"}/100).`,
      });
      await load();
    } catch (err) {
      setImportMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Import failed.",
      });
    } finally {
      setImporting(false);
    }
  }

  async function handleDeleteAssessment(assessment: Assessment) {
    if (!window.confirm(`Delete the assessment for "${assessment.device_name}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(assessment.id);
    try {
      const res = await fetch(`${API_BASE_URL}/pc-info/assessments/${assessment.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete this assessment.");
      setAssessments((prev) => prev.filter((a) => a.id !== assessment.id));
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete this assessment.");
    } finally {
      setDeletingId(null);
    }
  }

  const totalPages = Math.max(1, Math.ceil(assessments.length / ITEMS_PER_PAGE));
  const paginatedAssessments = assessments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  const totalAssessments = assessments.length;
  const matchedCount = useMemo(() => assessments.filter((a) => a.device_id !== null).length, [assessments]);
  const highRiskCount = useMemo(
    () => assessments.filter((a) => (a.risk_level ?? "").toUpperCase() === "HIGH").length,
    [assessments]
  );
  const avgRiskScore = useMemo(() => {
    const scored = assessments.filter((a) => a.risk_score !== null);
    if (scored.length === 0) return null;
    return Math.round(scored.reduce((sum, a) => sum + (a.risk_score as number), 0) / scored.length);
  }, [assessments]);

  // Risk Level Distribution — a single-series horizontal bar, one color
  // per bracket (HIGH/MEDIUM/LOW/UNKNOWN) — these colors are reserved
  // status meanings, not a decorative rainbow, matching how risk level
  // is colored everywhere else in this app.
  const riskDistribution = useMemo(() => {
    const order = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];
    const colors: Record<string, string> = { HIGH: RED, MEDIUM: ORANGE, LOW: TEAL, UNKNOWN: "#5b6478" };
    const counts = new Map<string, number>();
    for (const a of assessments) {
      const level = (a.risk_level ?? "").toUpperCase() || "UNKNOWN";
      counts.set(level, (counts.get(level) ?? 0) + 1);
    }
    return order
      .filter((level) => counts.has(level))
      .map((level) => ({ level, count: counts.get(level) as number, fill: colors[level] }));
  }, [assessments]);

  // Security Controls Coverage — grouped (not stacked) so "protected"
  // and "not protected" read as two comparable series per control, the
  // same visual pattern as a grouped-bar-by-category chart.
  const securityCoverage = useMemo(() => {
    const total = assessments.length;
    if (total === 0) return [];

    const secureBootOn = assessments.filter((a) => (a.secure_boot_status ?? "").toUpperCase() === "ENABLED").length;
    const tpmOn = assessments.filter((a) => a.tpm_present === true).length;
    const defenderOn = assessments.filter((a) => a.defender_enabled === true).length;
    const firewallOn = assessments.filter((a) => a.firewall_domain && a.firewall_private && a.firewall_public).length;

    const withLabel = (control: string, protectedCount: number) => ({
      control,
      protected: protectedCount,
      unprotected: total - protectedCount,
    });

    return [
      withLabel("Firewall", firewallOn),
      withLabel("Antivirus", defenderOn),
      withLabel("Secure Boot", secureBootOn),
      withLabel("TPM", tpmOn),
    ];
  }, [assessments]);

  // Component Health — Table 3's pass/fail checklist, aggregated across
  // every imported assessment.
  const componentHealth = useMemo(() => {
    const colors: Record<string, string> = { PASS: TEAL, WARNING: ORANGE, WARN: ORANGE, FAIL: RED };
    const counts = new Map<string, number>();
    for (const f of componentFindings) {
      const status = (f.status ?? "").toUpperCase() || "UNKNOWN";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, fill: colors[status] ?? "#5b6478" }))
      .sort((a, b) => b.count - a.count);
  }, [componentFindings]);

  // Fleet Composition — Desktop / Laptop / Unmatched, the donut's 3
  // segments (same 3-hue treatment as the reference's channel donut).
  const deviceComposition = useMemo(() => {
    let desktops = 0;
    let laptops = 0;
    let unmatched = 0;
    for (const a of assessments) {
      if (a.device_type === "desktops") desktops++;
      else if (a.device_type === "laptops") laptops++;
      else unmatched++;
    }
    return [
      { name: "Desktop", value: desktops, fill: BLUE },
      { name: "Laptop", value: laptops, fill: TEAL },
      { name: "Unmatched", value: unmatched, fill: ORANGE },
    ].filter((d) => d.value > 0);
  }, [assessments]);

  // Devices by Division — plain magnitude, one hue, sorted worst-to-least.
  const divisionBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assessments) {
      const division = a.division_name ?? "Unassigned";
      counts.set(division, (counts.get(division) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([division, count]) => ({ division, count }))
      .sort((a, b) => b.count - a.count);
  }, [assessments]);

  // OS Edition Breakdown — an outdated/unsupported edition still running
  // on the fleet is itself a security signal.
  const osBreakdown = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of assessments) {
      const os = a.os_edition ?? "Unknown";
      counts.set(os, (counts.get(os) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([os, count]) => ({ os, count }))
      .sort((a, b) => b.count - a.count);
  }, [assessments]);

  // Risk Score Over Time — every assessment plotted by when it ran.
  const riskTrend = useMemo(() => {
    return [...assessments]
      .filter((a) => a.assessed_at && a.risk_score !== null)
      .sort((a, b) => new Date(a.assessed_at as string).getTime() - new Date(b.assessed_at as string).getTime())
      .map((a) => ({
        label: new Date(a.assessed_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        machine: a.device_name,
        risk_score: a.risk_score as number,
      }));
  }, [assessments]);

  const deviceTotal = deviceComposition.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="dashboard pcinfo-dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">PC INFORMATION SYSTEM</span>
              <strong className="current-month">Overview</strong>
            </div>

            <div className="header-actions">
              {canImport && (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file);
                      e.target.value = "";
                    }}
                  />
                  <button
                    className="primary-button"
                    disabled={importing}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload size={13} strokeWidth={2.25} />
                    {importing ? "Importing..." : "Import CSV"}
                  </button>
                </>
              )}
            </div>
          </div>

          {importMessage && (
            <div
              className={importMessage.type === "success" ? "assessment-success" : "assessment-error"}
              style={{ marginBottom: "20px" }}
            >
              <span>{importMessage.text}</span>
            </div>
          )}

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load PC information: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* STAT ROW */}
          <div className="pcinfo-stat-row">
            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><ClipboardCheck size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">Assessments</p>
              <div className="pcinfo-stat-value">{loading ? "—" : totalAssessments}</div>
            </div>

            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><CheckCircle2 size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">Matched to Inventory</p>
              <div className="pcinfo-stat-value">{loading ? "—" : matchedCount}</div>
            </div>

            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><AlertTriangle size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">High Risk</p>
              <div className="pcinfo-stat-value">{loading ? "—" : highRiskCount}</div>
            </div>

            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><ShieldAlert size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">Avg. Risk Score</p>
              <div className="pcinfo-stat-value">{loading ? "—" : avgRiskScore === null ? "—" : avgRiskScore}</div>
            </div>
          </div>

          {/* CHART GRID — donut, grouped bars, trend, colored bars */}
          <section className="dashboard-grid" style={{ marginBottom: 14 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Fleet Composition</h3>
                  <p>Assessed machines by device type</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading...</div>
              ) : deviceComposition.length === 0 ? (
                <div className="chart-empty">No assessments imported yet.</div>
              ) : (
                <div style={{ padding: "0 20px 20px" }}>
                  <div style={{ position: "relative", width: "100%", height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={deviceComposition}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="62%"
                          outerRadius="90%"
                          paddingAngle={2}
                          strokeWidth={0}
                        >
                          {deviceComposition.map((entry) => (
                            <Cell key={entry.name} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        pointerEvents: "none",
                      }}
                    >
                      <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.06em", color: "#838ca0" }}>DEVICES</span>
                      <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "#172033" }}>{deviceTotal}</span>
                    </div>
                  </div>
                  {deviceComposition.map((d) => (
                    <div key={d.name} className="pcinfo-legend-row">
                      <span className="pcinfo-legend-swatch" style={{ background: d.fill }} />
                      {d.name}
                      <strong>{d.value}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Security Controls</h3>
                  <p>Protected vs. not, per baseline control</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading...</div>
              ) : securityCoverage.length === 0 ? (
                <div className="chart-empty">No assessments imported yet.</div>
              ) : (
                <div style={{ padding: "0 12px 12px" }}>
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={securityCoverage} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }} barCategoryGap={20} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#5b6478" tickLine={false} axisLine={false} style={{ fontSize: "0.68rem" }} />
                      <YAxis type="category" dataKey="control" width={78} stroke="#9aa3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.72rem" }} />
                      <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={chartTooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: "0.7rem" }} formatter={(v) => <span style={{ color: "#9aa3b8" }}>{v}</span>} />
                      <Bar dataKey="protected" name="Protected" fill={TEAL} radius={[0, 3, 3, 0]} maxBarSize={9} />
                      <Bar dataKey="unprotected" name="Not Protected" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={9} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          <section className="dashboard-grid" style={{ marginBottom: 14 }}>
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Risk Score Trend</h3>
                  <p>Every assessment's score, in the order it was run</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading...</div>
              ) : riskTrend.length === 0 ? (
                <div className="chart-empty">No scored assessments imported yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <AreaChart data={riskTrend} margin={{ top: 16, right: 16, left: -16, bottom: 0 }}>
                    <defs>
                      <linearGradient id="pcinfoTrendStroke" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#6d8cf0" />
                        <stop offset="100%" stopColor="#3d59d6" />
                      </linearGradient>
                      <linearGradient id="pcinfoTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6d8cf0" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3d59d6" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10.5, fill: "#5b6478" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                    <YAxis domain={[0, 100]} allowDecimals={false} tick={{ fontSize: 10.5, fill: "#5b6478" }} axisLine={false} tickLine={false} width={30} />
                    <RechartsTooltip
                      cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                      contentStyle={chartTooltipStyle}
                      formatter={(value: number, _name, props: any) => [`${value} / 100`, props.payload.machine]}
                    />
                    <Area
                      type="monotone"
                      dataKey="risk_score"
                      name="Risk Score"
                      stroke="url(#pcinfoTrendStroke)"
                      strokeWidth={2.5}
                      fill="url(#pcinfoTrendFill)"
                      dot={{ r: 2.5, fill: "#6d8cf0", strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#6d8cf0" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Risk Level Distribution</h3>
                  <p>Assessed machines grouped by overall risk level</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading...</div>
              ) : riskDistribution.length === 0 ? (
                <div className="chart-empty">No assessments imported yet.</div>
              ) : (
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={riskDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }} barCategoryGap={20}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#5b6478" tickLine={false} axisLine={false} style={{ fontSize: "0.68rem" }} />
                    <YAxis type="category" dataKey="level" width={70} stroke="#9aa3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.72rem" }} />
                    <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={chartTooltipStyle} />
                    <Bar dataKey="count" radius={[0, 3, 3, 0]} maxBarSize={20}>
                      {riskDistribution.map((entry) => (
                        <Cell key={entry.level} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </section>

          {/* SECONDARY BREAKDOWN — Component Health / Division / OS,
              compact tables rather than 3 more chart cards. */}
          <section className="card" style={{ marginBottom: 14 }}>
            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading...</div>
            ) : totalAssessments === 0 ? (
              <div className="chart-empty">No assessments imported yet.</div>
            ) : (
              <div className="pcinfo-panel-grid">
                <div className="pcinfo-panel">
                  <p className="pcinfo-panel-title">Component Health</p>
                  {componentHealth.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#838ca0", margin: 0 }}>No checklist data imported yet.</p>
                  ) : (
                    (() => {
                      const total = componentHealth.reduce((sum, c) => sum + c.count, 0);
                      return componentHealth.map((c) => (
                        <div className="pcinfo-bar-row" key={c.status}>
                          <div className="pcinfo-bar-row-top">
                            <span className="pcinfo-bar-row-label">{c.status}</span>
                            <span className="pcinfo-bar-row-value">{c.count}</span>
                          </div>
                          <div className="pcinfo-bar-track">
                            <div className="pcinfo-bar-fill" style={{ width: `${(c.count / total) * 100}%`, background: c.fill }} />
                          </div>
                        </div>
                      ));
                    })()
                  )}
                </div>

                <div className="pcinfo-panel">
                  <p className="pcinfo-panel-title">Devices by Division</p>
                  <div className="pcinfo-breakdown-list">
                    {divisionBreakdown.slice(0, 7).map((d) => (
                      <div className="pcinfo-breakdown-row" key={d.division}>
                        <span>{d.division}</span>
                        <strong>{d.count}</strong>
                      </div>
                    ))}
                    {divisionBreakdown.length > 7 && (
                      <div className="pcinfo-breakdown-row"><span>+{divisionBreakdown.length - 7} more</span></div>
                    )}
                  </div>
                </div>

                <div className="pcinfo-panel">
                  <p className="pcinfo-panel-title">OS Edition</p>
                  <div className="pcinfo-breakdown-list">
                    {osBreakdown.slice(0, 7).map((o) => (
                      <div className="pcinfo-breakdown-row" key={o.os}>
                        <span>{o.os}</span>
                        <strong>{o.count}</strong>
                      </div>
                    ))}
                    {osBreakdown.length > 7 && (
                      <div className="pcinfo-breakdown-row"><span>+{osBreakdown.length - 7} more</span></div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* RECENT DEVICES */}
          <section className="card assessments-card">
            <div className="card-header">
              <div>
                <h3>Recent Devices</h3>
                <p>Every FOREN security assessment imported into the system</p>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center", color: "#838ca0" }}>Loading assessments...</div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>DEVICE</th>
                        <th>SERIAL NO.</th>
                        <th>OWNER</th>
                        <th>DIVISION</th>
                        <th>STATUS</th>
                        <th>ADDED</th>
                        <th>REPORT</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedAssessments.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "2rem" }}>
                            No assessments imported yet.
                          </td>
                        </tr>
                      ) : (
                        paginatedAssessments.map((a) => (
                          <tr key={a.id}>
                            <td>{a.device_type ? DEVICE_TYPE_LABELS[a.device_type] ?? a.device_type : "Unmatched"}</td>
                            <td><strong>{a.device_name}</strong></td>
                            <td>{a.serial_no ?? a.motherboard_serial ?? "—"}</td>
                            <td>{a.owner_name ?? "Unassigned"}</td>
                            <td>{a.division_name ?? "Unassigned"}</td>
                            <td>
                              {a.device_status === null ? (
                                <span className="badge underweight">
                                  <span className="badge-dot" />
                                  Unmatched
                                </span>
                              ) : (
                                <span className={`badge ${a.device_status ? "normal" : "obese"}`}>
                                  <span className="badge-dot" />
                                  {a.device_status ? "Active" : "Inactive"}
                                </span>
                              )}
                            </td>
                            <td>{formatDate(a.created_at)}</td>
                            <td>
                              <button
                                type="button"
                                onClick={() => navigate(`/pc-info/assessment/${a.id}`)}
                                style={{
                                  border: "none",
                                  background: "var(--pcinfo-grad)",
                                  color: "#ffffff",
                                  borderRadius: "6px",
                                  padding: "5px 12px",
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  cursor: "pointer",
                                }}
                              >
                                View
                              </button>
                            </td>
                            <td>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteAssessment(a)}
                                  disabled={deletingId === a.id}
                                  style={{
                                    border: "none",
                                    background: "var(--pcinfo-red-grad)",
                                    color: "#ffffff",
                                    borderRadius: "6px",
                                    padding: "5px 12px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: deletingId === a.id ? "default" : "pointer",
                                    opacity: deletingId === a.id ? 0.6 : 1,
                                  }}
                                >
                                  {deletingId === a.id ? "..." : "Delete"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {assessments.length > ITEMS_PER_PAGE && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                        <strong>{Math.min(currentPage * ITEMS_PER_PAGE, assessments.length)}</strong> of{" "}
                        <strong>{assessments.length}</strong> entries
                      </div>

                      <div className="pagination-controls">
                        <button
                          className="btn-modern-nav"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          <span>Previous</span>
                        </button>

                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
                          .reduce<(number | string)[]>((acc, page, idx, src) => {
                            if (idx > 0 && page - (src[idx - 1] as number) > 1) acc.push("...");
                            acc.push(page);
                            return acc;
                          }, [])
                          .map((item, index) =>
                            typeof item === "number" ? (
                              <button
                                key={item}
                                className={`pagination-btn ${currentPage === item ? "active" : ""}`}
                                onClick={() => handlePageChange(item)}
                              >
                                {item}
                              </button>
                            ) : (
                              <span key={`ellipsis-${index}`} className="pagination-ellipsis">•••</span>
                            )
                          )}

                        <button
                          className="btn-modern-nav btn-next"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          <span>Next</span>
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </section>

          {/* DETAILED REPORTS */}
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Detailed Reports</h3>
                <p>Per-host findings, by table, from every imported FOREN export</p>
              </div>
            </div>

            <div className="pcinfo-report-list">
              {PC_INFO_CATEGORIES.map((c) => {
                const Icon = c.icon;
                return (
                  <button key={c.slug} type="button" className="pcinfo-report-row" onClick={() => navigate(`/pc-info/category/${c.slug}`)}>
                    <Icon size={15} strokeWidth={2} className="pcinfo-report-icon" />
                    <div>
                      <strong>{c.label}</strong>
                      <small>Table 1 — {c.label.toLowerCase()} findings</small>
                    </div>
                    <ChevronRight size={14} strokeWidth={2} className="pcinfo-report-chevron" />
                  </button>
                );
              })}

              <button type="button" className="pcinfo-report-row" onClick={() => navigate("/pc-info/connections")}>
                <Radar size={15} strokeWidth={2} className="pcinfo-report-icon" />
                <div>
                  <strong>PC Connection Status</strong>
                  <small>Table 2 — network connection findings</small>
                </div>
                <ChevronRight size={14} strokeWidth={2} className="pcinfo-report-chevron" />
              </button>

              <button type="button" className="pcinfo-report-row" onClick={() => navigate("/pc-info/component-status")}>
                <Gauge size={15} strokeWidth={2} className="pcinfo-report-icon" />
                <div>
                  <strong>Component Status</strong>
                  <small>Table 3 — pass/fail hardware checklist</small>
                </div>
                <ChevronRight size={14} strokeWidth={2} className="pcinfo-report-chevron" />
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
