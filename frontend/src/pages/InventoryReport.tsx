import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import {
  Search,
  Hash,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Users,
  Download,
  FileSpreadsheet,
  Check,
  ChevronRight,
} from "lucide-react";
import "./Report.css";

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

type InventoryPersonnelRecord = {
  id: number;
  division_id: number;
  rank_id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  is_active: boolean;
};

type Division = { id: number; division: string };

const DEVICE_TYPE_LABELS: Record<string, string> = {
  desktops: "Desktop", laptops: "Laptop", cameras: "Camera", headsets: "Headset",
  printers: "Printer", splitters: "Splitter", switchers: "Switcher", ups: "UPS Unit",
  others: "Other Equipment", routers: "Router", firewalls: "Firewall", switches: "Switch",
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("authToken")}` };
}

function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function formatDateForExcel(date: string | null) {
  if (!date) return "";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US");
}

export default function InventoryReport() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState<UnifiedDevice[]>([]);
  const [personnel, setPersonnel] = useState<InventoryPersonnelRecord[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const currentDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [devicesRes, personnelRes, divisionsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/inventory/devices`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/inventory-personnel`, { headers: authHeaders() }),
          fetch(`${API_BASE_URL}/inventory-divisions`),
        ]);

        if (!devicesRes.ok || !personnelRes.ok || !divisionsRes.ok) {
          throw new Error("Failed to load report data.");
        }

        setDevices(await devicesRes.json());
        setPersonnel(await personnelRes.json());
        setDivisions(await divisionsRes.json());
        setError("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report data.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const divisionName = (id: number | null) => (id === null ? "Unassigned" : divisions.find((d) => d.id === id)?.division ?? `#${id}`);
  const ownerName = (id: number | null) => {
    if (id === null) return "Unassigned";
    const p = personnel.find((p) => p.id === id);
    return p ? [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ") : `#${id}`;
  };

  const filteredDevices = useMemo(() => {
    const term = search.trim().toLowerCase();
    return devices.filter((d) => {
      const matchesSearch =
        !term ||
        d.label.toLowerCase().includes(term) ||
        (d.serialNo ?? "").toLowerCase().includes(term) ||
        ownerName(d.personnelId).toLowerCase().includes(term);
      const matchesDivision = !divisionFilter || String(d.divisionId) === divisionFilter;
      const matchesType = !typeFilter || d.deviceType === typeFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? d.isActive : !d.isActive);
      return matchesSearch && matchesDivision && matchesType && matchesStatus;
    });
  }, [devices, search, divisionFilter, typeFilter, statusFilter, personnel, divisions]);

  const totalReports = filteredDevices.length;
  const activeCount = filteredDevices.filter((d) => d.isActive).length;
  const inactiveCount = totalReports - activeCount;
  const divisionsCovered = new Set(filteredDevices.map((d) => d.divisionId)).size;
  const personnelCovered = new Set(filteredDevices.map((d) => d.personnelId).filter((id) => id !== null)).size;

  const topType = useMemo(() => {
    const counts = new Map<string, number>();
    for (const d of filteredDevices) counts.set(d.deviceType, (counts.get(d.deviceType) ?? 0) + 1);
    let best: string | null = null;
    let bestCount = 0;
    for (const [type, count] of counts) {
      if (count > bestCount) { best = type; bestCount = count; }
    }
    return best;
  }, [filteredDevices]);

  const mostCommonType = topType ? DEVICE_TYPE_LABELS[topType] ?? topType : "—";

  function clearFilters() {
    setSearch("");
    setDivisionFilter("");
    setTypeFilter("");
    setStatusFilter("");
  }

  function scrollToFilters() {
    document.getElementById("report-filters")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const exportToExcel = () => {
    if (filteredDevices.length === 0) {
      window.alert("There are no records to export.");
      return;
    }

    const excelData = filteredDevices.map((device, index) => ({
      "No.": index + 1,
      "Device Type": DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType,
      "Device": device.label,
      "Serial No.": device.serialNo ?? "",
      "Assigned To": ownerName(device.personnelId),
      "Division": divisionName(device.divisionId),
      "Status": device.isActive ? "Active" : "Inactive",
      "Date Added": formatDateForExcel(device.createdDate),
      "Last Updated": formatDateForExcel(device.lastUpdateAt),
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    worksheet["!cols"] = [{ wch: 6 }, { wch: 16 }, { wch: 26 }, { wch: 18 }, { wch: 26 }, { wch: 16 }, { wch: 10 }, { wch: 14 }, { wch: 14 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Report");
    XLSX.writeFile(workbook, `Inventory_Report_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportSummaryToExcel = () => {
    if (filteredDevices.length === 0) {
      window.alert("There are no records to export.");
      return;
    }

    const summaryData = [
      { Metric: "Filtered Records", Value: totalReports },
      { Metric: "Active", Value: activeCount },
      { Metric: "Inactive", Value: inactiveCount },
      { Metric: "Divisions Covered", Value: divisionsCovered },
      { Metric: "Personnel Covered", Value: personnelCovered },
      { Metric: "Most Common Type", Value: mostCommonType },
    ];

    const worksheet = XLSX.utils.json_to_sheet(summaryData);
    worksheet["!cols"] = [{ wch: 22 }, { wch: 18 }];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Summary");
    XLSX.writeFile(workbook, `Inventory_Report_Summary_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="report-page">

      <div className="report-header">
        <div>
          <div className="breadcrumb">Hardware Inventory / Reports</div>
          <h1>Inventory Reports</h1>
          <p>Generate and export organized hardware inventory reports based on division and device filters.</p>
        </div>
        <div className="report-date">
          <span>TODAY</span>
          <strong>{currentDate}</strong>
        </div>
      </div>

      <section className="report-generator">
        <div className="generator-content">
          <div className="generator-icon">XLS</div>
          <div>
            <span className="generator-label">REPORT GENERATOR</span>
            <h2>Export Filtered Inventory Records</h2>
            <p>Apply the filters below, then export the matching devices into an Excel spreadsheet.</p>
          </div>
        </div>

        <div className="generator-actions">
          <button className="summary-export-button" onClick={exportSummaryToExcel} disabled={filteredDevices.length === 0}>
            Export Summary
          </button>
          <button className="excel-export-button" onClick={exportToExcel} disabled={filteredDevices.length === 0}>
            <span><Download size={14} strokeWidth={2.25} /></span>
            Export Excel
          </button>
        </div>
      </section>

      <section className="report-summary">
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Clear filters and view all records"
          onClick={clearFilters}
          onKeyDown={(e) => { if (e.key === "Enter") clearFilters(); }}
        >
          <div className="summary-icon blue"><Hash size={18} strokeWidth={2} /></div>
          <div><span>FILTERED RECORDS</span><strong>{totalReports}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${statusFilter === "active" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to active devices"
          onClick={() => setStatusFilter((prev) => (prev === "active" ? "" : "active"))}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter((prev) => (prev === "active" ? "" : "active")); }}
        >
          <div className="summary-icon green"><CheckCircle2 size={18} strokeWidth={2} /></div>
          <div><span>ACTIVE</span><strong>{activeCount}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${statusFilter === "inactive" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to inactive devices"
          onClick={() => setStatusFilter((prev) => (prev === "inactive" ? "" : "inactive"))}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter((prev) => (prev === "inactive" ? "" : "inactive")); }}
        >
          <div className="summary-icon red"><AlertTriangle size={18} strokeWidth={2} /></div>
          <div><span>INACTIVE</span><strong>{inactiveCount}</strong></div>
        </div>
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Jump to the division filter"
          onClick={scrollToFilters}
          onKeyDown={(e) => { if (e.key === "Enter") scrollToFilters(); }}
        >
          <div className="summary-icon orange"><Building2 size={18} strokeWidth={2} /></div>
          <div><span>DIVISIONS COVERED</span><strong>{divisionsCovered}</strong></div>
        </div>
        <div
          className="report-summary-card clickable"
          role="button" tabIndex={0}
          title="Go to Personnel"
          onClick={() => navigate("/inventory/personnel")}
          onKeyDown={(e) => { if (e.key === "Enter") navigate("/inventory/personnel"); }}
        >
          <div className="summary-icon purple"><Users size={18} strokeWidth={2} /></div>
          <div><span>PERSONNEL COVERED</span><strong>{personnelCovered}</strong></div>
        </div>
        <div
          className={`report-summary-card clickable ${topType && typeFilter === topType ? "active" : ""}`}
          role="button" tabIndex={0}
          title={`Filter to ${mostCommonType}`}
          onClick={() => topType && setTypeFilter((prev) => (prev === topType ? "" : topType))}
          onKeyDown={(e) => { if (e.key === "Enter" && topType) setTypeFilter((prev) => (prev === topType ? "" : topType)); }}
        >
          <div className="summary-icon teal">TYPE</div>
          <div><span>MOST COMMON TYPE</span><strong>{mostCommonType}</strong></div>
        </div>
      </section>

      <section className="report-card" id="report-filters">
        <div className="section-header">
          <div className="section-title">
            <span className="section-number">01</span>
            <div>
              <h2>Inventory Filters</h2>
              <p>Select the devices you want included in the Excel report.</p>
            </div>
          </div>
          <button className="clear-report-button" onClick={clearFilters}>Clear Filters</button>
        </div>

        <div className="report-filter-grid">
          <div className="report-field search-field">
            <label>SEARCH DEVICE</label>
            <div className="report-search">
              <span><Search size={14} strokeWidth={2} /></span>
              <input type="text" placeholder="Device, serial no., owner..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="report-field">
            <label>DIVISION</label>
            <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
              <option value="">All Divisions</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.division}</option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>DEVICE TYPE</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="">All Types</option>
              {Object.entries(DEVICE_TYPE_LABELS).map(([slug, label]) => (
                <option key={slug} value={slug}>{label}</option>
              ))}
            </select>
          </div>

          <div className="report-field">
            <label>STATUS</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </section>

      <section className="report-card table-card">
        <div className="table-header">
          <div className="section-title">
            <span className="section-number">02</span>
            <div>
              <h2>Export Preview</h2>
              <p>These are the records that will be included in your Excel report.</p>
            </div>
          </div>
          <span className="report-count">{filteredDevices.length} records</span>
        </div>

        {error && (
          <div className="report-error">
            <strong>Unable to load reports</strong>
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="report-loading">
            <div className="loading-spinner" />
            <p>Loading report records...</p>
          </div>
        ) : (
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>TYPE</th>
                  <th>DEVICE</th>
                  <th>SERIAL NO.</th>
                  <th>ASSIGNED TO</th>
                  <th>DIVISION</th>
                  <th>STATUS</th>
                  <th>DATE ADDED</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevices.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="empty-report">
                      <strong>No matching records</strong>
                      <span>Change your filters to generate a report.</span>
                    </td>
                  </tr>
                ) : (
                  filteredDevices.map((device) => (
                    <tr key={`${device.deviceType}-${device.id}`}>
                      <td>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType}</td>
                      <td><strong>{device.label}</strong></td>
                      <td>{device.serialNo ?? "—"}</td>
                      <td>{ownerName(device.personnelId)}</td>
                      <td>{divisionName(device.divisionId)}</td>
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

        {!loading && filteredDevices.length > 0 && (
          <div className="report-footer">
            Showing <strong>{filteredDevices.length}</strong> of <strong>{devices.length}</strong> records
          </div>
        )}
      </section>

      <section className="report-bottom-grid">
        <div className="report-card">
          <div className="small-card-header">
            <div>
              <h3>Excel Report Contents</h3>
              <p>Information included in the exported spreadsheet</p>
            </div>
          </div>

          <div className="report-content-list">
            <div><span><Check size={12} strokeWidth={2.5} /></span>Device Type & Identification</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Serial Numbers</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Assigned Personnel</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Division</div>
            <div><span><Check size={12} strokeWidth={2.5} /></span>Status & Dates</div>
          </div>
        </div>

        <div className="report-card">
          <div className="small-card-header">
            <div>
              <h3>Export Actions</h3>
              <p>Generate reports from the current filters</p>
            </div>
          </div>

          <div className="report-actions">
            <button onClick={exportToExcel} disabled={filteredDevices.length === 0}>
              <span><FileSpreadsheet size={16} strokeWidth={2} /></span>
              <div>
                <strong>Export Excel Report</strong>
                <small>Export all filtered device records</small>
              </div>
              <b><ChevronRight size={16} strokeWidth={2} /></b>
            </button>

            <button onClick={exportSummaryToExcel} disabled={filteredDevices.length === 0}>
              <span><Hash size={16} strokeWidth={2} /></span>
              <div>
                <strong>Export Summary</strong>
                <small>Export inventory statistics</small>
              </div>
              <b><ChevronRight size={16} strokeWidth={2} /></b>
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
