import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Boxes,
  Monitor,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  ScanSearch,
  Unlink,
  History,
} from "lucide-react";
import "./Dashboard.css";
import "./PcInfoDashboard.css";
import "./ItAssetsOverview.css";
import { getItAssetsAccess, IT_ASSETS_PARTS } from "../utils/itAssetsSession";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

/*
 * IT ASSET MANAGEMENT — OVERVIEW
 *
 * The one page that needs BOTH halves of the combined system: the
 * Hardware Inventory fleet and the PC Information System's security
 * scans, joined on the scan's (device_type, device_id) link to its
 * inventory computer. That join is what neither old system could show
 * on its own: which inventory computers have never been scanned, and
 * which scans belong to no inventory device at all.
 */

type Device = {
  id: number;
  deviceType: string;
  label: string;
  isActive: boolean;
  ownerName?: string | null;
  divisionName?: string | null;
};

type Scan = {
  id: number;
  device_type: "desktops" | "laptops" | null;
  device_id: number | null;
  device_name: string;
  owner_name: string | null;
  risk_level: string | null;
  risk_score: number | null;
  assessed_at: string | null;
  created_at: string;
};

const COMPUTER_TYPES = ["desktops", "laptops"];

const TYPE_LABELS: Record<string, string> = {
  desktops: "Desktops",
  laptops: "Laptops",
  printers: "Printers",
  routers: "Routers",
  switches: "Switches",
  firewalls: "Firewalls",
  ups: "UPS",
  cameras: "Cameras",
  headsets: "Headsets",
  splitters: "Splitters",
  switchers: "Switchers",
  others: "Others",
};

const LIST_LIMIT = 6;

