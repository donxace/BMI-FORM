import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";
import {
  HardDrive,
  Users,
  Building2,
  CheckCircle2,
  UserPlus,
  FileText,
  ChevronRight,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type UnifiedDevice = {
  id: number;
  deviceType: string;
  label: string;
  personnelId: number | null;
  divisionId: number | null;
  serialNo: string | null;
  isActive: boolean;
  createdDate: string | null;
  lastUpdateAt: string | null;
};

type InventoryPersonnel = {
  id: number;
  division_id: number;
  rank_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  is_active: boolean;
};

type Division = { id: number; division: string };

const TYPE_COLORS = [
  "#1d4ed8", "#7c3aed", "#0d9488", "#f59e0b",
  "#ef4444", "#22c55e", "#0891b2", "#db2777",
  "#65a30d", "#9333ea", "#e11d48", "#475569",
];

const DEVICE_TYPE_LABELS: Record<string, string> = {
  desktops: "Desktops",
  laptops: "Laptops",
  cameras: "Cameras",
  headsets: "Headsets",
  printers: "Printers",
  splitters: "Splitters",
  switchers: "Switchers",
  ups: "UPS Units",
  others: "Other Equipment",
  routers: "Routers",
  firewalls: "Firewalls",
  switches: "Switches",
};

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function divisionName(divisions: Division[], id: number | null) {
  if (id === null) return "Unassigned";
  return divisions.find((d) => d.id === id)?.division ?? `Division #${id}`;
}

function personnelName(personnel: InventoryPersonnel[], id: number | null) {
  if (id === null) return "Unassigned";
  const p = personnel.find((p) => p.id === id);
  if (!p) return `Personnel #${id}`;
  return [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
}

const ITEMS_PER_PAGE = 10;

export default function InventoryDashboard() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [personnel, setPersonnel] = useState<InventoryPersonnel[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    async function loadData() {
      try {
        setLoading(true);
        const [devicesRes, personnelRes, divisionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/devices`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/inventory-personnel`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/inventory-divisions`),
        ]);

        if (!devicesRes.ok || !personnelRes.ok || !divisionsRes.ok) {
          throw new Error("One or more inventory endpoints returned an error.");
        }

        setDevices(await devicesRes.json());
        setPersonnel(await personnelRes.json());
        setDivisions(await divisionsRes.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load inventory data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const activeDevices = useMemo(() => devices.filter((d) => d.isActive).length, [devices]);
  const activeRate = devices.length > 0 ? ((activeDevices / devices.length) * 100).toFixed(1) : "0.0";

  const typeDistribution = useMemo(() => {
    const counts = new Map<string, number>();
    for (const device of devices) {
      counts.set(device.deviceType, (counts.get(device.deviceType) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([type, count]) => ({
        type,
        label: DEVICE_TYPE_LABELS[type] ?? type,
        count,
        percentage: devices.length > 0 ? Math.round((count / devices.length) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [devices]);

  const monthlyTrend = useMemo(() => {
    const buckets = new Map<string, { label: string; count: number; sortKey: string }>();

    for (const device of devices) {
      if (!device.createdDate) continue;
      const parsed = new Date(device.createdDate);
      if (isNaN(parsed.getTime())) continue;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      const label = parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const existing = buckets.get(key);
      buckets.set(key, { label, count: (existing?.count ?? 0) + 1, sortKey: key });
    }

    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [devices]);

  const recentDevices = useMemo(() => {
    return [...devices].sort((a, b) => {
      const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return bTime - aTime;
    });
  }, [devices]);

  const totalPages = Math.max(1, Math.ceil(recentDevices.length / ITEMS_PER_PAGE));
  const paginatedDevices = recentDevices.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
              <span className="date-label">HARDWARE INVENTORY</span>
              <strong className="current-month">Overview</strong>
            </div>

            <div className="header-actions">
              <button className="secondary-button" onClick={() => navigate("/inventory/report")}>
                <FileText size={13} strokeWidth={2.25} />
                Generate Report
              </button>

              <button className="primary-button" onClick={() => navigate("/inventory/personnel")}>
                + Add Personnel
              </button>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load dashboard data: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* STAT CARDS */}
          <section className="stat-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total Devices</span>
                <div className="stat-icon blue"><HardDrive size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : devices.length}</h2>
              <div className="stat-change positive"><span>Across 12 categories</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Total Personnel</span>
                <div className="stat-icon purple"><Users size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : personnel.length}</h2>
              <div className="stat-change positive"><span>Registered in system</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Divisions</span>
                <div className="stat-icon orange"><Building2 size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : divisions.length}</h2>
              <div className="stat-change neutral"><span>Tracked divisions</span></div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Active Devices</span>
                <div className="stat-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : activeDevices}</h2>
              <div className="stat-change neutral">{activeRate}%<span> active rate</span></div>
            </div>
          </section>

          {/* MAIN GRID */}
          <section className="dashboard-grid">
            <div className="card bmi-card">
              <div className="card-header">
                <div>
                  <h3>Devices by Type</h3>
                  <p>Current inventory breakdown across all 12 categories</p>
                </div>
              </div>

              <div className="distribution">
                {typeDistribution.length === 0 ? (
                  <div className="chart-empty">No devices recorded yet.</div>
                ) : (
                  typeDistribution.map((item, idx) => (
                    <div className="distribution-row" key={item.type}>
                      <div className="distribution-info">
                        <span>{item.label}</span>
                        <strong>{item.count}</strong>
                      </div>
                      <div className="progress">
                        <div
                          className="progress-bar"
                          style={{ width: `${item.percentage}%`, background: TYPE_COLORS[idx % TYPE_COLORS.length] }}
                        />
                      </div>
                      <span className="percentage">{item.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="card quick-card">
              <div className="card-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Frequently used functions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button onClick={() => navigate("/inventory/personnel")}>
                  <span className="quick-icon green"><UserPlus size={16} strokeWidth={2} /></span>
                  <div>
                    <strong>Manage Personnel</strong>
                    <small>Add, edit, or assign devices</small>
                  </div>
                  <span><ChevronRight size={14} strokeWidth={2} /></span>
                </button>

                <button onClick={() => navigate("/inventory/report")}>
                  <span className="quick-icon purple"><FileText size={16} strokeWidth={2} /></span>
                  <div>
                    <strong>Generate Report</strong>
                    <small>Export inventory to Excel</small>
                  </div>
                  <span><ChevronRight size={14} strokeWidth={2} /></span>
                </button>

                <button onClick={() => navigate("/inventory/analytics")}>
                  <span className="quick-icon blue"><HardDrive size={16} strokeWidth={2.25} /></span>
                  <div>
                    <strong>View Analytics</strong>
                    <small>Division and type breakdowns</small>
                  </div>
                  <span><ChevronRight size={14} strokeWidth={2} /></span>
                </button>
              </div>
            </div>
          </section>

          {/* TREND */}
          <section className="card trend-card-single">
            <div className="card-header">
              <div>
                <h3>Devices Added Over Time</h3>
                <p>Monthly count of devices recorded, across all categories</p>
              </div>
            </div>

            {monthlyTrend.length === 0 ? (
              <div className="chart-empty">No dated records yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={monthlyTrend} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                  <RechartsTooltip cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Devices Added"
                    stroke="#1d4ed8"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#1d4ed8", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* RECENT DEVICES TABLE */}
          <section className="card assessments-card">
            <div className="card-header">
              <div>
                <h3>Recent Devices</h3>
                <p>Latest additions across all inventory categories</p>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>Loading devices...</div>
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
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedDevices.length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>
                            No devices found.
                          </td>
                        </tr>
                      ) : (
                        paginatedDevices.map((device) => (
                          <tr key={`${device.deviceType}-${device.id}`}>
                            <td>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType}</td>
                            <td><strong>{device.label}</strong></td>
                            <td>{device.serialNo ?? "—"}</td>
                            <td>{personnelName(personnel, device.personnelId)}</td>
                            <td>{divisionName(divisions, device.divisionId)}</td>
                            <td>
                              <span className={`badge ${device.isActive ? "normal" : "obese"}`}>
                                <span className="badge-dot" />
                                {device.isActive ? "Active" : "Inactive"}
                              </span>
                            </td>
                            <td>{formatDate(device.createdDate)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {recentDevices.length > ITEMS_PER_PAGE && (
                    <div className="pagination-container">
                      <div className="pagination-info">
                        Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                        <strong>{Math.min(currentPage * ITEMS_PER_PAGE, recentDevices.length)}</strong> of{" "}
                        <strong>{recentDevices.length}</strong> entries
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

          {/* SYSTEM SUMMARY */}
          <section className="bottom-grid">
            <div className="card system-card">
              <div className="card-header">
                <div>
                  <h3>System Summary</h3>
                  <p>Hardware inventory status</p>
                </div>
              </div>

              <div className="summary-list">
                <div>
                  <span>Total Records</span>
                  <strong>{devices.length}</strong>
                </div>
                <div>
                  <span>Active Devices</span>
                  <strong>{activeDevices}</strong>
                </div>
                <div>
                  <span>Inactive Devices</span>
                  <strong>{devices.length - activeDevices}</strong>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
