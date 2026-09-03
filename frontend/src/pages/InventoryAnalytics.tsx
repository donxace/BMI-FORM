import { useEffect, useMemo, useState } from "react";
import "./Analytics.css";
import { CheckCircle2 } from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

export default function InventoryAnalytics() {
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

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <div className="breadcrumb">Hardware Inventory / Analytics</div>
          <h1>Inventory Analytics</h1>
          <p>Analyze device distribution, division coverage, and inventory trends.</p>
        </div>
        <div className="analytics-date">
          <span>TODAY</span>
          <strong>{currentDate}</strong>
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
      </section>

      <section className="analytics-summary">
        <div className="analytics-summary-card">
          <div className="analytics-icon blue">#</div>
          <div><span>DEVICES</span><strong>{totalDevices}</strong><small>Filtered records</small></div>
        </div>
        <div className="analytics-summary-card">
          <div className="analytics-icon green">P</div>
          <div><span>PERSONNEL</span><strong>{personnelCovered}</strong><small>Unique owners</small></div>
        </div>
        <div className="analytics-summary-card">
          <div className="analytics-icon teal">D</div>
          <div><span>DIVISIONS</span><strong>{divisionsCovered}</strong><small>Covered</small></div>
        </div>
        <div className="analytics-summary-card">
          <div className="analytics-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
          <div><span>ACTIVE RATE</span><strong>{activeRate.toFixed(1)}%</strong><small>{activeCount} active devices</small></div>
        </div>
        <div className="analytics-summary-card">
          <div className="analytics-icon orange">!</div>
          <div><span>INACTIVE</span><strong>{totalDevices - activeCount}</strong><small>{(100 - activeRate).toFixed(1)}% of filtered</small></div>
        </div>
        <div className="analytics-summary-card">
          <div className="analytics-icon purple">TY</div>
          <div><span>TOP TYPE</span><strong>{mostCommonType}</strong><small>Most common category</small></div>
        </div>
      </section>

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
              <LineChart data={divisionTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" style={{ fontSize: "0.85rem" }} />
                <YAxis allowDecimals={false} stroke="#64748b" style={{ fontSize: "0.85rem" }} />
                <Tooltip contentStyle={{ backgroundColor: "#1e293b", borderColor: "#334155", borderRadius: "8px", color: "#fff", fontSize: "0.85rem" }} itemStyle={{ color: "#fff" }} />
                <Legend wrapperStyle={{ paddingTop: "15px", fontSize: "0.85rem" }} />
                {divisionNames.map((name, index) => (
                  <Line key={name} type="monotone" dataKey={name} name={name} stroke={DIVISION_COLORS[index % DIVISION_COLORS.length]} strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} connectNulls />
                ))}
              </LineChart>
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
                <div className="distribution-row" key={item.type}>
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

      <section className="analytics-card">
        <div className="card-heading">
          <div>
            <h3>Division Device Analysis</h3>
            <p>Compare device volume and status across divisions.</p>
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
                  <tr key={item.name}>
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
