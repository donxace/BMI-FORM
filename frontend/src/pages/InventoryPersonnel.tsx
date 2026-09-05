import { useEffect, useMemo, useRef, useState } from "react";
import "./Personnel.css";
import { Users, Search, HardDrive, Download, FileText, ChevronRight } from "lucide-react";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

const ITEMS_PER_PAGE = 10;

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
type Rank = { id: number; rank: string; sort_order: number };

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
  raw: Record<string, any>;
};

type FieldKind = "text" | "number" | "date" | "checkbox";
type FieldSchema = { key: string; label: string; kind: FieldKind };

// Every column each device-type table needs on INSERT (NOT NULL columns
// with no DB default get a safe placeholder here), separate from
// FIELD_SCHEMAS below (the smaller, human-facing subset actually shown
// in the Add/Edit Device form) — so a save never trips a NOT NULL error
// just because the form only surfaces the fields that matter day-to-day.
const DEFAULT_ROWS: Record<string, Record<string, any>> = {
  desktops: { device_id: 0, device_name: "", ip_address: null, os: null, is_os_licensed: false, cpu_brand: null, cpu_generation: null, cpu_cores: null, gb_ram: null, monitor_brand: null, monitor_size_inches: null, office_application: null, is_office_licensed: false, par_serial_no: null, is_active: true, acquisition_date: null },
  laptops: { device_id: 0, device_name: "", ip_address: null, os: null, is_os_licensed: false, cpu_brand: null, cpu_generation: null, cpu_cores: null, gb_ram: null, monitor_brand: null, monitor_size_inches: null, office_application: null, is_office_licensed: false, par_serial_no: null, is_active: true, acquisition_date: null },
  cameras: { device_code: "", device_id: 0, brand: null, model: null, serial_no: null, acquisition_date: null, is_active: true },
  headsets: { device_code: "", device_id: 0, brand: null, model: null, serial_no: null, acquisition_date: null, is_active: true },
  printers: { device_id: 0, brand: null, model: null, serial_no: null, acquisition_date: null, is_active: true },
  others: { device_name: "", brand: null, model: null, serial_no: null, acquisition_date: null, is_active: true },
  splitters: { brand: null, model: null, serial_no: null, hdmi_in: null, hdmi_out: null, no_of_ports: null, acquisition_date: null, is_active: true },
  switchers: { brand: null, model: null, serial_no: null, hdmi_in: null, hdmi_out: null, no_of_ports: null, acquisition_date: null, is_active: true },
  ups: { brand: null, model: null, serial_no: null, capacity_va: null, capacity_watts: null, battery_type: null, backup_time: null, acquisition_date: null, is_active: true },
  routers: { device_id: 0, manufacturer: null, model: null, serial_no: null, no_of_ports: null, firmware_version: null, location: null, is_active: true, is_remotely_accessible: false, acquisition_date: null },
  firewalls: { device_id: 0, manufacturer: null, model: null, serial_no: null, no_of_ports: null, firmware_version: null, location: null, is_active: true, is_remotely_accessible: false, acquisition_date: null },
  switches: { device_id: 0, manufacturer: "", model: "", serial_no: "", no_of_ports: 0, no_of_active_ports: 0, no_of_managed: 0, no_of_unmanaged: 0, firmware_version: "", is_vlan_supported: false, location: "", is_status: false, is_active: true, is_remote_access: false, remote_connection_details: "", remarks: "", pnp_focal_person: "", contact_details: "", acquisition_date: null, acquisition_type: "", acquisition_details: "" },
};

