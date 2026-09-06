import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import { Gauge } from "lucide-react";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type ComponentFinding = {
  id: number;
  category: string | null;
  component: string | null;
  status: string | null;
  finding: string | null;
  assessment_id: number;
  assessed_at: string | null;
  serial_no: string | null;
  motherboard_manufacturer: string | null;
  motherboard_product: string | null;
  risk_level: string | null;
  device_type: "desktops" | "laptops" | null;
  device_id: number | null;
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

function statusBadgeClass(status: string | null) {
  const normalized = (status ?? "").toUpperCase();
  if (normalized === "PASS") return "normal";
  if (normalized === "WARN" || normalized === "WARNING") return "overweight";
  if (normalized === "FAIL") return "obese";
  return "underweight";
}

function riskBadgeClass(level: string | null) {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "HIGH") return "obese";
  if (normalized === "MEDIUM") return "overweight";
  if (normalized === "LOW") return "normal";
  return "underweight";
}

export default function PcInfoComponentStatus() {
  const [findings, setFindings] = useState<ComponentFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/pc-info/component-status`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to load component status.");
        setFindings(await res.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load component status.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const groupedByAssessment = useMemo(() => {
    const groups = new Map<number, { header: ComponentFinding; rows: ComponentFinding[] }>();
    for (const row of findings) {
      const existing = groups.get(row.assessment_id);
      if (existing) {
        existing.rows.push(row);
      } else {
        groups.set(row.assessment_id, { header: row, rows: [row] });
      }
    }
    return Array.from(groups.values());
  }, [findings]);

  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">PC INFORMATION SYSTEM</span>
              <strong className="current-month">
                <Gauge size={20} strokeWidth={2} style={{ verticalAlign: "-4px", marginRight: 8 }} />
                Component Status
              </strong>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load component status: </strong>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <section className="card">
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading component status...</div>
            </section>
          ) : groupedByAssessment.length === 0 ? (
            <section className="card">
              <div className="chart-empty">No component status checklists imported yet.</div>
            </section>
          ) : (
            groupedByAssessment.map(({ header, rows }) => (
              <section className="card assessments-card" key={header.assessment_id} style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div>
                    <h3>
                      {[header.motherboard_manufacturer, header.motherboard_product].filter(Boolean).join(" ") || "Unknown machine"}
                    </h3>
                    <p>
                      Assessed {formatDateTime(header.assessed_at)}
                      {header.serial_no ? ` · Serial ${header.serial_no}` : ""}
                      {header.device_id ? ` · Matched to ${header.device_type} #${header.device_id}` : " · Not registered in Inventory"}
                    </p>
                  </div>
                  {header.risk_level && (
                    <span className={`badge ${riskBadgeClass(header.risk_level)}`}>
                      <span className="badge-dot" />
                      {header.risk_level}
                    </span>
                  )}
                </div>

                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>CATEGORY</th>
                        <th>COMPONENT</th>
                        <th>STATUS</th>
                        <th>FINDING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.category || "—"}</td>
                          <td><strong>{row.component || "—"}</strong></td>
                          <td>
                            {row.status ? (
                              <span className={`badge ${statusBadgeClass(row.status)}`}>
                                <span className="badge-dot" />
                                {row.status}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>{row.finding || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}

        </div>
      </main>
    </div>
  );
}