function formatDate(value: string | null) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function getJson<T>(path: string, tokenKey: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem(tokenKey)}` },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

export default function ItAssetsOverview() {
  const navigate = useNavigate();
  const access = useMemo(() => getItAssetsAccess(), []);
  const canSeeScans = access.pcinfo !== null;

  const [devices, setDevices] = useState<Device[]>([]);
  const [scans, setScans] = useState<Scan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        // PC Info's own copy of the fleet also carries owner/division
        // names; an Inventory-only account reads the inventory list.
        const devicesRequest = access.pcinfo
          ? getJson<Device[]>("/pc-info/inventory", IT_ASSETS_PARTS.pcinfo.tokenKey)
          : getJson<Device[]>("/inventory/devices", IT_ASSETS_PARTS.inventory.tokenKey);
        const scansRequest = access.pcinfo
          ? getJson<Scan[]>("/pc-info/assessments", IT_ASSETS_PARTS.pcinfo.tokenKey)
          : Promise.resolve([] as Scan[]);

        const [deviceRows, scanRows] = await Promise.all([devicesRequest, scansRequest]);
        if (cancelled) return;
        setDevices(deviceRows);
        setScans(scanRows);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [access]);

  // Latest scan per inventory computer (scans arrive newest first).
  const latestScanByDevice = useMemo(() => {
    const map = new Map<string, Scan>();
    for (const s of scans) {
      if (!s.device_type || s.device_id === null) continue;
      const key = `${s.device_type}:${s.device_id}`;
      if (!map.has(key)) map.set(key, s);
    }
    return map;
  }, [scans]);

  const computers = useMemo(
    () => devices.filter((d) => COMPUTER_TYPES.includes(d.deviceType)),
    [devices]
  );

  const neverScanned = useMemo(
    () =>
      computers
        .filter((d) => !latestScanByDevice.has(`${d.deviceType}:${d.id}`))
        .sort((a, b) => Number(b.isActive) - Number(a.isActive)),
    [computers, latestScanByDevice]
  );

  const scannedCount = computers.length - neverScanned.length;
  const coverage = computers.length ? Math.round((scannedCount / computers.length) * 100) : 0;

  const highRisk = useMemo(
    () =>
      [...latestScanByDevice.values()].filter(
        (s) => (s.risk_level ?? "").toUpperCase() === "HIGH"
      ),
    [latestScanByDevice]
  );

  const unlinkedScans = useMemo(
    () => scans.filter((s) => !s.device_type || s.device_id === null),
    [scans]
  );

  const byType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of devices) counts.set(d.deviceType, (counts.get(d.deviceType) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [devices]);

  const maxTypeCount = byType[0]?.[1] ?? 1;
  const activeCount = devices.filter((d) => d.isActive).length;
  const show = (n: number | string) => (loading ? "—" : n);

  return (
    <div className="dashboard pcinfo-dashboard itam-overview">
      <main className="main-content">
        <div className="content">

          <div className="content-header">
            <div>
              <span className="date-label">IT ASSET MANAGEMENT</span>
              <strong className="current-month">Overview</strong>
            </div>
          </div>

          {error && (
            <div className="assessment-error" style={{ marginBottom: "20px" }}>
              <strong>Unable to load the overview: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* KPIs: inventory size, computers, scan coverage, risk */}
          <div className="pcinfo-stat-row">
            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><Boxes size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">Devices in Inventory</p>
              <div className="pcinfo-stat-value">{show(devices.length)}</div>
              <small className="itam-stat-note">{loading ? "" : `${activeCount} active`}</small>
            </div>

            <div className="pcinfo-stat-card">
              <div className="pcinfo-stat-icon"><Monitor size={17} strokeWidth={2} /></div>
              <p className="pcinfo-stat-label">Computers</p>
              <div className="pcinfo-stat-value">{show(computers.length)}</div>
              <small className="itam-stat-note">Desktops and laptops</small>
            </div>

            {canSeeScans && (
              <div className="pcinfo-stat-card">
                <div className="pcinfo-stat-icon"><ShieldCheck size={17} strokeWidth={2} /></div>
                <p className="pcinfo-stat-label">Scan Coverage</p>
                <div className="pcinfo-stat-value">{show(`${coverage}%`)}</div>
                <div className="itam-meter" aria-hidden="true">
                  <span style={{ width: `${loading ? 0 : coverage}%` }} />
                </div>
                <small className="itam-stat-note">
                  {loading ? "" : `${scannedCount} of ${computers.length} computers scanned`}
                </small>
              </div>
            )}

            {canSeeScans && (
              <div className="pcinfo-stat-card">
                <div className="pcinfo-stat-icon itam-icon-danger"><AlertTriangle size={17} strokeWidth={2} /></div>
                <p className="pcinfo-stat-label">High-Risk PCs</p>
                <div className="pcinfo-stat-value">{show(highRisk.length)}</div>
                <small className="itam-stat-note">Based on each PC's latest scan</small>
              </div>
            )}
          </div>

          <div className="itam-grid">

            {canSeeScans && (
              <section className="card itam-card">
                <div className="card-header">
                  <div>
                    <h3><ScanSearch size={15} strokeWidth={2} /> Computers never scanned</h3>
                    <p>In inventory, but no PC Information scan yet</p>
                  </div>
                  <span className="itam-count">{show(neverScanned.length)}</span>
                </div>
                <ItemList
                  loading={loading}
                  empty="Every computer in inventory has been scanned."
                  items={neverScanned.slice(0, LIST_LIMIT).map((d) => ({
                    key: `${d.deviceType}:${d.id}`,
                    title: d.label,
                    subtitle: [TYPE_LABELS[d.deviceType] ?? d.deviceType, d.ownerName, d.isActive ? null : "Inactive"]
                      .filter(Boolean)
                      .join(" · "),
                    onClick: () => navigate("/inventory/dashboard"),
                  }))}
                  more={neverScanned.length - LIST_LIMIT}
                />
              </section>
            )}

            {canSeeScans && (
              <section className="card itam-card">
                <div className="card-header">
                  <div>
                    <h3><AlertTriangle size={15} strokeWidth={2} /> High-risk PCs</h3>
                    <p>Latest scan rated HIGH risk</p>
                  </div>
                  <span className="itam-count itam-count-danger">{show(highRisk.length)}</span>
                </div>
                <ItemList
                  loading={loading}
                  empty="No PC is currently rated high risk."
                  items={highRisk.slice(0, LIST_LIMIT).map((s) => ({
                    key: String(s.id),
                    title: s.device_name,
                    subtitle: [s.owner_name, `Risk ${s.risk_score ?? "?"}/100`, formatDate(s.assessed_at ?? s.created_at)]
                      .filter(Boolean)
                      .join(" · "),
                    badge: "HIGH",
                    onClick: () => navigate(`/pc-info/assessment/${s.id}`),
                  }))}
                  more={highRisk.length - LIST_LIMIT}
                />
              </section>
            )}

            <section className="card itam-card">
              <div className="card-header">
                <div>
                  <h3><Boxes size={15} strokeWidth={2} /> Devices by type</h3>
                  <p>Everything recorded in the hardware inventory</p>
                </div>
              </div>
              {loading ? (
                <p className="itam-empty">Loading...</p>
              ) : byType.length === 0 ? (
                <p className="itam-empty">No devices recorded yet.</p>
              ) : (
                <div className="itam-bars">
                  {byType.map(([type, count]) => (
                    <div className="itam-bar-row" key={type}>
                      <span className="itam-bar-label">{TYPE_LABELS[type] ?? type}</span>
                      <div className="itam-bar-track">
                        <span style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                      </div>
                      <span className="itam-bar-value">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {canSeeScans && (
              <section className="card itam-card">
                <div className="card-header">
                  <div>
                    <h3><History size={15} strokeWidth={2} /> Recent scans</h3>
                    <p>Latest PC Information System imports</p>
                  </div>
                </div>
                <ItemList
                  loading={loading}
                  empty="No scans imported yet."
                  items={scans.slice(0, LIST_LIMIT).map((s) => ({
                    key: String(s.id),
                    title: s.device_name,
                    subtitle: [s.owner_name, formatDate(s.assessed_at ?? s.created_at)].filter(Boolean).join(" · "),
                    badge: (s.risk_level ?? "").toUpperCase() || undefined,
                    onClick: () => navigate(`/pc-info/assessment/${s.id}`),
                  }))}
                />
              </section>
            )}

            {canSeeScans && unlinkedScans.length > 0 && (
              <section className="card itam-card">
                <div className="card-header">
                  <div>
                    <h3><Unlink size={15} strokeWidth={2} /> Scans not linked to inventory</h3>
                    <p>Add these computers to the inventory so they are tracked</p>
                  </div>
                  <span className="itam-count">{unlinkedScans.length}</span>
                </div>
                <ItemList
                  loading={loading}
                  empty=""
                  items={unlinkedScans.slice(0, LIST_LIMIT).map((s) => ({
                    key: String(s.id),
                    title: s.device_name,
                    subtitle: formatDate(s.assessed_at ?? s.created_at),
                    onClick: () => navigate(`/pc-info/assessment/${s.id}`),
                  }))}
                  more={unlinkedScans.length - LIST_LIMIT}
                />
              </section>
            )}

            {!canSeeScans && (
              <section className="card itam-card">
                <div className="card-header">
                  <div>
                    <h3><ShieldCheck size={15} strokeWidth={2} /> PC health &amp; security</h3>
                    <p>Your account has no PC Information System access</p>
                  </div>
                </div>
                <p className="itam-empty">
                  Ask an administrator for a PC Information System role to see scan
                  coverage and risk for these computers.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

type ListItem = {
  key: string;
  title: string;
  subtitle: string;
  badge?: string;
  onClick: () => void;
};

function ItemList({
  loading,
  empty,
  items,
  more = 0,
}: {
  loading: boolean;
  empty: string;
  items: ListItem[];
  more?: number;
}) {
  if (loading) return <p className="itam-empty">Loading...</p>;
  if (items.length === 0) return <p className="itam-empty">{empty}</p>;

  return (
    <div className="itam-list">
      {items.map((item) => (
        <button key={item.key} type="button" className="itam-list-row" onClick={item.onClick}>
          <div>
            <strong>{item.title}</strong>
            <small>{item.subtitle}</small>
          </div>
          {item.badge && (
            <span className={`itam-badge itam-badge-${item.badge.toLowerCase()}`}>{item.badge}</span>
          )}
          <ChevronRight size={14} strokeWidth={2} className="itam-chevron" />
        </button>
      ))}
      {more > 0 && <p className="itam-more">+{more} more</p>}
    </div>
  );
}