const FIELD_SCHEMAS: Record<string, FieldSchema[]> = {
  desktops: [
    { key: "device_name", label: "Device Name", kind: "text" },
    { key: "ip_address", label: "IP Address", kind: "text" },
    { key: "os", label: "Operating System", kind: "text" },
    { key: "cpu_brand", label: "CPU Brand", kind: "text" },
    { key: "gb_ram", label: "RAM (GB)", kind: "number" },
    { key: "monitor_brand", label: "Monitor Brand", kind: "text" },
    { key: "par_serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  laptops: [
    { key: "device_name", label: "Device Name", kind: "text" },
    { key: "ip_address", label: "IP Address", kind: "text" },
    { key: "os", label: "Operating System", kind: "text" },
    { key: "cpu_brand", label: "CPU Brand", kind: "text" },
    { key: "gb_ram", label: "RAM (GB)", kind: "number" },
    { key: "monitor_brand", label: "Monitor Brand", kind: "text" },
    { key: "par_serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  cameras: [
    { key: "device_code", label: "Device Code", kind: "text" },
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  headsets: [
    { key: "device_code", label: "Device Code", kind: "text" },
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  printers: [
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  others: [
    { key: "device_name", label: "Device Name", kind: "text" },
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  splitters: [
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "hdmi_in", label: "HDMI In", kind: "number" },
    { key: "hdmi_out", label: "HDMI Out", kind: "number" },
    { key: "no_of_ports", label: "No. of Ports", kind: "number" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  switchers: [
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "hdmi_in", label: "HDMI In", kind: "number" },
    { key: "hdmi_out", label: "HDMI Out", kind: "number" },
    { key: "no_of_ports", label: "No. of Ports", kind: "number" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  ups: [
    { key: "brand", label: "Brand", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "capacity_va", label: "Capacity (VA)", kind: "number" },
    { key: "capacity_watts", label: "Capacity (Watts)", kind: "number" },
    { key: "battery_type", label: "Battery Type", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  routers: [
    { key: "manufacturer", label: "Manufacturer", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "no_of_ports", label: "No. of Ports", kind: "number" },
    { key: "firmware_version", label: "Firmware Version", kind: "text" },
    { key: "location", label: "Location", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  firewalls: [
    { key: "manufacturer", label: "Manufacturer", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "no_of_ports", label: "No. of Ports", kind: "number" },
    { key: "firmware_version", label: "Firmware Version", kind: "text" },
    { key: "location", label: "Location", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
  switches: [
    { key: "manufacturer", label: "Manufacturer", kind: "text" },
    { key: "model", label: "Model", kind: "text" },
    { key: "serial_no", label: "Serial No.", kind: "text" },
    { key: "no_of_ports", label: "No. of Ports", kind: "number" },
    { key: "no_of_managed", label: "Managed Ports", kind: "number" },
    { key: "firmware_version", label: "Firmware Version", kind: "text" },
    { key: "location", label: "Location", kind: "text" },
    { key: "acquisition_date", label: "Acquisition Date", kind: "date" },
  ],
};

const DEVICE_TYPE_OPTIONS = [
  { slug: "desktops", label: "Desktop" },
  { slug: "laptops", label: "Laptop" },
  { slug: "cameras", label: "Camera" },
  { slug: "headsets", label: "Headset" },
  { slug: "printers", label: "Printer" },
  { slug: "splitters", label: "Splitter" },
  { slug: "switchers", label: "Switcher" },
  { slug: "ups", label: "UPS Unit" },
  { slug: "others", label: "Other Equipment" },
  { slug: "routers", label: "Router" },
  { slug: "firewalls", label: "Firewall" },
  { slug: "switches", label: "Switch" },
];

const DEVICE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  DEVICE_TYPE_OPTIONS.map((opt) => [opt.slug, opt.label])
);

const EMPTY_PERSONNEL_FORM = { division_id: "", rank_id: "", first_name: "", middle_name: "", last_name: "", is_active: true };

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("authToken")}` };
}

export default function InventoryPersonnel() {
  const [personnelList, setPersonnelList] = useState<InventoryPersonnelRecord[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [ranks, setRanks] = useState<Rank[]>([]);
  const [loadingPersonnel, setLoadingPersonnel] = useState(true);
  const [personnelError, setPersonnelError] = useState("");

  const [search, setSearch] = useState("");
  const [divisionFilter, setDivisionFilter] = useState("");
  const [rankFilter, setRankFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState(EMPTY_PERSONNEL_FORM);

  const [showAddModal, setShowAddModal] = useState(false);
  const [savingPersonnel, setSavingPersonnel] = useState(false);
  const [formData, setFormData] = useState(EMPTY_PERSONNEL_FORM);

  const [showDevicesModal, setShowDevicesModal] = useState(false);
  const [devicesForPerson, setDevicesForPerson] = useState<InventoryPersonnelRecord | null>(null);
  const [personDevices, setPersonDevices] = useState<UnifiedDevice[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(false);

  const [showDeviceFormModal, setShowDeviceFormModal] = useState(false);
  const [editingDevice, setEditingDevice] = useState<UnifiedDevice | null>(null);
  const [deviceFormType, setDeviceFormType] = useState("desktops");
  const [deviceFormData, setDeviceFormData] = useState<Record<string, any>>({});
  const [savingDevice, setSavingDevice] = useState(false);

  const currentDate = useMemo(
    () => new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    []
  );

  async function loadPersonnel() {
    try {
      setLoadingPersonnel(true);
      const [personnelRes, divisionsRes, ranksRes] = await Promise.all([
        fetch(`${API_BASE_URL}/inventory-personnel`, { headers: authHeaders() }),
        fetch(`${API_BASE_URL}/inventory-divisions`),
        fetch(`${API_BASE_URL}/inventory-ranks`),
      ]);

      if (!personnelRes.ok) throw new Error("Failed to load personnel.");

      setPersonnelList(await personnelRes.json());
      setDivisions(divisionsRes.ok ? await divisionsRes.json() : []);
      setRanks(ranksRes.ok ? await ranksRes.json() : []);
      setPersonnelError("");
    } catch (err) {
      setPersonnelError(err instanceof Error ? err.message : "Failed to load personnel.");
    } finally {
      setLoadingPersonnel(false);
    }
  }

  useEffect(() => {
    loadPersonnel();
  }, []);

  const divisionName = (id: number) => divisions.find((d) => d.id === id)?.division ?? `#${id}`;
  const rankName = (id: number) => ranks.find((r) => r.id === id)?.rank ?? `#${id}`;
  const fullName = (p: InventoryPersonnelRecord) => [p.first_name, p.middle_name, p.last_name].filter(Boolean).join(" ");
  const initials = (p: InventoryPersonnelRecord) => `${p.first_name.charAt(0)}${p.last_name.charAt(0)}`.toUpperCase();

  const filteredPersonnel = useMemo(() => {
    const term = search.trim().toLowerCase();
    return personnelList.filter((p) => {
      const matchesSearch =
        !term ||
        fullName(p).toLowerCase().includes(term) ||
        divisionName(p.division_id).toLowerCase().includes(term);
      const matchesDivision = !divisionFilter || String(p.division_id) === divisionFilter;
      const matchesRank = !rankFilter || String(p.rank_id) === rankFilter;
      const matchesStatus = !statusFilter || (statusFilter === "active" ? p.is_active : !p.is_active);
      return matchesSearch && matchesDivision && matchesRank && matchesStatus;
    });
  }, [personnelList, search, divisionFilter, rankFilter, statusFilter, divisions, ranks]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, divisionFilter, rankFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredPersonnel.length / ITEMS_PER_PAGE));
  const paginatedPersonnel = filteredPersonnel.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  function handlePageChange(page: number) {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  }

  const totalPersonnel = personnelList.length;
  const activePersonnel = personnelList.filter((p) => p.is_active).length;
  const inactivePersonnel = totalPersonnel - activePersonnel;

  function clearFilters() {
    setSearch("");
    setDivisionFilter("");
    setRankFilter("");
    setStatusFilter("");
  }

  function focusSearch() {
    searchInputRef.current?.focus();
  }

  // ---- Personnel CRUD ----

  function handleAddPersonnel() {
    setFormData(EMPTY_PERSONNEL_FORM);
    setShowAddModal(true);
  }

  function handleEditPersonnel(p: InventoryPersonnelRecord) {
    setEditingId(p.id);
    setEditFormData({
      division_id: String(p.division_id),
      rank_id: String(p.rank_id),
      first_name: p.first_name,
      middle_name: p.middle_name ?? "",
      last_name: p.last_name,
      is_active: p.is_active,
    });
    setShowEditModal(true);
  }

  async function handleSavePersonnel(event: React.FormEvent, mode: "add" | "edit") {
    event.preventDefault();
    setSavingPersonnel(true);
    const data = mode === "add" ? formData : editFormData;

    try {
      const url = mode === "add" ? `${API_BASE_URL}/inventory-personnel` : `${API_BASE_URL}/inventory-personnel/${editingId}`;
      const res = await fetch(url, {
        method: mode === "add" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          division_id: Number(data.division_id),
          rank_id: Number(data.rank_id),
          first_name: data.first_name,
          middle_name: data.middle_name || undefined,
          last_name: data.last_name,
          is_active: data.is_active,
        }),
      });

      if (!res.ok) throw new Error("Failed to save personnel.");

      setShowAddModal(false);
      setShowEditModal(false);
      await loadPersonnel();

      // Serial numbers live on a device record, not the personnel record
      // itself — so right after adding a new person, immediately offer
      // to add their device (where "Serial No." actually lives) instead
      // of leaving them to hunt for the separate "Devices" button.
      if (mode === "add") {
        const created = await res.json();
        await openDevicesModal(created);
        openAddDevice();
      }
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to save personnel.");
    } finally {
      setSavingPersonnel(false);
    }
  }

  async function handleDeletePersonnel(p: InventoryPersonnelRecord) {
    if (!window.confirm(`Delete ${fullName(p)}? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory-personnel/${p.id}`, { method: "DELETE", headers: authHeaders() });
      if (!res.ok) throw new Error("Failed to delete personnel.");
      await loadPersonnel();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete personnel.");
    }
  }

  // ---- Devices sub-modal ----

  async function openDevicesModal(p: InventoryPersonnelRecord) {
    setDevicesForPerson(p);
    setShowDevicesModal(true);
    setDevicesLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/inventory/devices/by-personnel/${p.id}`, { headers: authHeaders() });
      setPersonDevices(res.ok ? await res.json() : []);
    } finally {
      setDevicesLoading(false);
    }
  }

  function openAddDevice() {
    setEditingDevice(null);
    setDeviceFormType("desktops");
    setDeviceFormData({});
    setShowDeviceFormModal(true);
  }

  function openEditDevice(device: UnifiedDevice) {
    setEditingDevice(device);
    setDeviceFormType(device.deviceType);
    setDeviceFormData(device.raw);
    setShowDeviceFormModal(true);
  }

  async function handleSaveDevice(event: React.FormEvent) {
    event.preventDefault();
    if (!devicesForPerson) return;
    setSavingDevice(true);

    try {
      const defaults = DEFAULT_ROWS[deviceFormType] ?? {};
      const visibleFields = FIELD_SCHEMAS[deviceFormType] ?? [];
      const payload: Record<string, any> = {
        ...defaults,
        ...(editingDevice ? editingDevice.raw : {}),
        ...deviceFormData,
        personnel_id: devicesForPerson.id,
        division_id: devicesForPerson.division_id,
      };

      // Coerce number-kind fields that arrived as strings from <input>.
      for (const field of visibleFields) {
        if (field.kind === "number" && payload[field.key] !== null && payload[field.key] !== "") {
          payload[field.key] = Number(payload[field.key]);
        }
      }

      delete payload.id;

      const url = editingDevice
        ? `${API_BASE_URL}/inventory/devices/${deviceFormType}/${editingDevice.id}`
        : `${API_BASE_URL}/inventory/devices/${deviceFormType}`;

      const res = await fetch(url, {
        method: editingDevice ? "PUT" : "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save device.");

      setShowDeviceFormModal(false);
      await openDevicesModal(devicesForPerson);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to save device.");
    } finally {
      setSavingDevice(false);
    }
  }

  async function handleDeleteDevice(device: UnifiedDevice) {
    if (!devicesForPerson) return;
    if (!window.confirm(`Remove "${device.label}"? This cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/inventory/devices/${device.deviceType}/${device.id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete device.");
      await openDevicesModal(devicesForPerson);
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Failed to delete device.");
    }
  }

  const labelStyle: React.CSSProperties = { display: "block", marginBottom: "7px", fontWeight: 600 };
  const inputStyle: React.CSSProperties = { width: "100%", boxSizing: "border-box", padding: "11px 13px", border: "1px solid #d1d5db", borderRadius: "8px" };

  function renderPersonnelForm(data: typeof EMPTY_PERSONNEL_FORM, setData: (d: typeof EMPTY_PERSONNEL_FORM) => void) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "18px" }}>
        <div>
          <label style={labelStyle}>Division *</label>
          <select
            required
            style={inputStyle}
            value={data.division_id}
            onChange={(e) => setData({ ...data, division_id: e.target.value })}
          >
            <option value="">Select Division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.division}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Rank *</label>
          <select
            required
            style={inputStyle}
            value={data.rank_id}
            onChange={(e) => setData({ ...data, rank_id: e.target.value })}
          >
            <option value="">Select Rank</option>
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>{r.rank}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={labelStyle}>First Name *</label>
          <input required style={inputStyle} value={data.first_name} onChange={(e) => setData({ ...data, first_name: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Middle Name</label>
          <input style={inputStyle} value={data.middle_name} onChange={(e) => setData({ ...data, middle_name: e.target.value })} />
        </div>

        <div>
          <label style={labelStyle}>Last Name *</label>
          <input required style={inputStyle} value={data.last_name} onChange={(e) => setData({ ...data, last_name: e.target.value })} />
        </div>

        <div style={{ display: "flex", alignItems: "flex-end" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600 }}>
            <input type="checkbox" checked={data.is_active} onChange={(e) => setData({ ...data, is_active: e.target.checked })} />
            Active
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="personnel-page">

      {/* HEADER */}
      <div className="personnel-header">
        <div>
          <div className="breadcrumb">Hardware Inventory / Personnel</div>
          <h1>Inventory Personnel</h1>
          <p>Manage personnel records and their assigned equipment.</p>
        </div>
        <div className="header-date">
          <span>TODAY</span>
          <strong>{currentDate}</strong>
        </div>
      </div>

      {/* STAT CARDS */}
      <section className="personnel-stat-grid">
        <div
          className="personnel-stat-card clickable"
          role="button" tabIndex={0}
          title="Clear filters and view all personnel"
          onClick={clearFilters}
          onKeyDown={(e) => { if (e.key === "Enter") clearFilters(); }}
        >
          <div className="stat-top">
            <span>Total Personnel</span>
            <div className="stat-icon blue"><Users size={18} strokeWidth={2} /></div>
          </div>
          <h2>{totalPersonnel}</h2>
          <div className="stat-change positive">All Records</div>
        </div>

        <div
          className={`personnel-stat-card clickable ${statusFilter === "active" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to active personnel"
          onClick={() => setStatusFilter((prev) => (prev === "active" ? "" : "active"))}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter((prev) => (prev === "active" ? "" : "active")); }}
        >
          <div className="stat-top">
            <span>Active</span>
            <div className="stat-icon green"><Users size={18} strokeWidth={2} /></div>
          </div>
          <h2>{activePersonnel}</h2>
          <div className="stat-change neutral">Currently active</div>
        </div>

        <div
          className={`personnel-stat-card clickable ${statusFilter === "inactive" ? "active" : ""}`}
          role="button" tabIndex={0}
          title="Filter to inactive personnel"
          onClick={() => setStatusFilter((prev) => (prev === "inactive" ? "" : "inactive"))}
          onKeyDown={(e) => { if (e.key === "Enter") setStatusFilter((prev) => (prev === "inactive" ? "" : "inactive")); }}
        >
          <div className="stat-top">
            <span>Inactive</span>
            <div className="stat-icon orange"><Users size={18} strokeWidth={2} /></div>
          </div>
          <h2>{inactivePersonnel}</h2>
          <div className="stat-change neutral">No longer active</div>
        </div>

        <div
          className="personnel-stat-card clickable"
          role="button" tabIndex={0}
          title="Jump to search"
          onClick={focusSearch}
          onKeyDown={(e) => { if (e.key === "Enter") focusSearch(); }}
        >
          <div className="stat-top">
            <span>Search Results</span>
            <div className="stat-icon purple"><Search size={18} strokeWidth={2} /></div>
          </div>
          <h2>{filteredPersonnel.length}</h2>
          <div className="stat-change neutral">Matching records</div>
        </div>
      </section>

      {/* TABLE */}
      <section className="personnel-card">
        <div className="section-header">
          <div>
            <span className="section-number">01</span>
            <div>
              <h2>Personnel Records</h2>
              <p>View and manage registered personnel.</p>
            </div>
          </div>

          <div className="personnel-header-actions">
            <button className="add-personnel-button" onClick={handleAddPersonnel}>+ Add Personnel</button>
          </div>
        </div>

        <div className="personnel-filters">
          <div className="search-wrapper">
            <span><Search size={14} strokeWidth={2} /></span>
            <input ref={searchInputRef} type="text" placeholder="Search name or division..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <select value={divisionFilter} onChange={(e) => setDivisionFilter(e.target.value)}>
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>{d.division}</option>
            ))}
          </select>

          <select value={rankFilter} onChange={(e) => setRankFilter(e.target.value)}>
            <option value="">All Ranks</option>
            {ranks.map((r) => (
              <option key={r.id} value={r.id}>{r.rank}</option>
            ))}
          </select>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {personnelError && (
          <div className="personnel-error">
            <strong>Unable to load personnel</strong>
            <span>{personnelError}</span>
          </div>
        )}

        {loadingPersonnel ? (
          <div className="personnel-loading">
            <div className="loading-spinner" />
            <p>Loading personnel...</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PERSONNEL</th>
                  <th>DIVISION</th>
                  <th>RANK</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredPersonnel.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-table">
                      <div>
                        <strong>No personnel found</strong>
                        <span>Try changing your search or filters.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedPersonnel.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="person-cell">
                          <div className="person-avatar">{initials(p)}</div>
                          <div>
                            <strong>{fullName(p)}</strong>
                            <small>Personnel ID #{String(p.id).padStart(4, "0")}</small>
                          </div>
                        </div>
                      </td>
                      <td>{divisionName(p.division_id)}</td>
                      <td><strong>{rankName(p.rank_id)}</strong></td>
                      <td>
                        <span className={`badge ${p.is_active ? "normal" : "obese"}`}>
                          <span className="badge-dot" />
                          {p.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <div className="row-actions">
                          <button title="Devices" onClick={() => openDevicesModal(p)}>Devices</button>
                          <button title="Edit" onClick={() => handleEditPersonnel(p)}>Edit</button>
                          <button title="Delete" className="delete-action" onClick={() => handleDeletePersonnel(p)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {filteredPersonnel.length > ITEMS_PER_PAGE && (
              <div className="pagination-container">
                <div className="pagination-info">
                  Showing <strong>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</strong> to{" "}
                  <strong>{Math.min(currentPage * ITEMS_PER_PAGE, filteredPersonnel.length)}</strong> of{" "}
                  <strong>{filteredPersonnel.length}</strong> entries
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
          </div>
        )}
      </section>

      {/* BOTTOM GRID */}
      <section className="personnel-bottom-grid">
        <div className="personnel-card">
          <div className="small-card-header">
            <div>
              <h3>Quick Actions</h3>
              <p>Frequently used personnel functions</p>
            </div>
          </div>

          <div className="quick-actions">
            <button onClick={handleAddPersonnel}>
              <span className="quick-icon blue"><Users size={16} strokeWidth={2} /></span>
              <div>
                <strong>Add Personnel</strong>
                <small>Register a new personnel record</small>
              </div>
              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>

            <button onClick={() => window.location.assign("/inventory/report")}>
              <span className="quick-icon green"><Download size={16} strokeWidth={2} /></span>
              <div>
                <strong>Export Report</strong>
                <small>Go to Inventory Report</small>
              </div>
              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>

            <button onClick={() => window.location.assign("/inventory/analytics")}>
              <span className="quick-icon purple"><FileText size={16} strokeWidth={2} /></span>
              <div>
                <strong>View Analytics</strong>
                <small>Division and device breakdowns</small>
              </div>
              <span><ChevronRight size={16} strokeWidth={2} /></span>
            </button>
          </div>
        </div>

        <div className="personnel-card">
          <div className="small-card-header">
            <div>
              <h3>Personnel Summary</h3>
              <p>Current database records</p>
            </div>
          </div>

          <div className="summary-list">
            <div><span>Total Personnel</span><strong>{totalPersonnel}</strong></div>
            <div><span>Active</span><strong>{activePersonnel}</strong></div>
            <div><span>Inactive</span><strong>{inactivePersonnel}</strong></div>
            <div><span>Divisions</span><strong>{divisions.length}</strong></div>
          </div>

          <button
            className="full-report-button"
            onClick={clearFilters}
          >
            Clear All Filters →
          </button>
        </div>
      </section>

      {/* ADD / EDIT PERSONNEL MODAL */}
      {(showAddModal || showEditModal) && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) { setShowAddModal(false); setShowEditModal(false); } }}
        >
          <div style={{ width: "100%", maxWidth: "620px", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>{showAddModal ? "Add Personnel" : "Edit Personnel"}</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>Division, rank, and name details.</p>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                disabled={savingPersonnel}
                style={{ border: "none", background: "#f3f4f6", width: "38px", height: "38px", borderRadius: "50%", fontSize: "22px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={(e) => handleSavePersonnel(e, showAddModal ? "add" : "edit")}>
              <div style={{ padding: "28px" }}>
                {showAddModal ? renderPersonnelForm(formData, setFormData) : renderPersonnelForm(editFormData, setEditFormData)}
              </div>

              <div style={{ padding: "18px 28px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setShowEditModal(false); }}
                  style={{ padding: "10px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPersonnel}
                  style={{ padding: "10px 18px", border: "none", borderRadius: "8px", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  {savingPersonnel ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEVICES MODAL */}
      {showDevicesModal && devicesForPerson && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "20px" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDevicesModal(false); }}
        >
          <div style={{ width: "100%", maxWidth: "820px", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ padding: "24px 28px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Devices — {fullName(devicesForPerson)}</h2>
                <p style={{ margin: "6px 0 0", color: "#6b7280", fontSize: "14px" }}>Equipment assigned to this person, across all categories.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowDevicesModal(false)}
                style={{ border: "none", background: "#f3f4f6", width: "38px", height: "38px", borderRadius: "50%", fontSize: "22px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: "20px 28px" }}>
              <button
                onClick={openAddDevice}
                style={{ marginBottom: "16px", padding: "10px 16px", border: "none", borderRadius: "8px", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}
              >
                <HardDrive size={15} strokeWidth={2} /> + Add Device
              </button>

              {devicesLoading ? (
                <div style={{ padding: "1.5rem", textAlign: "center" }}>Loading devices...</div>
              ) : personDevices.length === 0 ? (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "#6b7280" }}>No devices assigned yet.</div>
              ) : (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>TYPE</th>
                        <th>DEVICE</th>
                        <th>SERIAL NO.</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personDevices.map((device) => (
                        <tr key={`${device.deviceType}-${device.id}`}>
                          <td>{DEVICE_TYPE_LABELS[device.deviceType] ?? device.deviceType}</td>
                          <td><strong>{device.label}</strong></td>
                          <td>{device.serialNo ?? "—"}</td>
                          <td>
                            <span className={`badge ${device.isActive ? "normal" : "obese"}`}>
                              <span className="badge-dot" />
                              {device.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>
                            <div className="row-actions">
                              <button onClick={() => openEditDevice(device)}>Edit</button>
                              <button className="delete-action" onClick={() => handleDeleteDevice(device)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT DEVICE MODAL */}
      {showDeviceFormModal && devicesForPerson && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10000, padding: "20px" }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) setShowDeviceFormModal(false); }}
        >
          <div style={{ width: "100%", maxWidth: "560px", maxHeight: "90vh", overflowY: "auto", background: "#fff", borderRadius: "16px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
            <div style={{ padding: "22px 26px", borderBottom: "1px solid #e5e7eb", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <h2 style={{ margin: 0, fontSize: "20px", fontWeight: 700 }}>{editingDevice ? "Edit Device" : "Add Device"}</h2>
              <button
                type="button"
                onClick={() => setShowDeviceFormModal(false)}
                style={{ border: "none", background: "#f3f4f6", width: "34px", height: "34px", borderRadius: "50%", fontSize: "20px", cursor: "pointer" }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveDevice}>
              <div style={{ padding: "24px 26px", display: "grid", gap: "16px" }}>
                <div>
                  <label style={labelStyle}>Device Type *</label>
                  <select
                    required
                    disabled={!!editingDevice}
                    style={inputStyle}
                    value={deviceFormType}
                    onChange={(e) => { setDeviceFormType(e.target.value); setDeviceFormData({}); }}
                  >
                    {DEVICE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.slug} value={opt.slug}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {(FIELD_SCHEMAS[deviceFormType] ?? []).map((field) => (
                  <div key={field.key}>
                    <label style={labelStyle}>{field.label}</label>
                    {field.kind === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(deviceFormData[field.key])}
                        onChange={(e) => setDeviceFormData({ ...deviceFormData, [field.key]: e.target.checked })}
                      />
                    ) : (
                      <input
                        type={field.kind}
                        style={inputStyle}
                        value={deviceFormData[field.key] ?? ""}
                        onChange={(e) => setDeviceFormData({ ...deviceFormData, [field.key]: e.target.value })}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div style={{ padding: "16px 26px", borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setShowDeviceFormModal(false)}
                  style={{ padding: "10px 18px", border: "1px solid #d1d5db", borderRadius: "8px", background: "#fff", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingDevice}
                  style={{ padding: "10px 18px", border: "none", borderRadius: "8px", background: "#1d4ed8", color: "#fff", cursor: "pointer", fontWeight: 600 }}
                >
                  {savingDevice ? "Saving..." : "Save Device"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
