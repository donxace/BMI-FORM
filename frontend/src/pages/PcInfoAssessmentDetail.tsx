import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Dashboard.css";
import {
  ArrowLeft,
  Monitor,
  Network,
  ClipboardCheck,
  ShieldAlert,
  Fingerprint,
  Cpu,
  Lock,
  CheckCircle2,
  XCircle,
  MinusCircle,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PC_INFO_CATEGORIES } from "../pcInfoCategories";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type Assessment = {
  id: number;
  serial_no: string | null;
  device_type: "desktops" | "laptops" | null;
  device_id: number | null;
  hostname: string | null;
  computer_name: string | null;
  ip_address: string | null;
  mac_address: string | null;
  username: string | null;
  domain_workgroup: string | null;
  foren_version: string | null;
  ran_as_admin: boolean | null;
  assessed_at: string | null;
  duration_seconds: number | null;
  motherboard_manufacturer: string | null;
  motherboard_product: string | null;
  motherboard_serial: string | null;
  cpu_summary: string | null;
  ram_manufacturer: string | null;
  ram_capacity: string | null;
  ram_speed: string | null;
  gpu_name: string | null;
  gpu_vram: string | null;
  os_edition: string | null;
  os_build: string | null;
  secure_boot_status: string | null;
  tpm_present: boolean | null;
  defender_enabled: boolean | null;
  firewall_domain: boolean | null;
  firewall_private: boolean | null;
  firewall_public: boolean | null;
  risk_score: number | null;
  risk_level: string | null;
};

