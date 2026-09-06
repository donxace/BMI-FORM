import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import { Radar } from "lucide-react";
import {
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

const API_BASE_URL = `http://${window.location.hostname}:3000`;
const ITEMS_PER_PAGE = 10;

const BAR_COLORS = ["#1d4ed8", "#7c3aed", "#0d9488", "#f59e0b", "#ef4444", "#22c55e", "#0891b2", "#db2777"];

type ConnectionFinding = {
  id: number;
  assessment_id: number;
  assessed_at: string | null;
  serial_no: string | null;
  motherboard_manufacturer: string | null;
  motherboard_product: string | null;
  finding: string | null;
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

export default function PcInfoConnections() {
  const [findings, setFindings] = useState<ConnectionFinding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/pc-info/connections`, { headers: authHeaders() });
        if (!res.ok) throw new Error("Failed to load PC connection status.");
        setFindings(await res.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load PC connection status.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const summary = useMemo(() => {
    const counts = new Map<string, number>();
    for (const f of findings) {
      const text = f.finding?.trim() || "(no description)";
      counts.set(text, (counts.get(text) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([finding, count]) => ({ finding, count }))
      .sort((a, b) => b.count - a.count);
  }, [findings]);

  const totalPages = Math.max(1, Math.ceil(findings.length / ITEMS_PER_PAGE));
  const paginatedFindings = findings.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">PC INFORMATION SYSTEM</span>
              <strong className="current-month">
                <Radar size={20} strokeWidth={2} style={{ verticalAlign: "-4px", marginRight: 8 }} />
                PC Connection Status
              </strong>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load connection status: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* SUMMARY CHART */}
          <section className="card" style={{ marginBottom: 20 }}>
            <div className="card-header">
              <div>
                <h3>Connection Finding Breakdown</h3>
                <p>How often each network-connection finding was reported, across all assessed machines</p>
              </div>
            </div>

            {loading ? (
              <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
            ) : summary.length === 0 ? (
              <div className="chart-empty">No connection findings imported yet.</div>
            ) : (
              <div style={{ width: "100%", height: Math.max(220, summary.length * 34) }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={summary}
                    layout="vertical"
                    margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
                    barCategoryGap={12}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                    <YAxis
                      type="category"
                      dataKey="finding"
                      width={260}
                      stroke="#334155"
                      tickLine={false}
                      axisLine={false}
                      style={{ fontSize: "0.72rem", fontWeight: 600 }}
                    />
                    <RechartsTooltip
                      cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                      {summary.map((entry, idx) => (
                        <Cell key={entry.finding} fill={BAR_COLORS[idx % BAR_COLORS.length]} />
                      ))}
                      <LabelList dataKey="count" position="right" style={{ fontSize: "0.72rem", fontWeight: 600, fill: "#475569" }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* DETAIL TABLE */}
          <section className="card assessments-card">
            <div className="card-header">
              <div>
                <h3>All Connection Findings</h3>
                <p>Every raw finding row from imported PC Connection Status reports</p>
              </div>
              <span className="alert-tag info">{findings.length} findings</span>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>
              ) : findings.length === 0 ? (
                <div className="chart-empty">No connection findings imported yet.</div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>MACHINE</th>
                        <th>ASSESSED</th>
                        <th>FINDING</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedFindings.map((f) => (
                        <tr key={f.id}>
                          <td>{[f.motherboard_manufacturer, f.motherboard_product].filter(Boolean).join(" ") || "Unknown machine"}</td>
                          <td>{formatDateTime(f.assessed_at)}</td>
                          <td>{f.finding || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {findings.length > ITEMS_PER_PAGE && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                        <strong>{Math.min(currentPage * ITEMS_PER_PAGE, findings.length)}</strong> of{" "}
                        <strong>{findings.length}</strong> entries
                      </div>

                      <div className="pagination-controls">
                        <button className="btn-modern-nav" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
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

        </div>
      </main>
    </div>
  );
}
