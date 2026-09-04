import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./Dashboard.css";
import {
  ArrowLeft,
  Monitor,
  Network,
  ClipboardCheck,
  ShieldAlert,
} from "lucide-react";
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
  return { Authorization: `Bearer ${localStorage.getItem("authToken")}` };
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

function statusBadgeClass(status: string | null) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PASS") return "normal";
  if (normalized === "WARN" || normalized === "WARNING") return "overweight";
  if (normalized === "FAIL") return "obese";
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

  useEffect(() => {
    if (!id) return;

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

  const connections = useMemo(() => findings.filter((f) => f.table_no === 2), [findings]);
  const componentChecklist = useMemo(() => findings.filter((f) => f.table_no === 3), [findings]);

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

          {/* OVERVIEW CARD — host identity + headline hardware/OS/risk facts */}
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <h3>
                  <Monitor size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                  {displayName}
                </h3>
                <p>
                  Assessed {formatDateTime(assessment.assessed_at)}
                  {assessment.duration_seconds !== null ? ` · took ${assessment.duration_seconds}s` : ""}
                </p>
              </div>
              {assessment.risk_level && (
                <span className={`badge ${riskBadgeClass(assessment.risk_level)}`}>
                  <span className="badge-dot" />
                  {assessment.risk_level}{assessment.risk_score !== null ? ` (${assessment.risk_score}/100)` : ""}
                </span>
              )}
            </div>

            <div className="detail-grid">
              <div className="detail-item"><span>Computer Name</span><strong>{assessment.computer_name ?? "—"}</strong></div>
              <div className="detail-item"><span>Hostname</span><strong>{assessment.hostname ?? "—"}</strong></div>
              <div className="detail-item"><span>IP Address</span><strong>{assessment.ip_address ?? "—"}</strong></div>
              <div className="detail-item"><span>MAC Address</span><strong>{assessment.mac_address ?? "—"}</strong></div>
              <div className="detail-item"><span>User</span><strong>{assessment.username ?? "—"}</strong></div>
              <div className="detail-item"><span>Domain / Workgroup</span><strong>{assessment.domain_workgroup ?? "—"}</strong></div>

              <div className="detail-item"><span>Motherboard</span><strong>{[assessment.motherboard_manufacturer, assessment.motherboard_product].filter(Boolean).join(" ") || "—"}</strong></div>
              <div className="detail-item"><span>Serial No.</span><strong>{assessment.motherboard_serial ?? assessment.serial_no ?? "—"}</strong></div>
              <div className="detail-item"><span>CPU</span><strong>{assessment.cpu_summary ?? "—"}</strong></div>
              <div className="detail-item"><span>RAM</span><strong>{[assessment.ram_manufacturer, assessment.ram_capacity, assessment.ram_speed].filter(Boolean).join(" · ") || "—"}</strong></div>
              <div className="detail-item"><span>GPU</span><strong>{[assessment.gpu_name, assessment.gpu_vram].filter(Boolean).join(" · ") || "—"}</strong></div>
              <div className="detail-item"><span>Operating System</span><strong>{[assessment.os_edition, assessment.os_build].filter(Boolean).join(" · ") || "—"}</strong></div>

              <div className="detail-item"><span>Secure Boot</span><strong>{assessment.secure_boot_status ?? "—"}</strong></div>
              <div className="detail-item"><span>TPM Present</span><strong>{yesNo(assessment.tpm_present)}</strong></div>
              <div className="detail-item"><span>Antivirus Enabled</span><strong>{yesNo(assessment.defender_enabled)}</strong></div>
              <div className="detail-item">
                <span>Firewall</span>
                <strong>{assessment.firewall_domain && assessment.firewall_private && assessment.firewall_public ? "All profiles on" : "Not fully enabled"}</strong>
              </div>

              <div className="detail-item">
                <span>Matched Inventory Device</span>
                <strong>{assessment.device_id ? `${assessment.device_type} #${assessment.device_id}` : "Not registered"}</strong>
              </div>
              <div className="detail-item"><span>FOREN Version</span><strong>{assessment.foren_version ?? "—"}</strong></div>
            </div>
          </section>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <span>{error}</span>
            </div>
          )}

          {/* HARDWARE & SECURITY DETAILS — grouped by category */}
          <section className="card" style={{ marginBottom: 20 }}>
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
              detailsByCategory.map(([category, rows]) => (
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
              ))
            )}
          </section>

          {/* NETWORK CONNECTIONS */}
          <section className="card assessments-card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <h3>
                  <Network size={16} strokeWidth={2} style={{ verticalAlign: "-3px", marginRight: 8 }} />
                  Network Connections
                </h3>
                <p>Malicious connection detection findings for this machine</p>
              </div>
            </div>

            <div className="table-container">
              {connections.length === 0 ? (
                <div className="chart-empty">No network connection findings recorded for this machine.</div>
              ) : (
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
                    {connections.map((r) => (
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
              )}
            </div>
          </section>

          {/* COMPONENT / FUNCTIONAL TESTING CHECKLIST */}
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

            <div className="table-container">
              {componentChecklist.length === 0 ? (
                <div className="chart-empty">No component checklist results recorded for this machine.</div>
              ) : (
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
                    {componentChecklist.map((r) => (
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
              )}
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