type Finding = {
  id: number;
  table_no: number | null;
  section: string | null;
  category: string | null;
  component: string | null;
  property: string | null;
  value: string | null;
  status: string | null;
  finding: string | null;
  specifications: string | null;
  functional_test: string | null;
  actual_result: string | null;
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("pcInfoAuthToken")}` };
}

function formatDateTime(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function riskBadgeClass(level: string | null) {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "HIGH") return "obese";
  if (normalized === "MEDIUM") return "overweight";
  if (normalized === "LOW") return "normal";
  return "underweight";
}

// Same HIGH/MEDIUM/LOW colors used throughout this page's charts
// (riskDistribution on the main dashboard, connectionRiskSummary below)
// — the gauge needs a real hex, not a CSS badge class.
function riskColor(level: string | null) {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "HIGH") return "#ef4444";
  if (normalized === "MEDIUM") return "#f59e0b";
  if (normalized === "LOW") return "#22c55e";
  return "#94a3b8";
}

// A quick-glance pass/fail/unknown icon for the boolean security checks
// in the risk overview strip — green check, red X, gray dash for null
// (status colors reserved, never a plain categorical hue).
function CheckIcon({ value }: { value: boolean | null }) {
  if (value === null) return <MinusCircle size={15} strokeWidth={2} color="#94a3b8" />;
  return value ? <CheckCircle2 size={15} strokeWidth={2} color="#22c55e" /> : <XCircle size={15} strokeWidth={2} color="#ef4444" />;
}

// Component checklist (table 3) uses PASS/WARN/FAIL/INFO; network
// connection findings (table 2) use the same LOW/MEDIUM/HIGH vocabulary
// as risk_level elsewhere (riskBadgeClass) — both land here since this
// is the one status column shared by both tables in this UI.
function statusBadgeClass(status: string | null) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PASS" || normalized === "LOW") return "normal";
  if (normalized === "WARN" || normalized === "WARNING" || normalized === "MEDIUM") return "overweight";
  if (normalized === "FAIL" || normalized === "HIGH") return "obese";
  if (normalized === "INFO") return "underweight";
  return "";
}

function labelForCategory(category: string | null) {
  const meta = PC_INFO_CATEGORIES.find((c) => c.category === category);
  return meta?.label ?? category ?? "Other";
}

function yesNo(value: boolean | null) {
  if (value === null) return "—";
  return value ? "Yes" : "No";
}

export default function PcInfoAssessmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionsPage, setConnectionsPage] = useState(1);
  const CONNECTIONS_PER_PAGE = 10;
  const [checklistPage, setChecklistPage] = useState(1);
  const CHECKLIST_PER_PAGE = 10;

  // The raw per-row sections (hardware/security details, network
  // connections, component checklist) can each run into the hundreds of
  // rows, so only one is ever on screen at a time — a tab switch, not a
  // long scroll — with a risk overview always visible above them.
  type Tab = "overview" | "hardware" | "network" | "checklist";
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!id) return;

    setConnectionsPage(1);
    setChecklistPage(1);
    setActiveTab("overview");

    async function load() {
      try {
        setLoading(true);
        const [assessmentRes, findingsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/pc-info/assessments/${id}`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/pc-info/assessments/${id}/findings`, { headers: authHeaders() }),
        ]);
        if (!assessmentRes.ok) throw new Error("Machine not found.");
        setAssessment(await assessmentRes.json());
        setFindings(findingsRes.ok ? await findingsRes.json() : []);
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load this machine's details.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // Table 1 ("SECURITY ASSESSMENT") findings, grouped by category into
  // readable label/value pairs instead of a flat table — this is the raw
  // detail behind the headline facts already shown in the Overview card.
  const detailsByCategory = useMemo(() => {
    const groups = new Map<string, Finding[]>();
    for (const f of findings) {
      if (f.table_no !== 1) continue;
      const key = f.category ?? "Other";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(f);
    }
    return Array.from(groups.entries()).sort((a, b) => labelForCategory(a[0]).localeCompare(labelForCategory(b[0])));
  }, [findings]);

  // Status Summary — same reserved status-color language as Component
  // Health and Connection Risk Summary below, so all three charts on
  // this page speak one visual vocabulary. Shown instead of the full
  // per-category breakdown, which stays collapsed until asked for (see
  // showHardwareDetails) — a WARN/FAIL count here is what actually
  // signals "worth expanding," not the raw fact count.
  const hardwareStatusSummary = useMemo(() => {
    const colors: Record<string, string> = { PASS: "#22c55e", WARNING: "#f59e0b", WARN: "#f59e0b", FAIL: "#ef4444", INFO: "#94a3b8" };
    const counts = new Map<string, number>();
    for (const [, rows] of detailsByCategory) {
      for (const r of rows) {
        const status = (r.status ?? "").toUpperCase() || "UNKNOWN";
        counts.set(status, (counts.get(status) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, fill: colors[status] ?? "#94a3b8" }))
      .sort((a, b) => b.count - a.count);
  }, [detailsByCategory]);

  const connections = useMemo(() => findings.filter((f) => f.table_no === 2), [findings]);

  // Connection Risk Summary — a network scan can produce hundreds of raw
  // rows (this dashboard has imports with 170+); a status breakdown
  // answers "how worried should I be" at a glance. Table 2's status
  // values are actually LOW/MEDIUM/HIGH (same vocabulary as risk_level —
  // see riskDistribution's identical color choices on the main
  // dashboard), not table 3's PASS/WARN/FAIL/INFO, but both are
  // supported here since colors are reserved by meaning, never reused
  // as a plain categorical hue.
  const connectionRiskSummary = useMemo(() => {
    const colors: Record<string, string> = {
      HIGH: "#ef4444",
      FAIL: "#ef4444",
      MEDIUM: "#f59e0b",
      WARNING: "#f59e0b",
      WARN: "#f59e0b",
      LOW: "#22c55e",
      PASS: "#22c55e",
      INFO: "#94a3b8",
    };
    const counts = new Map<string, number>();
    for (const c of connections) {
      const status = (c.status ?? "").toUpperCase() || "UNKNOWN";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, fill: colors[status] ?? "#94a3b8" }))
      .sort((a, b) => b.count - a.count);
  }, [connections]);

  // Top Processes by Connection Count — which executable actually
  // accounts for the volume, rather than scrolling every row to spot a
  // pattern. Capped at 8 named processes (this dataviz skill's validated
  // 8-hue categorical theme, in fixed order — never cycled/reassigned);
  // anything beyond that folds into a gray "Other" rather than a
  // generated 9th hue. No on-slice text labels — process names (e.g.
  // "utmstack_agent_service.exe") are too long for this chart's narrow
  // half-width column and would overlap the neighboring chart; the
  // legend + hover tooltip carry identity instead, satisfying the
  // skill's documented secondary-encoding exception for a pie/donut's
  // necessarily all-pairs color comparison.
  const PROCESS_COLORS = ["#2a78d6", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];
  const topProcesses = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of connections) {
      const process = c.component?.trim() || "Unknown";
      counts.set(process, (counts.get(process) ?? 0) + 1);
    }
    const sorted = Array.from(counts.entries())
      .map(([process, count]) => ({ process, count }))
      .sort((a, b) => b.count - a.count);

    const top = sorted.length <= 8 ? sorted : sorted.slice(0, 8);
    const withColor = top.map((p, i) => ({ ...p, fill: PROCESS_COLORS[i] }));

    if (sorted.length <= 8) return withColor;

    const otherCount = sorted.slice(8).reduce((sum, p) => sum + p.count, 0);
    return [...withColor, { process: "Other", count: otherCount, fill: "#94a3b8" }];
  }, [connections]);

  const connectionsTotalPages = Math.max(1, Math.ceil(connections.length / CONNECTIONS_PER_PAGE));
  const paginatedConnections = connections.slice(
    (connectionsPage - 1) * CONNECTIONS_PER_PAGE,
    connectionsPage * CONNECTIONS_PER_PAGE
  );
  const componentChecklist = useMemo(() => findings.filter((f) => f.table_no === 3), [findings]);

  // Per-machine Component Health — same status colors as the dashboard's
  // fleet-wide version (PcInfoDashboard.tsx's componentHealth) so PASS/
  // WARN/FAIL mean the same thing everywhere in this app; status colors
  // are reserved for this and never reused as a plain categorical hue.
  const componentHealth = useMemo(() => {
    const colors: Record<string, string> = { PASS: "#22c55e", WARNING: "#f59e0b", WARN: "#f59e0b", FAIL: "#ef4444" };
    const counts = new Map<string, number>();
    for (const f of componentChecklist) {
      const status = (f.status ?? "").toUpperCase() || "UNKNOWN";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, fill: colors[status] ?? "#94a3b8" }))
      .sort((a, b) => b.count - a.count);
  }, [componentChecklist]);

  const checklistTotalPages = Math.max(1, Math.ceil(componentChecklist.length / CHECKLIST_PER_PAGE));
  const paginatedChecklist = componentChecklist.slice(
    (checklistPage - 1) * CHECKLIST_PER_PAGE,
    checklistPage * CHECKLIST_PER_PAGE
  );

  if (loading) {
    return (
      <div className="dashboard">
        <main className="main-content">
          <div className="content">
            <div style={{ padding: "2rem", textAlign: "center" }}>Loading machine details...</div>
          </div>
        </main>
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="dashboard">
        <main className="main-content">
          <div className="content">
            <div className="content-header">
              <div>
                <span className="date-label">PC INFORMATION SYSTEM</span>
                <strong className="current-month">Machine Not Found</strong>
              </div>
            </div>
            <div className="assessment-error">
              <span>{error || "This assessment doesn't exist."}</span>
            </div>
            <button className="secondary-button" style={{ marginTop: 16 }} onClick={() => navigate("/pc-info/dashboard")}>
              <ArrowLeft size={13} strokeWidth={2.25} />
              Back to PC Information System
            </button>
          </div>
        </main>
      </div>
    );
  }

  const displayName = assessment.hostname || assessment.computer_name || "Unknown machine";

  const tabs: Array<{ key: Tab; label: string; icon: typeof Monitor; count?: number }> = [
    { key: "overview", label: "Overview", icon: Monitor },
    { key: "hardware", label: "Hardware & Security", icon: ShieldAlert, count: findings.filter((f) => f.table_no === 1).length },
    { key: "network", label: "Network", icon: Network, count: connections.length },
    { key: "checklist", label: "Checklist", icon: ClipboardCheck, count: componentChecklist.length },
  ];

  const firewallOn = assessment.firewall_domain && assessment.firewall_private && assessment.firewall_public;
  const secureBootOn = (assessment.secure_boot_status ?? "").toUpperCase() === "ENABLED";

  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">PC INFORMATION SYSTEM</span>
              <strong className="current-month">{displayName}</strong>
            </div>
            <div className="header-actions">
              <button className="secondary-button" onClick={() => navigate("/pc-info/dashboard")}>
                <ArrowLeft size={13} strokeWidth={2.25} />
                Back
              </button>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <span>{error}</span>
            </div>
          )}

          {/* RISK OVERVIEW — always visible: gauge, headline facts, and
              the 4 boolean security checks at a glance, so the most
              "is this machine okay" question never needs a click. */}
          <section className="card" style={{ marginBottom: 20, padding: "22px 24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center" }}>
              <div style={{ position: "relative", width: 130, height: 130, flexShrink: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="72%"
                    outerRadius="100%"
                    barSize={11}
                    data={[{ value: assessment.risk_score ?? 0, fill: riskColor(assessment.risk_level) }]}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar background={{ fill: "#f1f5f9" }} dataKey="value" cornerRadius={6} isAnimationActive={false} />
                  </RadialBarChart>
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
                  <strong style={{ fontSize: "1.35rem", color: "#172033", lineHeight: 1 }}>
                    {assessment.risk_score ?? "—"}
                  </strong>
                  <span style={{ fontSize: "0.62rem", color: "#8994a5", fontWeight: 600 }}>/ 100</span>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 220 }}>
                <span className={`badge ${riskBadgeClass(assessment.risk_level)}`}>
                  <span className="badge-dot" />
                  {assessment.risk_level ?? "UNKNOWN"} RISK
                </span>
                <p style={{ margin: "10px 0 0", fontSize: "0.8rem", color: "#657184", lineHeight: 1.6 }}>
                  Assessed {formatDateTime(assessment.assessed_at)}
                  {assessment.duration_seconds !== null ? ` · took ${assessment.duration_seconds}s` : ""}
                  <br />
                  {assessment.device_id
                    ? `Matched to ${assessment.device_type} #${assessment.device_id} in inventory`
                    : "Not registered in inventory"}
                </p>
              </div>

              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[
                  { label: "Secure Boot", value: secureBootOn },
                  { label: "TPM", value: assessment.tpm_present },
                  { label: "Antivirus", value: assessment.defender_enabled },
                  { label: "Firewall", value: firewallOn },
                ].map((check) => (
                  <div key={check.label} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "#334155", fontWeight: 600 }}>
                    <CheckIcon value={check.value} />
                    {check.label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* TAB NAVIGATION — one section on screen at a time instead of
              a long scroll; each raw-data-heavy tab (Hardware, Network,
              Checklist) shows its count right on the tab. */}
          <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: "1px solid #e5e9ef", overflowX: "auto" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "10px 16px",
                    border: "none",
                    borderBottom: active ? "2px solid #2563eb" : "2px solid transparent",
                    background: "transparent",
                    color: active ? "#2563eb" : "#657184",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    marginBottom: "-1px",
                  }}
                >
                  <Icon size={15} strokeWidth={2} />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span
                      style={{
                        background: active ? "#eff6ff" : "#f1f5f9",
                        color: active ? "#2563eb" : "#8994a5",
                        borderRadius: 20,
                        padding: "1px 7px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                      }}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* OVERVIEW TAB — grouped into Identity / Hardware / Security
              cards instead of one flat 18-field grid. */}
          {activeTab === "overview" && (
            <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
              <section className="card">
                <div className="card-header">
                  <div>
                    <h3>
                      <Fingerprint size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                      Identity
                    </h3>
                  </div>
                </div>
                <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="detail-item"><span>Computer Name</span><strong>{assessment.computer_name ?? "—"}</strong></div>
                  <div className="detail-item"><span>Hostname</span><strong>{assessment.hostname ?? "—"}</strong></div>
                  <div className="detail-item"><span>IP Address</span><strong>{assessment.ip_address ?? "—"}</strong></div>
                  <div className="detail-item"><span>MAC Address</span><strong>{assessment.mac_address ?? "—"}</strong></div>
                  <div className="detail-item"><span>User</span><strong>{assessment.username ?? "—"}</strong></div>
                  <div className="detail-item"><span>Domain / Workgroup</span><strong>{assessment.domain_workgroup ?? "—"}</strong></div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <div>
                    <h3>
                      <Cpu size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                      Hardware
                    </h3>
                  </div>
                </div>
                <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="detail-item"><span>Motherboard</span><strong>{[assessment.motherboard_manufacturer, assessment.motherboard_product].filter(Boolean).join(" ") || "—"}</strong></div>
                  <div className="detail-item"><span>Serial No.</span><strong>{assessment.motherboard_serial ?? assessment.serial_no ?? "—"}</strong></div>
                  <div className="detail-item"><span>CPU</span><strong>{assessment.cpu_summary ?? "—"}</strong></div>
                  <div className="detail-item"><span>RAM</span><strong>{[assessment.ram_manufacturer, assessment.ram_capacity, assessment.ram_speed].filter(Boolean).join(" · ") || "—"}</strong></div>
                  <div className="detail-item"><span>GPU</span><strong>{[assessment.gpu_name, assessment.gpu_vram].filter(Boolean).join(" · ") || "—"}</strong></div>
                  <div className="detail-item"><span>Operating System</span><strong>{[assessment.os_edition, assessment.os_build].filter(Boolean).join(" · ") || "—"}</strong></div>
                </div>
              </section>

              <section className="card">
                <div className="card-header">
                  <div>
                    <h3>
                      <Lock size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                      Security Posture
                    </h3>
                  </div>
                </div>
                <div className="detail-grid" style={{ gridTemplateColumns: "1fr" }}>
                  <div className="detail-item"><span>Secure Boot</span><strong>{assessment.secure_boot_status ?? "—"}</strong></div>
                  <div className="detail-item"><span>TPM Present</span><strong>{yesNo(assessment.tpm_present)}</strong></div>
                  <div className="detail-item"><span>Antivirus Enabled</span><strong>{yesNo(assessment.defender_enabled)}</strong></div>
                  <div className="detail-item"><span>Firewall</span><strong>{firewallOn ? "All profiles on" : "Not fully enabled"}</strong></div>
                  <div className="detail-item"><span>FOREN Version</span><strong>{assessment.foren_version ?? "—"}</strong></div>
                </div>
              </section>
            </div>
          )}

          {/* HARDWARE & SECURITY TAB */}
          {activeTab === "hardware" && (
            <section className="card">
              <div className="card-header">
                <div>
                  <h3>
                    <ShieldAlert size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                    Hardware &amp; Security Details
                  </h3>
                  <p>Every fact FOREN collected for this machine, by category</p>
                </div>
              </div>

              {detailsByCategory.length === 0 ? (
                <div className="chart-empty">No hardware/security details recorded for this machine.</div>
              ) : (
                <>
                  <div style={{ width: "100%", height: Math.max(120, hardwareStatusSummary.length * 48), padding: "0 20px 16px" }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={hardwareStatusSummary} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                        <YAxis type="category" dataKey="status" width={72} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                        <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {hardwareStatusSummary.map((entry) => (
                            <Cell key={entry.status} fill={entry.fill} />
                          ))}
                          <LabelList dataKey="count" position="right" style={{ fontSize: "0.75rem", fontWeight: 700, fill: "#475569" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {detailsByCategory.map(([category, rows]) => (
                    <div key={category} className="category-group">
                      <h4>{labelForCategory(category)}</h4>
                      <div className="detail-grid">
                        {rows.map((r) => (
                          <div className="detail-item" key={r.id}>
                            <span>{[r.component, r.property].filter(Boolean).join(" — ") || "—"}</span>
                            <strong>
                              {r.value || "—"}
                              {r.status ? (
                                <span className={`badge ${statusBadgeClass(r.status)}`} style={{ marginLeft: 8 }}>
                                  <span className="badge-dot" />
                                  {r.status}
                                </span>
                              ) : null}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </section>
          )}

          {/* NETWORK TAB */}
          {activeTab === "network" && (
            <section className="card assessments-card">
              <div className="card-header">
                <div>
                  <h3>
                    <Network size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                    Network Connections
                  </h3>
                  <p>Malicious connection detection findings for this machine</p>
                </div>
              </div>

              {connections.length > 0 && (
                <div style={{ padding: "0 20px 16px" }}>
                  <h4 style={{ margin: "0 0 10px", fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Risk Summary</h4>
                  <div style={{ width: "100%", height: Math.max(100, connectionRiskSummary.length * 40) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={connectionRiskSummary} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={14}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                        <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                        <YAxis type="category" dataKey="status" width={72} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                        <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                        <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {connectionRiskSummary.map((entry) => (
                            <Cell key={entry.status} fill={entry.fill} />
                          ))}
                          <LabelList dataKey="count" position="right" style={{ fontSize: "0.75rem", fontWeight: 700, fill: "#475569" }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Top Processes gets its own full-width row — a donut this
                  size needs real room, and a hand-built legend list (not
                  Recharts' auto-wrapping Legend, which kept clipping
                  against the pie with 8-9 long process names) scales
                  cleanly to any name length. */}
              {topProcesses.length > 0 && (
                <div style={{ padding: "0 20px 20px" }}>
                  <h4 style={{ margin: "0 0 14px", fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>Top Processes</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 28, alignItems: "center" }}>
                    <div style={{ width: 260, height: 260, flexShrink: 0 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={topProcesses}
                            dataKey="count"
                            nameKey="process"
                            innerRadius="55%"
                            outerRadius="95%"
                            paddingAngle={2}
                            strokeWidth={2}
                            stroke="#ffffff"
                          >
                            {topProcesses.map((entry) => (
                              <Cell key={entry.process} fill={entry.fill} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div style={{ flex: 1, minWidth: 220, display: "flex", flexDirection: "column", gap: 10 }}>
                      {topProcesses.map((entry) => {
                        const total = topProcesses.reduce((sum, p) => sum + p.count, 0);
                        const pct = total > 0 ? Math.round((entry.count / total) * 100) : 0;
                        return (
                          <div key={entry.process} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 10, height: 10, borderRadius: "50%", background: entry.fill, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: "0.8rem", color: "#334155", fontWeight: 600, wordBreak: "break-word" }}>
                              {entry.process}
                            </span>
                            <span style={{ fontSize: "0.8rem", color: "#657184" }}>
                              {entry.count} <span style={{ color: "#b0b8c4" }}>({pct}%)</span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              <div className="table-container">
                {connections.length === 0 ? (
                  <div className="chart-empty">No network connection findings recorded for this machine.</div>
                ) : (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>PROCESS</th>
                          <th>PID</th>
                          <th>LOCAL → REMOTE</th>
                          <th>RISK</th>
                          <th>FINDING</th>
                          <th>DOMAIN / SIGNATURE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedConnections.map((r) => (
                          <tr key={r.id}>
                            <td>{r.component || "—"}</td>
                            <td>{r.property || "—"}</td>
                            <td>{r.value || "—"}</td>
                            <td>
                              {r.status ? (
                                <span className={`badge ${statusBadgeClass(r.status)}`}>
                                  <span className="badge-dot" />
                                  {r.status}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{r.finding || "—"}</td>
                            <td>{r.specifications || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {connections.length > CONNECTIONS_PER_PAGE && (
                      <div className="pagination-container">
                        <div className="pagination-info">
                          Showing <strong>{(connectionsPage - 1) * CONNECTIONS_PER_PAGE + 1}</strong> to{" "}
                          <strong>{Math.min(connectionsPage * CONNECTIONS_PER_PAGE, connections.length)}</strong> of{" "}
                          <strong>{connections.length}</strong> entries
                        </div>

                        <div className="pagination-controls">
                          <button
                            className="btn-modern-nav"
                            onClick={() => setConnectionsPage((p) => Math.max(1, p - 1))}
                            disabled={connectionsPage === 1}
                          >
                            <span>Previous</span>
                          </button>

                          {Array.from({ length: connectionsTotalPages }, (_, i) => i + 1)
                            .filter((page) => page === 1 || page === connectionsTotalPages || Math.abs(page - connectionsPage) <= 1)
                            .reduce<(number | string)[]>((acc, page, idx, src) => {
                              if (idx > 0 && page - (src[idx - 1] as number) > 1) acc.push("...");
                              acc.push(page);
                              return acc;
                            }, [])
                            .map((item, index) =>
                              typeof item === "number" ? (
                                <button
                                  key={item}
                                  className={`pagination-btn ${connectionsPage === item ? "active" : ""}`}
                                  onClick={() => setConnectionsPage(item)}
                                >
                                  {item}
                                </button>
                              ) : (
                                <span key={`ellipsis-${index}`} className="pagination-ellipsis">•••</span>
                              )
                            )}

                          <button
                            className="btn-modern-nav btn-next"
                            onClick={() => setConnectionsPage((p) => Math.min(connectionsTotalPages, p + 1))}
                            disabled={connectionsPage === connectionsTotalPages}
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
          )}

          {/* CHECKLIST TAB */}
          {activeTab === "checklist" && (
            <section className="card assessments-card">
              <div className="card-header">
                <div>
                  <h3>
                    <ClipboardCheck size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                    Component Checklist
                  </h3>
                  <p>Pass/fail functional testing results for this machine</p>
                </div>
              </div>

              {componentHealth.length > 0 && (
                <div style={{ width: "100%", height: Math.max(120, componentHealth.length * 48), padding: "0 20px 16px" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={componentHealth} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                      <YAxis type="category" dataKey="status" width={72} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                      <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                        {componentHealth.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="count" position="right" style={{ fontSize: "0.75rem", fontWeight: 700, fill: "#475569" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="table-container">
                {componentChecklist.length === 0 ? (
                  <div className="chart-empty">No component checklist results recorded for this machine.</div>
                ) : (
                  <>
                    <table>
                      <thead>
                        <tr>
                          <th>CATEGORY</th>
                          <th>COMPONENT</th>
                          <th>STATUS</th>
                          <th>FINDING</th>
                          <th>ACTUAL RESULT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedChecklist.map((r) => (
                          <tr key={r.id}>
                            <td>{r.category || "—"}</td>
                            <td>{r.component || "—"}</td>
                            <td>
                              {r.status ? (
                                <span className={`badge ${statusBadgeClass(r.status)}`}>
                                  <span className="badge-dot" />
                                  {r.status}
                                </span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td>{r.finding || "—"}</td>
                            <td>{r.actual_result || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {componentChecklist.length > CHECKLIST_PER_PAGE && (
                      <div className="pagination-container">
                        <div className="pagination-info">
                          Showing <strong>{(checklistPage - 1) * CHECKLIST_PER_PAGE + 1}</strong> to{" "}
                          <strong>{Math.min(checklistPage * CHECKLIST_PER_PAGE, componentChecklist.length)}</strong> of{" "}
                          <strong>{componentChecklist.length}</strong> entries
                        </div>

                        <div className="pagination-controls">
                          <button
                            className="btn-modern-nav"
                            onClick={() => setChecklistPage((p) => Math.max(1, p - 1))}
                            disabled={checklistPage === 1}
                          >
                            <span>Previous</span>
                          </button>

                          {Array.from({ length: checklistTotalPages }, (_, i) => i + 1)
                            .filter((page) => page === 1 || page === checklistTotalPages || Math.abs(page - checklistPage) <= 1)
                            .reduce<(number | string)[]>((acc, page, idx, src) => {
                              if (idx > 0 && page - (src[idx - 1] as number) > 1) acc.push("...");
                              acc.push(page);
                              return acc;
                            }, [])
                            .map((item, index) =>
                              typeof item === "number" ? (
                                <button
                                  key={item}
                                  className={`pagination-btn ${checklistPage === item ? "active" : ""}`}
                                  onClick={() => setChecklistPage(item)}
                                >
                                  {item}
                                </button>
                              ) : (
                                <span key={`ellipsis-${index}`} className="pagination-ellipsis">•••</span>
                              )
                            )}

                          <button
                            className="btn-modern-nav btn-next"
                            onClick={() => setChecklistPage((p) => Math.min(checklistTotalPages, p + 1))}
                            disabled={checklistPage === checklistTotalPages}
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
          )}

        </div>
      </main>
    </div>
  );
}
