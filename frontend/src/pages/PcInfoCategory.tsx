import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import "./Dashboard.css";
import { categoryForSlug } from "../pcInfoCategories";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type Finding = {
  id: number;
  table_no: number | null;
  component: string | null;
  property: string | null;
  value: string | null;
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
  if (normalized === "INFO") return "underweight";
  return "";
}

export default function PcInfoCategory() {
  const { category: slug } = useParams<{ category: string }>();
  const meta = slug ? categoryForSlug(slug) : undefined;

  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!meta) {
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/pc-info/findings/${encodeURIComponent(meta!.category)}`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error(`Failed to load ${meta!.label} findings.`);
        setFindings(await res.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load findings.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [meta]);

  const groupedByAssessment = useMemo(() => {
    const groups = new Map<number, { header: Finding; rows: Finding[] }>();
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

  if (!meta) {
    return (
      <div className="dashboard">
        <main className="main-content">
          <div className="content">
            <div className="content-header">
              <div>
                <span className="date-label">PC INFORMATION SYSTEM</span>
                <strong className="current-month">Unknown Category</strong>
              </div>
            </div>
            <div className="chart-empty">
              "{slug}" isn't a recognized PC Information category.
            </div>
          </div>
        </main>
      </div>
    );
  }

  const Icon = meta.icon;

  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">PC INFORMATION SYSTEM</span>
              <strong className="current-month">
                <Icon size={20} strokeWidth={2} style={{ verticalAlign: "-4px", marginRight: 8 }} />
                {meta.label}
              </strong>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load findings: </strong>
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <section className="card">
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading {meta.label.toLowerCase()} findings...</div>
            </section>
          ) : groupedByAssessment.length === 0 ? (
            <section className="card">
              <div className="chart-empty">
                No "{meta.label}" findings have been imported yet. Run{" "}
                <code>node backend/scripts/import-security-assessment.js &lt;path-to-csv&gt;</code> to add one.
              </div>
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
                        <th>COMPONENT</th>
                        <th>PROPERTY</th>
                        <th>VALUE</th>
                        <th>STATUS</th>
                        <th>FINDING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row) => (
                        <tr key={row.id}>
                          <td>{row.component || "—"}</td>
                          <td>{row.property || "—"}</td>
                          <td>{row.value || "—"}</td>
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

function riskBadgeClass(level: string | null) {
  const normalized = (level ?? "").toUpperCase();
  if (normalized === "HIGH") return "obese";
  if (normalized === "MEDIUM") return "overweight";
  if (normalized === "LOW") return "normal";
  return "underweight";
}
