import { useEffect, useMemo, useState, type ReactNode } from "react";
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

// Agent-reported breakdown — only populated on desktops/laptops, and
// only once scripts/Get-InventoryAgent.ps1 has reported at least once.
type InstalledSoftwareItem = { name: string; version: string | null; publisher: string | null; install_date: string | null };
type MissingUpdateItem = { title: string; kb: string | null; severity: string | null };
type UsbHistoryItem = { name: string | null; serial: string; last_seen_utc: string | null };
type NetworkAdapterItem = { description: string | null; mac_address: string | null; ip_address: string | null; dhcp_enabled: boolean; gateway: string | null };
type PrinterItem = { name: string; driver_name: string | null; port_name: string | null };
type HotfixItem = { id: string; description: string | null; installed_on: string | null };

type DeviceReport = UnifiedDevice & {
  raw: {
    os?: string | null;
    cpu_brand?: string | null;
    cpu_cores?: number | null;
    gb_ram?: number | null;
    mac_address?: string | null;
    ip_address?: string | null;
    no_of_installed_anti_virus?: number | null;
    last_agent_report_at?: string | null;
    installed_software?: InstalledSoftwareItem[] | null;
    missing_updates?: MissingUpdateItem[] | null;
    usb_history?: UsbHistoryItem[] | null;
    network_adapters?: NetworkAdapterItem[] | null;
    printers_detected?: PrinterItem[] | null;
    hotfixes?: HotfixItem[] | null;
  };
};

const AGENT_REPORTABLE_TYPES = new Set(["desktops", "laptops"]);

// Agent-reported fields are loosely-typed, best-effort data straight from
// PowerShell/WMI/the registry on an arbitrary managed machine — render
// defensively so an unexpected shape (e.g. an empty object where a
// string was expected) shows as text instead of crashing the page.
function safeText(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    return keys.length > 0 ? JSON.stringify(value) : "—";
  }
  return String(value);
}

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
type Rank = { id: number; rank: string };

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

type DetailModal = "devices" | "personnel" | "divisions" | "active" | null;

type SuspiciousReason = "duplicate-serial" | "missing-serial" | "unassigned";

const SUSPICIOUS_REASON_LABELS: Record<SuspiciousReason, string> = {
  "duplicate-serial": "Duplicate Serial",
  "missing-serial": "Missing Serial",
  unassigned: "No Owner/Division",
};

