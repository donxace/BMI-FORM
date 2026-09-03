import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Analytics.css";
import { CheckCircle2, LayoutDashboard, Users, FileText, AlertTriangle } from "lucide-react";
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

type Division = { id: number; division: string };

const DEVICE_TYPE_LABELS: Record<string, string> = {
  desktops: "Desktop", laptops: "Laptop", cameras: "Camera", headsets: "Headset",
  printers: "Printer", splitters: "Splitter", switchers: "Switcher", ups: "UPS Unit",
  others: "Other Equipment", routers: "Router", firewalls: "Firewall", switches: "Switch",
};

const DIVISION_COLORS = ["#1d4ed8", "#7c3aed", "#0d9488", "#f59e0b", "#ef4444", "#22c55e", "#0891b2", "#db2777"];

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("authToken")}` };
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function daysSince(date: string | null) {
  if (!date) return null;
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return null;
  return Math.floor((Date.now() - parsed.getTime()) / (1000 * 60 * 60 * 24));
}

const STALE_THRESHOLD_DAYS = 90;
const PERIOD_LABELS: Record<string, string> = { today: "Today", month: "This Month", year: "This Year" };

export default function InventoryAnalytics() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [divisionFilter, setDivisionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [period, setPeriod] = useState("all");

  const currentDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [devicesRes, divisionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/devices`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/inventory-divisions`),
        ]);
        if (!devicesRes.ok || !divisionsRes.ok) throw new Error("Failed to load analytics data.");
        setDevices(await devicesRes.json());
        setDivisions(await divisionsRes.json());
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
    setTypeFilter("");
    setStatusFilter("");
    setPeriod("all");
  }

  const filteredDevices = useMemo(() => {
    const now = new Date();
    return devices.filter((d) => {
      const matchesDivision = !divisionFilter || String(d.divisionId) === divisionFilter;
      const matchesType = !typeFilter || d.deviceType === typeFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? d.isActive : !d.isActive);

      let matchesPeriod = true;
      if (period !== "all" && d.createdDate) {
        const created = new Date(d.createdDate);
        if (period === "today") matchesPeriod = created.toDateString() === now.toDateString();
        else if (period === "month") matchesPeriod = created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
        else if (period === "year") matchesPeriod = created.getFullYear() === now.getFullYear();
      } else if (period !== "all" && !d.createdDate) {
        matchesPeriod = false;
      }

      return matchesDivision && matchesType && matchesStatus && matchesPeriod;
    });
  }, [devices, divisionFilter, typeFilter, statusFilter, period]);

  const totalDevices = filteredDevices.length;
  const activeCount = filteredDevices.filter((d) => d.isActive).length;
  const activeRate = totalDevices > 0 ? (activeCount / totalDevices) * 100 : 0;
  const divisionsCovered = new Set(filteredDevices.map((d) => d.divisionId)).size;
  const personnelCovered = new Set(filteredDevices.map((d) => d.personnelId).filter((id) => id !== null)).size;

  const typeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of filteredDevices) counts.set(d.deviceType, (counts.get(d.deviceType) ?? 0) + 1);
    return Array.from(counts.entries())
      .map(([type, count]) => ({ type, label: DEVICE_TYPE_LABELS[type] ?? type, count, percentage: totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0 }))
      .sort((a, b) => b.count - a.count);
  }, [filteredDevices, totalDevices]);

  const mostCommonType = typeCounts[0]?.label ?? "—";

  const divisionAnalytics = useMemo(() => {
    const byDivision = new Map<number | null, { count: number; active: number; inactive: number }>();
    for (const d of filteredDevices) {
      const entry = byDivision.get(d.divisionId) ?? { count: 0, active: 0, inactive: 0 };
      entry.count += 1;
      if (d.isActive) entry.active += 1; else entry.inactive += 1;
      byDivision.set(d.divisionId, entry);
    }
    return Array.from(byDivision.entries())
      .map(([divisionId, stats]) => ({
        divisionId,
        name: divisionId === null ? "Unassigned" : divisions.find((dv) => dv.id === divisionId)?.division ?? `#${divisionId}`,
        ...stats,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredDevices, divisions]);

  const divisionNames = useMemo(() => divisionAnalytics.map((d) => d.name).slice(0, 8), [divisionAnalytics]);

  const divisionTrendData = useMemo(() => {
    const buckets = new Map<string, Record<string, any>>();
    for (const device of filteredDevices) {
      if (!device.createdDate) continue;
      const parsed = new Date(device.createdDate);
      if (isNaN(parsed.getTime())) continue;
      const key = `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, "0")}`;
      const label = parsed.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
      const divisionName = device.divisionId === null ? "Unassigned" : divisions.find((dv) => dv.id === device.divisionId)?.division ?? `#${device.divisionId}`;
      if (!divisionNames.includes(divisionName)) continue;

      const bucket = buckets.get(key) ?? { month: label, sortKey: key };
      bucket[divisionName] = (bucket[divisionName] ?? 0) + 1;
      buckets.set(key, bucket);
    }
    return Array.from(buckets.values()).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filteredDevices, divisions, divisionNames]);

  const recentDevices = useMemo(
    () => [...filteredDevices].sort((a, b) => {
      const aTime = a.createdDate ? new Date(a.createdDate).getTime() : 0;
      const bTime = b.createdDate ? new Date(b.createdDate).getTime() : 0;
      return bTime - aTime;
    }).slice(0, 8),
    [filteredDevices]
  );

  const staleDevices = useMemo(() => {
    return filteredDevices
      .filter((d) => d.isActive && (daysSince(d.lastUpdateAt) === null || (daysSince(d.lastUpdateAt) as number) > STALE_THRESHOLD_DAYS))
      .sort((a, b) => {
        const aTime = a.lastUpdateAt ? new Date(a.lastUpdateAt).getTime() : 0;
        const bTime = b.lastUpdateAt ? new Date(b.lastUpdateAt).getTime() : 0;
        return aTime - bTime;
      });
  }, [filteredDevices]);

  function toggleDivisionFilter(id: number | null) {
    const value = id === null ? "" : String(id);
    setDivisionFilter((prev) => (prev === value ? "" : value));
  }

  function toggleTypeFilter(type: string) {
    setTypeFilter((prev) => (prev === type ? "" : type));
  }

  function scrollToSection(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const activeFilterPills = useMemo(() => {
    const pills: { key: string; label: string; onClear: () => void }[] = [];
    if (divisionFilter) {
      const name = divisions.find((d) => String(d.id) === divisionFilter)?.division ?? `#${divisionFilter}`;
      pills.push({ key: "division", label: `Division: ${name}`, onClear: () => setDivisionFilter("") });
    }
    if (typeFilter) {
      pills.push({ key: "type", label: `Type: ${DEVICE_TYPE_LABELS[typeFilter] ?? typeFilter}`, onClear: () => setTypeFilter("") });
    }
    if (statusFilter) {
      pills.push({ key: "status", label: `Status: ${statusFilter === "active" ? "Active" : "Inactive"}`, onClear: () => setStatusFilter("") });
    }
    if (period !== "all") {
      pills.push({ key: "period", label: `Period: ${PERIOD_LABELS[period] ?? period}`, onClear: () => setPeriod("all") });
    }
    return pills;
  }, [divisionFilter, typeFilter, statusFilter, period, divisions]);

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <div className="breadcrumb">
            <span className="breadcrumb-link" onClick={() => navigate("/inventory/dashboard")}>Hardware Inventory</span> / Analytics
          </div>
          <h1>Inventory Analytics</h1>
          <p>Analyze device distribution, division coverage, and inventory trends.</p>
        </div>
        <div className="analytics-header-right">
          <div className="analytics-quicknav">
            <button onClick={() => navigate("/inventory/dashboard")}><LayoutDashboard size={13} strokeWidth={2.25} /> Dashboard</button>
            <button onClick={() => navigate("/inventory/personnel")}><Users size={13} strokeWidth={2.25} /> Personnel</button>
            <button onClick={() => navigate("/inventory/report")}><FileText size={13} strokeWidth={2.25} /> Report</button>
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
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.division}</option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label>DEVICE TYPE</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(DEVICE_TYPE_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
          </div>

          <div className="analytics-field">
            <label>STATUS</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
          title="Clear filters and view all devices"
          onClick={clearFilters}
          onKeyDown={(e) => { if (e.key === "Enter") clearFilters(); }}
        >
          <div className="analytics-icon blue">#</div>
          <div><span>DEVICES</span><strong>{totalDevices}</strong><small>Filtered records</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Go to Personnel"
          onClick={() => navigate("/inventory/personnel")}
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/inventory/personnel"); }}
        >
          <div className="analytics-icon green">P</div>
          <div><span>PERSONNEL</span><strong>{personnelCovered}</strong><small>Unique owners</small></div>
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
          title="Filter to active devices"
          onClick={() => setStatusFilter("active")}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter("active"); }}
        >
          <div className="analytics-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
          <div><span>ACTIVE RATE</span><strong>{activeRate.toFixed(1)}%</strong><small>{activeCount} active devices</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title="Filter to inactive devices"
          onClick={() => setStatusFilter("inactive")}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter("inactive"); }}
        >
          <div className="analytics-icon orange">!</div>
          <div><span>INACTIVE</span><strong>{totalDevices - activeCount}</strong><small>{(100 - activeRate).toFixed(1)}% of filtered</small></div>
        </div>
        <div
          className="analytics-summary-card clickable"
          role="button" tabIndex={0}
          title={`Filter to ${mostCommonType}`}
          onClick={() => typeCounts[0] && toggleTypeFilter(typeCounts[0].type)}
          onKeyDown={(e) => { if (e.key === "Enter" && typeCounts[0]) toggleTypeFilter(typeCounts[0].type); }}
        >
          <div className="analytics-icon purple">TY</div>
          <div><span>TOP TYPE</span><strong>{mostCommonType}</strong><small>Most common category</small></div>
        </div>
      </section>

      {(staleDevices.length > 0 || totalDevices > 0) && (
        <section className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Devices Needing Attention</h3>
              <p>Active devices with no recorded update in over {STALE_THRESHOLD_DAYS} days.</p>
            </div>
            <span className={`card-tag ${staleDevices.length > 0 ? "warning" : ""}`}>
              {staleDevices.length > 0 ? `${staleDevices.length} STALE` : "ALL UP TO DATE"}
            </span>
          </div>

          {staleDevices.length === 0 ? (
            <div className="analytics-empty">
              <CheckCircle2 size={16} strokeWidth={2} style={{ marginRight: 6, verticalAlign: "-3px", color: "#15803d" }} />
              Every active device in this view has been updated within the last {STALE_THRESHOLD_DAYS} days.
            </div>
          ) : (
            <div className="recent-list">
              {staleDevices.slice(0, 6).map((device) => {
                const age = daysSince(device.lastUpdateAt);
                return (
                  <div className="recent-row" key={`stale-${device.deviceType}-${device.id}`}>
                    <div className="recent-avatar" style={{ background: "#fef2f2", color: "#dc2626" }}>
                      <AlertTriangle size={14} strokeWidth={2.25} />
                    </div>
                    <div className="recent-person">
                      <strong>{device.label}</strong>
                      <small>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType} · {divisionAnalytics.find((d) => d.divisionId === device.divisionId)?.name ?? "Unassigned"}</small>
                    </div>
                    <span className="classification-badge obese">
                      <span className="classification-dot" />
                      {age === null ? "Never updated" : `${age}d ago`}
                    </span>
                    <div className="recent-date">Added {formatDate(device.createdDate)}</div>
                  </div>
                );
              })}
              {staleDevices.length > 6 && (
                <div className="analytics-empty">+{staleDevices.length - 6} more stale device(s) in this view.</div>
              )}
            </div>
          )}
        </section>
      )}

      <section className="analytics-card">
        <div className="card-heading">
          <div>
            <h3>Devices Added by Division</h3>
            <p>Monthly device additions across the top divisions.</p>
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
        <div className="analytics-card">
          <div className="card-heading">
            <div>
              <h3>Device Type Distribution</h3>
              <p>Breakdown of devices by category.</p>
            </div>
          </div>

          <div className="distribution">
            {typeCounts.length === 0 ? (
              <div className="analytics-empty">No devices recorded yet.</div>
            ) : (
              typeCounts.map((item, idx) => (
                <div
                  className={`distribution-row clickable ${typeFilter === item.type ? "active" : ""}`}
                  key={item.type}
                  role="button" tabIndex={0}
                  title={`Filter to ${item.label}`}
                  onClick={() => toggleTypeFilter(item.type)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleTypeFilter(item.type); }}
                >
                  <div className="distribution-info">
                    <span>{item.label}</span>
                    <strong>{item.count}</strong>
                  </div>
                  <div className="progress">
                    <div className="progress-bar" style={{ width: `${item.percentage}%`, background: DIVISION_COLORS[idx % DIVISION_COLORS.length] }} />
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
              <h3>Inventory Profile</h3>
              <p>Key population statistics for the current filters.</p>
            </div>
          </div>

          <div className="insight-list">
            <div className="insight-item">
              <span className="insight-icon blue">#</span>
              <div><strong>Total Devices</strong><p>{totalDevices} devices across {divisionsCovered} divisions.</p></div>
            </div>
            <div className="insight-item">
              <span className="insight-icon green"><CheckCircle2 size={16} strokeWidth={2} /></span>
              <div><strong>Active Rate</strong><p>{activeRate.toFixed(1)}% of filtered devices are currently active.</p></div>
            </div>
            <div className="insight-item">
              <span className="insight-icon purple">TY</span>
              <div><strong>Most Common Type</strong><p>{mostCommonType} is the most represented device category.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="analytics-card" id="division-analysis">
        <div className="card-heading">
          <div>
            <h3>Division Device Analysis</h3>
            <p>Compare device volume and status across divisions. Click a row to filter by that division.</p>
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
                  <th>DEVICES</th>
                  <th>ACTIVE</th>
                  <th>INACTIVE</th>
                </tr>
              </thead>
              <tbody>
                {divisionAnalytics.map((item) => (
                  <tr
                    key={item.name}
                    className={`clickable-row ${divisionFilter === (item.divisionId === null ? "" : String(item.divisionId)) && divisionFilter !== "" ? "active" : ""}`}
                    title={`Filter to ${item.name}`}
                    onClick={() => toggleDivisionFilter(item.divisionId)}
                  >
                    <td><strong>{item.name}</strong></td>
                    <td>{item.count}</td>
                    <td><span className="mini-badge normal">{item.active}</span></td>
                    <td><span className="mini-badge obese">{item.inactive}</span></td>
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
            <h3>Recent Device Activity</h3>
            <p>Latest device records within the selected filters.</p>
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
        ) : recentDevices.length === 0 ? (
          <div className="analytics-empty">No device records match the selected filters.</div>
        ) : (
          <div className="recent-list">
            {recentDevices.map((device) => (
              <div className="recent-row" key={`${device.deviceType}-${device.id}`}>
                <div className="recent-avatar">{(DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType).slice(0, 2).toUpperCase()}</div>
                <div className="recent-person">
                  <strong>{device.label}</strong>
                  <small>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType}</small>
                </div>
                <span className={`classification-badge ${device.isActive ? "normal" : "obese"}`}>
                  <span className="classification-dot" />
                  {device.isActive ? "Active" : "Inactive"}
                </span>
                <div className="recent-date">{formatDate(device.createdDate)}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
