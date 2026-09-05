import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  ShieldAlert,
  ClipboardCheck,
  AlertTriangle,
  CheckCircle2,
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
  LabelList,
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
  assessed_at: string | null;
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
};

type ComponentFinding = {
  id: number;
  status: string | null;
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

export default function PcInfoDashboard() {
  const navigate = useNavigate();
  // pcinfo_viewer is read-only — importing a new assessment CSV is
  // hidden for that role (the backend rejects the request anyway, but
  // hiding the button avoids a confusing 401).
  const pcInfoRole = localStorage.getItem("pcInfoUserRole");
  const canImport = pcInfoRole === "pcinfo_admin" || pcInfoRole === "pcinfo_editor" || pcInfoRole === "admin";
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [componentFindings, setComponentFindings] = useState<ComponentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Risk Level Distribution — how many assessed machines fall into each
  // risk bracket, ordered worst-first so the eye lands on HIGH first.
  const riskDistribution = useMemo(() => {
    const order = ["HIGH", "MEDIUM", "LOW", "UNKNOWN"];
    const colors: Record<string, string> = { HIGH: "#ef4444", MEDIUM: "#f59e0b", LOW: "#22c55e", UNKNOWN: "#94a3b8" };
    const counts = new Map<string, number>();
    for (const a of assessments) {
      const level = (a.risk_level ?? "").toUpperCase() || "UNKNOWN";
      counts.set(level, (counts.get(level) ?? 0) + 1);
    }
    return order
      .filter((level) => counts.has(level))
      .map((level) => ({ level, count: counts.get(level) as number, fill: colors[level] }));
  }, [assessments]);

  // Security Controls Coverage — of every assessed machine, how many
  // have each baseline protection actually turned on. This is the
  // single most useful "how secure is the fleet" summary the FOREN data
  // can produce.
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
      label: `${protectedCount}/${total}`,
    });

    return [
      withLabel("Firewall (all profiles)", firewallOn),
      withLabel("Antivirus", defenderOn),
      withLabel("Secure Boot", secureBootOn),
      withLabel("TPM", tpmOn),
    ];
  }, [assessments]);

  // Component Health — Table 3's pass/fail checklist, aggregated across
  // every imported assessment.
  const componentHealth = useMemo(() => {
    const colors: Record<string, string> = { PASS: "#22c55e", WARNING: "#f59e0b", WARN: "#f59e0b", FAIL: "#ef4444" };
    const counts = new Map<string, number>();
    for (const f of componentFindings) {
      const status = (f.status ?? "").toUpperCase() || "UNKNOWN";
      counts.set(status, (counts.get(status) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([status, count]) => ({ status, count, fill: colors[status] ?? "#94a3b8" }))
      .sort((a, b) => b.count - a.count);
  }, [componentFindings]);

  // Risk Score Over Time — every assessment plotted by when it ran, in
  // case the same or different machines get re-assessed later and this
  // is meant to show whether the fleet's risk is trending up or down.
  const riskTrend = useMemo(() => {
    return [...assessments]
      .filter((a) => a.assessed_at && a.risk_score !== null)
      .sort((a, b) => new Date(a.assessed_at as string).getTime() - new Date(b.assessed_at as string).getTime())
      .map((a) => ({
        label: new Date(a.assessed_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        machine: [a.motherboard_manufacturer, a.motherboard_product].filter(Boolean).join(" ") || "Unknown",
        risk_score: a.risk_score as number,
      }));
  }, [assessments]);

  return (
    <div className="dashboard">
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

          {/* STAT CARDS */}
          <section className="stat-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total Assessments</span>
                <div className="stat-icon blue"><ClipboardCheck size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : totalAssessments}</h2>
              <div className="stat-change positive"><span>FOREN reports imported</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Matched to Inventory</span>
                <div className="stat-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : matchedCount}</h2>
              <div className="stat-change neutral"><span>of {totalAssessments} assessed machines</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>High Risk</span>
                <div className="stat-icon orange"><AlertTriangle size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : highRiskCount}</h2>
              <div className="stat-change neutral"><span>Machines flagged HIGH risk</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Average Risk Score</span>
                <div className="stat-icon purple"><ShieldAlert size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : avgRiskScore === null ? "—" : `${avgRiskScore}/100`}</h2>
              <div className="stat-change neutral"><span>Across all assessments</span></div>
            </div>
          </section>

          {/* RISK DISTRIBUTION + COMPONENT HEALTH */}
          <section className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Risk Level Distribution</h3>
                  <p>Assessed machines grouped by overall risk level</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
              ) : riskDistribution.length === 0 ? (
                <div className="chart-empty">No assessments imported yet.</div>
              ) : (
                <div style={{ width: "100%", height: Math.max(160, riskDistribution.length * 56) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskDistribution} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                      <YAxis type="category" dataKey="level" width={72} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                      <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {riskDistribution.map((entry) => (
                          <Cell key={entry.level} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="count" position="right" style={{ fontSize: "0.75rem", fontWeight: 700, fill: "#475569" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Component Health</h3>
                  <p>Table 3 checklist results, aggregated across all machines</p>
                </div>
              </div>

              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
              ) : componentHealth.length === 0 ? (
                <div className="chart-empty">No component status checklists imported yet.</div>
              ) : (
                <div style={{ width: "100%", height: Math.max(160, componentHealth.length * 56) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={componentHealth} layout="vertical" margin={{ top: 4, right: 40, left: 4, bottom: 4 }} barCategoryGap={18}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                      <YAxis type="category" dataKey="status" width={80} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                      <RechartsTooltip cursor={{ fill: "rgba(37, 99, 235, 0.06)" }} contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28}>
                        {componentHealth.map((entry) => (
                          <Cell key={entry.status} fill={entry.fill} />
                        ))}
                        <LabelList dataKey="count" position="right" style={{ fontSize: "0.75rem", fontWeight: 700, fill: "#475569" }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </section>

          {/* SECURITY CONTROLS COVERAGE */}
          <section className="card">
            <div className="card-header">
              <div>
                <h3>Security Controls Coverage</h3>
                <p>How many assessed machines actually have each baseline protection turned on</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
            ) : securityCoverage.length === 0 ? (
              <div className="chart-empty">No assessments imported yet.</div>
            ) : (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={securityCoverage} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 4 }} barCategoryGap={16}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                    <YAxis type="category" dataKey="control" width={150} stroke="#334155" tickLine={false} axisLine={false} style={{ fontSize: "0.75rem", fontWeight: 600 }} />
                    <RechartsTooltip contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }} />
                    <Bar dataKey="protected" name="Protected" stackId="coverage" fill="#22c55e" radius={[6, 0, 0, 6]} maxBarSize={22} />
                    <Bar dataKey="unprotected" name="Not Protected" stackId="coverage" fill="#ef4444" radius={[0, 6, 6, 0]} maxBarSize={22}>
                      <LabelList dataKey="label" position="right" style={{ fontSize: "0.72rem", fontWeight: 600, fill: "#475569" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* RISK SCORE TREND */}
          <section className="card trend-card-single">
            <div className="card-header">
              <div>
                <h3>Risk Score Over Time</h3>
                <p>Every assessment's risk score, in the order it was run</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
            ) : riskTrend.length === 0 ? (
              <div className="chart-empty">No scored assessments imported yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={riskTrend} margin={{ top: 26, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="riskTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis domain={[0, 100]} allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                  <RechartsTooltip
                    cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                    formatter={(value: number, _name, props: any) => [`${value} / 100`, props.payload.machine]}
                  />
                  <Area
                    type="monotone"
                    dataKey="risk_score"
                    name="Risk Score"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#riskTrendFill)"
                    dot={{ r: 3.5, fill: "#ef4444", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList dataKey="risk_score" position="top" offset={10} style={{ fontSize: "0.7rem", fontWeight: 600, fill: "#ef4444" }} />
                  </Area>
                </AreaChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* ASSESSED MACHINES TABLE */}
          <section className="card assessments-card">
            <div className="card-header">
              <div>
                <h3>Assessed Machines</h3>
                <p>Every FOREN security assessment imported into the system</p>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading assessments...</div>
              ) : assessments.length === 0 ? (
                <div className="chart-empty">No assessments imported yet.</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>MACHINE</th>
                      <th>HOSTNAME</th>
                      <th>SERIAL NO.</th>
                      <th>OS</th>
                      <th>ASSESSED</th>
                      <th>RISK</th>
                      <th>MATCHED DEVICE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>
                            {[a.motherboard_manufacturer, a.motherboard_product].filter(Boolean).join(" ") || "Unknown machine"}
                          </strong>
                        </td>
                        <td>
                          {a.hostname ? (
                            <button className="machine-link" onClick={() => navigate(`/pc-info/assessment/${a.id}`)}>
                              {a.hostname}
                            </button>
                          ) : (
                            <button className="machine-link" onClick={() => navigate(`/pc-info/assessment/${a.id}`)}>
                              View details
                            </button>
                          )}
                          {a.computer_name && a.computer_name !== a.hostname ? (
                            <>
                              <br />
                              <small style={{ color: "#94a3b8" }}>{a.computer_name}</small>
                            </>
                          ) : null}
                        </td>
                        <td>{a.motherboard_serial ?? a.serial_no ?? "—"}</td>
                        <td>{a.os_edition ?? "—"}</td>
                        <td>{formatDateTime(a.assessed_at)}</td>
                        <td>
                          <span className={`badge ${riskBadgeClass(a.risk_level)}`}>
                            <span className="badge-dot" />
                            {a.risk_level ?? "UNKNOWN"}{a.risk_score !== null ? ` (${a.risk_score})` : ""}
                          </span>
                        </td>
                        <td>{a.device_id ? `${a.device_type} #${a.device_id}` : "Not registered"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </section>

          {/* THE 3 FOREN REPORT TABLES */}
          <section className="dashboard-grid">
            <div className="card">
              <div className="card-header">
                <div>
                  <h3>PC Information Details</h3>
                  <p>Table 1 — per-host hardware, OS, and security facts, by category</p>
                </div>
              </div>

              <div className="quick-actions">
                {PC_INFO_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  return (
                    <button key={c.slug} onClick={() => navigate(`/pc-info/category/${c.slug}`)}>
                      <span className="quick-icon blue"><Icon size={16} strokeWidth={2} /></span>
                      <div>
                        <strong>{c.label}</strong>
                        <small>View {c.label.toLowerCase()} findings</small>
                      </div>
                      <span><ChevronRight size={14} strokeWidth={2} /></span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <div>
                  <h3>Other Reports</h3>
                  <p>The remaining two tables from each FOREN export</p>
                </div>
              </div>

              <div className="quick-actions">
                <button onClick={() => navigate("/pc-info/connections")}>
                  <span className="quick-icon purple"><Radar size={16} strokeWidth={2} /></span>
                  <div>
                    <strong>PC Connection Status</strong>
                    <small>Table 2 — network connection findings</small>
                  </div>
                  <span><ChevronRight size={14} strokeWidth={2} /></span>
                </button>

                <button onClick={() => navigate("/pc-info/component-status")}>
                  <span className="quick-icon green"><Gauge size={16} strokeWidth={2} /></span>
                  <div>
                    <strong>Component Status</strong>
                    <small>Table 3 — pass/fail hardware checklist</small>
                  </div>
                  <span><ChevronRight size={14} strokeWidth={2} /></span>
                </button>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