export default function InventoryDashboard() {
  const navigate = useNavigate();
  // This page's only write action is delete, which is admin-only — editors
  // and viewers both see a read-only view here (the backend rejects the
  // requests anyway, but hiding the button avoids a confusing 401).
  const inventoryRole = localStorage.getItem("inventoryUserRole");
  const canDelete = inventoryRole === "inventory_admin" || inventoryRole === "admin";
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [personnel, setPersonnel] = useState<InventoryPersonnel[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailModal, setDetailModal] = useState<DetailModal>(null);

  // Full agent-report breakdown for one device ("View Full Report").
  const [reportDevice, setReportDevice] = useState<DeviceReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState("");

  const openDeviceReport = async (device: UnifiedDevice) => {
    setReportDevice(null);
    setReportError("");
    setReportLoading(true);

    try {
      const token = localStorage.getItem("inventoryAuthToken");
      const response = await fetch(
        `${API_BASE_URL}/inventory/devices/${device.deviceType}/${device.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: DeviceReport = await response.json();
      setReportDevice(data);
    } catch (err) {
      setReportError(
        err instanceof Error ? err.message : "Unable to load this device's report."
      );
    } finally {
      setReportLoading(false);
    }
  };

  const closeDeviceReport = () => {
    setReportDevice(null);
    setReportError("");
    setReportLoading(false);
  };

  // The only other place a device can be deleted from is a specific
  // person's "Devices" modal on the Personnel page — which auto-
  // registered (unassigned) devices can never be reached from, since
  // there's no owner to click through to. This is the direct path.
  const [deletingDeviceKey, setDeletingDeviceKey] = useState<string | null>(null);

  const deleteDevice = async (device: UnifiedDevice) => {
    if (!window.confirm(`Delete "${device.label}" (serial ${device.serialNo ?? "—"})? This cannot be undone.`)) {
      return;
    }

    const key = `${device.deviceType}-${device.id}`;
    setDeletingDeviceKey(key);

    try {
      const token = localStorage.getItem("inventoryAuthToken");
      const response = await fetch(
        `${API_BASE_URL}/inventory/devices/${device.deviceType}/${device.id}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      setDevices((prev) =>
        prev.filter((d) => !(d.deviceType === device.deviceType && d.id === device.id))
      );

      if (reportDevice && reportDevice.deviceType === device.deviceType && reportDevice.id === device.id) {
        closeDeviceReport();
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete this device.");
    } finally {
      setDeletingDeviceKey(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("inventoryAuthToken");

    async function loadData() {
      try {
        setLoading(true);
        const [devicesRes, personnelRes, divisionsRes, ranksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/devices`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/inventory-personnel`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${API_BASE_URL}/inventory-divisions`),
          fetch(`${API_BASE_URL}/inventory-ranks`),
        ]);

        if (!devicesRes.ok || !personnelRes.ok || !divisionsRes.ok || !ranksRes.ok) {
          throw new Error("One or more inventory endpoints returned an error.");
        }

        setDevices(await devicesRes.json());
        setPersonnel(await personnelRes.json());
        setDivisions(await divisionsRes.json());
        setRanks(await ranksRes.json());
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

  const suspiciousDevices = useMemo(() => {
    const serialCounts = new Map<string, number>();
    for (const d of devices) {
      if (d.serialNo) serialCounts.set(d.serialNo, (serialCounts.get(d.serialNo) ?? 0) + 1);
    }

    return devices
      .filter((d) => d.isActive)
      .map((device) => {
        const reasons: SuspiciousReason[] = [];
        if (device.serialNo && (serialCounts.get(device.serialNo) ?? 0) > 1) reasons.push("duplicate-serial");
        if (!device.serialNo) reasons.push("missing-serial");
        if (device.personnelId === null && device.divisionId === null) reasons.push("unassigned");
        return { device, reasons };
      })
      .filter((entry) => entry.reasons.length > 0)
      .sort((a, b) => b.reasons.length - a.reasons.length);
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

  const rankName = (id: number) => ranks.find((r) => r.id === id)?.rank ?? `#${id}`;

  const activeDeviceList = useMemo(() => devices.filter((d) => d.isActive), [devices]);

  const divisionBreakdown = useMemo(() => {
    return divisions
      .map((division) => ({
        ...division,
        deviceCount: devices.filter((d) => d.divisionId === division.id).length,
        personnelCount: personnel.filter((p) => p.division_id === division.id).length,
      }))
      .sort((a, b) => b.deviceCount - a.deviceCount);
  }, [divisions, devices, personnel]);

  const MODAL_CONFIG: Record<Exclude<DetailModal, null>, { title: string; subtitle: string }> = {
    devices: { title: "All Devices", subtitle: `${devices.length} devices across every category` },
    personnel: { title: "All Personnel", subtitle: `${personnel.length} personnel on record` },
    divisions: { title: "Divisions", subtitle: `${divisions.length} tracked divisions` },
    active: { title: "Active Devices", subtitle: `${activeDeviceList.length} devices currently active` },
  };

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
            <button
              type="button"
              className="stat-card stat-card-clickable"
              onClick={() => setDetailModal("devices")}
            >
              <div className="stat-top">
                <span>Total Devices</span>
                <div className="stat-icon blue"><HardDrive size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : devices.length}</h2>
              <div className="stat-change positive"><span>Across 12 categories</span></div>
              <span className="stat-view-hint">View list →</span>
            </button>

            <button
              type="button"
              className="stat-card stat-card-clickable"
              onClick={() => setDetailModal("personnel")}
            >
              <div className="stat-top">
                <span>Total Personnel</span>
                <div className="stat-icon purple"><Users size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : personnel.length}</h2>
              <div className="stat-change positive"><span>Registered in system</span></div>
              <span className="stat-view-hint">View list →</span>
            </button>

            <button
              type="button"
              className="stat-card stat-card-clickable"
              onClick={() => setDetailModal("divisions")}
            >
              <div className="stat-top">
                <span>Divisions</span>
                <div className="stat-icon orange"><Building2 size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : divisions.length}</h2>
              <div className="stat-change neutral"><span>Tracked divisions</span></div>
              <span className="stat-view-hint">View list →</span>
            </button>

            <button
              type="button"
              className="stat-card stat-card-clickable"
              onClick={() => setDetailModal("active")}
            >
              <div className="stat-top">
                <span>Active Devices</span>
                <div className="stat-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
              </div>
              <h2>{loading ? "..." : activeDevices}</h2>
              <div className="stat-change neutral">{activeRate}%<span> active rate</span></div>
              <span className="stat-view-hint">View list →</span>
            </button>
          </section>

          {/* SUSPICIOUS DEVICE ALERTS */}
          <section className="card suspicious-card">
            <div className="card-header">
              <div>
                <h3>Suspicious Device Alerts</h3>
                <p>Active devices flagged for a duplicate or missing serial number, or no assigned owner and division.</p>
              </div>
              <span className={`alert-tag ${suspiciousDevices.length > 0 ? "danger" : "clear"}`}>
                {suspiciousDevices.length > 0 ? `${suspiciousDevices.length} FLAGGED` : "ALL CLEAR"}
              </span>
            </div>

            {suspiciousDevices.length === 0 ? (
              <div className="alert-clear-state">
                <CheckCircle2 size={16} strokeWidth={2} />
                No suspicious devices detected.
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>TYPE</th>
                      <th>DEVICE</th>
                      <th>SERIAL NO.</th>
                      <th>OWNER</th>
                      <th>DIVISION</th>
                      <th>ISSUE</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {suspiciousDevices.slice(0, 8).map(({ device, reasons }) => (
                      <tr key={`suspicious-${device.deviceType}-${device.id}`}>
                        <td>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType}</td>
                        <td><strong>{device.label}</strong></td>
                        <td>{device.serialNo ?? "—"}</td>
                        <td>{personnelName(personnel, device.personnelId)}</td>
                        <td>{divisionName(divisions, device.divisionId)}</td>
                        <td>
                          <div className="suspicious-reasons">
                            {reasons.map((reason) => (
                              <span key={reason} className={`badge ${reason === "duplicate-serial" ? "obese" : "overweight"}`}>
                                <span className="badge-dot" />
                                {SUSPICIOUS_REASON_LABELS[reason]}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td>
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => deleteDevice(device)}
                              disabled={deletingDeviceKey === `${device.deviceType}-${device.id}`}
                              style={{
                                border: "1px solid #fecaca",
                                background: "#fef2f2",
                                color: "#b91c1c",
                                borderRadius: "6px",
                                padding: "5px 10px",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                              }}
                            >
                              {deletingDeviceKey === `${device.deviceType}-${device.id}` ? "..." : "Delete"}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {suspiciousDevices.length > 8 && (
                  <div className="alert-more-note">+{suspiciousDevices.length - 8} more flagged device(s).</div>
                )}
              </div>
            )}
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

              {typeDistribution.length === 0 ? (
                <div className="chart-empty">No devices recorded yet.</div>
              ) : (
                <div style={{ width: "100%", height: Math.max(300, typeDistribution.length * 32) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={typeDistribution}
                      layout="vertical"
                      margin={{ top: 4, right: 56, left: 4, bottom: 4 }}
                      barCategoryGap={12}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} stroke="#94a3b8" tickLine={false} axisLine={false} style={{ fontSize: "0.7rem" }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={128}
                        stroke="#334155"
                        tickLine={false}
                        axisLine={false}
                        style={{ fontSize: "0.75rem", fontWeight: 600 }}
                      />
                      <RechartsTooltip
                        cursor={{ fill: "rgba(37, 99, 235, 0.06)" }}
                        contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                        formatter={(value: number, _name, props: any) => [`${value} devices (${props.payload.percentage}%)`, props.payload.label]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={18}>
                        {typeDistribution.map((entry, idx) => (
                          <Cell key={entry.type} fill={TYPE_COLORS[idx % TYPE_COLORS.length]} />
                        ))}
                        <LabelList
                          dataKey="count"
                          position="right"
                          style={{ fontSize: "0.72rem", fontWeight: 600, fill: "#475569" }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {typeDistribution.length > 0 && (
                <div className="chart-legend">
                  {typeDistribution.map((item, idx) => (
                    <div className="chart-legend-item" key={item.type}>
                      <span className="chart-legend-dot" style={{ background: TYPE_COLORS[idx % TYPE_COLORS.length] }} />
                      {item.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                <div>
                  <span>Divisions Tracked</span>
                  <strong>{divisions.length}</strong>
                </div>
                <div>
                  <span>Most Common Type</span>
                  <strong>{typeDistribution[0]?.label ?? "—"}</strong>
                </div>
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
                <AreaChart data={monthlyTrend} margin={{ top: 26, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="deviceTrendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1d4ed8" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#eef1f5" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} axisLine={{ stroke: "#e2e8f0" }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} width={28} />
                  <RechartsTooltip
                    cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
                    contentStyle={{ borderRadius: 8, border: "1px solid #e2e8f0", fontSize: "0.8rem" }}
                    formatter={(value: number) => [`${value} device${value === 1 ? "" : "s"}`, "Added"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    name="Devices Added"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    fill="url(#deviceTrendFill)"
                    dot={{ r: 3.5, fill: "#1d4ed8", strokeWidth: 0 }}
                    activeDot={{ r: 6 }}
                  >
                    <LabelList
                      dataKey="count"
                      position="top"
                      offset={10}
                      style={{ fontSize: "0.7rem", fontWeight: 600, fill: "#1d4ed8" }}
                    />
                  </Area>
                </AreaChart>
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
                        <th>REPORT</th>
                        <th></th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedDevices.length === 0 ? (
                        <tr>
                          <td colSpan={9} style={{ textAlign: "center", padding: "2rem" }}>
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
                            <td>
                              {AGENT_REPORTABLE_TYPES.has(device.deviceType) ? (
                                <button
                                  type="button"
                                  onClick={() => openDeviceReport(device)}
                                  style={{
                                    border: "1px solid #dbeafe",
                                    background: "#eff6ff",
                                    color: "#1d4ed8",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  View
                                </button>
                              ) : (
                                <span style={{ color: "#9ca3af" }}>—</span>
                              )}
                            </td>
                            <td>
                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() => deleteDevice(device)}
                                  disabled={deletingDeviceKey === `${device.deviceType}-${device.id}`}
                                  style={{
                                    border: "1px solid #fecaca",
                                    background: "#fef2f2",
                                    color: "#b91c1c",
                                    borderRadius: "6px",
                                    padding: "5px 10px",
                                    fontSize: "12px",
                                    fontWeight: 600,
                                    cursor: "pointer",
                                  }}
                                >
                                  {deletingDeviceKey === `${device.deviceType}-${device.id}` ? "..." : "Delete"}
                                </button>
                              )}
                            </td>
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

          {/* QUICK ACTIONS */}
          <section className="bottom-grid">
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

        </div>
      </main>

      {/* STAT CARD DETAIL MODAL */}
      {detailModal && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setDetailModal(null); }}
        >
          <div style={{ width: "100%", maxWidth: "900px", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{MODAL_CONFIG[detailModal].title}</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>{MODAL_CONFIG[detailModal].subtitle}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetailModal(null)}
                style={{ border: "none", background: "#f3f4f6", width: "38px", height: "38px", borderRadius: "50%", fontSize: "22px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "8px 28px 28px" }}>
              {(detailModal === "devices" || detailModal === "active") && (
                <div className="table-container">
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
                      {(detailModal === "active" ? activeDeviceList : devices).length === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: "center", padding: "2rem" }}>No devices found.</td>
                        </tr>
                      ) : (
                        (detailModal === "active" ? activeDeviceList : devices).map((device) => (
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
                </div>
              )}

              {detailModal === "personnel" && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>PERSONNEL</th>
                        <th>DIVISION</th>
                        <th>RANK</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personnel.length === 0 ? (
                        <tr>
                          <td colSpan={4} style={{ textAlign: "center", padding: "2rem" }}>No personnel found.</td>
                        </tr>
                      ) : (
                        personnel.map((p) => (
                          <tr key={p.id}>
                            <td><strong>{[p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ")}</strong></td>
                            <td>{divisionName(divisions, p.division_id)}</td>
                            <td>{rankName(p.rank_id)}</td>
                            <td>
                              <span className={`badge ${p.is_active ? "normal" : "obese"}`}>
                                <span className="badge-dot" />
                                {p.is_active ? "Active" : "Inactive"}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {detailModal === "divisions" && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>DIVISION</th>
                        <th>DEVICES</th>
                        <th>PERSONNEL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {divisionBreakdown.length === 0 ? (
                        <tr>
                          <td colSpan={3} style={{ textAlign: "center", padding: "2rem" }}>No divisions found.</td>
                        </tr>
                      ) : (
                        divisionBreakdown.map((d) => (
                          <tr key={d.id}>
                            <td><strong>{d.division}</strong></td>
                            <td>{d.deviceCount}</td>
                            <td>{d.personnelCount}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL AGENT-REPORT MODAL (per-device Belarc-style breakdown) */}
      {(reportLoading || reportDevice || reportError) && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeDeviceReport(); }}
        >
          <div style={{ width: "100%", maxWidth: "820px", maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, background: "#fff", zIndex: 1 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>
                  {reportDevice ? reportDevice.label : "Device Report"}
                </h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>
                  {reportDevice
                    ? `Reported by scripts/Get-InventoryAgent.ps1 — last agent check-in ${
                        reportDevice.raw.last_agent_report_at
                          ? new Date(reportDevice.raw.last_agent_report_at).toLocaleString()
                          : "never"
                      }`
                    : "Full hardware/software inventory from the local agent"}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {reportDevice && canDelete && (
                  <button
                    type="button"
                    onClick={() => deleteDevice(reportDevice)}
                    disabled={deletingDeviceKey === `${reportDevice.deviceType}-${reportDevice.id}`}
                    style={{ border: "1px solid #fecaca", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", padding: "9px 14px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                  >
                    {deletingDeviceKey === `${reportDevice.deviceType}-${reportDevice.id}` ? "Deleting..." : "Delete Device"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={closeDeviceReport}
                  style={{ border: "none", background: "#f3f4f6", width: "38px", height: "38px", borderRadius: "50%", fontSize: "22px", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>
            </div>

            <div style={{ padding: "8px 28px 28px" }}>
              {reportLoading && (
                <div style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading report...</div>
              )}

              {reportError && (
                <div style={{ padding: "1rem", color: "#b91c1c", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px" }}>
                  {reportError}
                </div>
              )}

              {reportDevice && !reportLoading && (
                <>
                  {!reportDevice.raw.last_agent_report_at && (
                    <div style={{ padding: "12px 14px", marginTop: "8px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: "8px", color: "#92400e", fontSize: "13px" }}>
                      This device hasn't reported yet. Run <code>Get-InventoryAgent.ps1</code> on it (serial must match "{reportDevice.serialNo}") to populate this report.
                    </div>
                  )}

                  {/* SUMMARY */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", margin: "16px 0 24px" }}>
                    {[
                      ["Operating System", reportDevice.raw.os],
                      ["Processor", reportDevice.raw.cpu_brand],
                      ["CPU Cores", reportDevice.raw.cpu_cores],
                      ["Memory", reportDevice.raw.gb_ram ? `${reportDevice.raw.gb_ram} GB` : null],
                      ["MAC Address", reportDevice.raw.mac_address],
                      ["IP Address", reportDevice.raw.ip_address],
                      ["Antivirus Products", reportDevice.raw.no_of_installed_anti_virus],
                    ].map(([label, value]) => (
                      <div key={label as string} style={{ padding: "10px 12px", background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#111827", marginTop: "2px" }}>{safeText(value)}</div>
                      </div>
                    ))}
                  </div>

                  {/* MISSING UPDATES */}
                  <ReportSection title="Missing Security Updates" count={reportDevice.raw.missing_updates?.length}>
                    {reportDevice.raw.missing_updates && reportDevice.raw.missing_updates.length > 0 ? (
                      <div className="table-container">
                        <table>
                          <thead><tr><th>UPDATE</th><th>KB</th><th>SEVERITY</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.missing_updates.map((u, i) => (
                              <tr key={i}>
                                <td>{u.title}</td>
                                <td>{u.kb ?? "—"}</td>
                                <td>{u.severity ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No missing updates reported — either fully patched, or the agent was run with -SkipUpdateCheck." />
                    )}
                  </ReportSection>

                  {/* INSTALLED SOFTWARE */}
                  <ReportSection title="Installed Software" count={reportDevice.raw.installed_software?.length}>
                    {reportDevice.raw.installed_software && reportDevice.raw.installed_software.length > 0 ? (
                      <div className="table-container" style={{ maxHeight: "280px", overflowY: "auto" }}>
                        <table>
                          <thead><tr><th>NAME</th><th>VERSION</th><th>PUBLISHER</th><th>INSTALLED</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.installed_software.map((s, i) => (
                              <tr key={i}>
                                <td>{s.name}</td>
                                <td>{s.version ?? "—"}</td>
                                <td>{s.publisher ?? "—"}</td>
                                <td>{formatDate(s.install_date)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No installed-software data reported yet." />
                    )}
                  </ReportSection>

                  {/* NETWORK ADAPTERS */}
                  <ReportSection title="Network Adapters" count={reportDevice.raw.network_adapters?.length}>
                    {reportDevice.raw.network_adapters && reportDevice.raw.network_adapters.length > 0 ? (
                      <div className="table-container">
                        <table>
                          <thead><tr><th>ADAPTER</th><th>MAC</th><th>IP</th><th>DHCP</th><th>GATEWAY</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.network_adapters.map((n, i) => (
                              <tr key={i}>
                                <td>{safeText(n.description)}</td>
                                <td>{safeText(n.mac_address)}</td>
                                <td>{safeText(n.ip_address)}</td>
                                <td>{n.dhcp_enabled ? "Yes" : "No"}</td>
                                <td>{safeText(n.gateway)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No network adapter data reported yet." />
                    )}
                  </ReportSection>

                  {/* USB HISTORY */}
                  <ReportSection title="USB Storage History" count={reportDevice.raw.usb_history?.length}>
                    {reportDevice.raw.usb_history && reportDevice.raw.usb_history.length > 0 ? (
                      <div className="table-container">
                        <table>
                          <thead><tr><th>DEVICE</th><th>SERIAL</th><th>LAST CONNECTED</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.usb_history.map((u, i) => (
                              <tr key={i}>
                                <td>{u.name ?? "—"}</td>
                                <td>{u.serial}</td>
                                <td>{u.last_seen_utc ? new Date(u.last_seen_utc).toLocaleString() : "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No USB storage devices detected." />
                    )}
                  </ReportSection>

                  {/* PRINTERS */}
                  <ReportSection title="Printers" count={reportDevice.raw.printers_detected?.length}>
                    {reportDevice.raw.printers_detected && reportDevice.raw.printers_detected.length > 0 ? (
                      <div className="table-container">
                        <table>
                          <thead><tr><th>PRINTER</th><th>DRIVER</th><th>PORT</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.printers_detected.map((p, i) => (
                              <tr key={i}>
                                <td>{p.name}</td>
                                <td>{p.driver_name ?? "—"}</td>
                                <td>{p.port_name ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No printers detected." />
                    )}
                  </ReportSection>

                  {/* HOTFIXES */}
                  <ReportSection title="Installed Hotfixes" count={reportDevice.raw.hotfixes?.length}>
                    {reportDevice.raw.hotfixes && reportDevice.raw.hotfixes.length > 0 ? (
                      <div className="table-container" style={{ maxHeight: "220px", overflowY: "auto" }}>
                        <table>
                          <thead><tr><th>HOTFIX</th><th>DESCRIPTION</th><th>INSTALLED</th></tr></thead>
                          <tbody>
                            {reportDevice.raw.hotfixes.map((h, i) => (
                              <tr key={i}>
                                <td>{h.id}</td>
                                <td>{h.description ?? "—"}</td>
                                <td>{formatDate(h.installed_on)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <EmptySection text="No hotfix data reported yet." />
                    )}
                  </ReportSection>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ReportSection({
  title,
  count,
  children,
}: {
  title: string;
  count: number | undefined;
  children: ReactNode;
}) {
  return (
    <div style={{ marginBottom: "22px" }}>
      <h3 style={{ margin: "0 0 10px", fontSize: "15px", fontWeight: 700, color: "#111827" }}>
        {title}
        {typeof count === "number" && (
          <span style={{ marginLeft: "8px", fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>
            ({count})
          </span>
        )}
      </h3>
      {children}
    </div>
  );
}

function EmptySection({ text }: { text: string }) {
  return (
    <div style={{ padding: "14px", background: "#f9fafb", border: "1px dashed #e5e7eb", borderRadius: "8px", color: "#9ca3af", fontSize: "13px" }}>
      {text}
    </div>
  );
}
