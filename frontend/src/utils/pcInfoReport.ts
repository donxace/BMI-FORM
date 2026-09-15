// Shared between PcInfoReport.tsx (the on-screen filterable report) and
// PcInfoReportPrint.tsx (the printable version opened in a new tab) — same
// split/reasoning as utils/bmiReport.ts for the BMI domain's Report pages.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

export type Assessment = {
  id: number;
  serial_no: string | null;
  os_edition: string | null;
  os_build: string | null;
  risk_score: number | null;
  risk_level: string | null;
  hostname: string | null;
  ip_address: string | null;
  assessed_at: string | null;
  created_at: string;
  device_name: string;
  owner_name: string | null;
  division_name: string | null;
  device_status: boolean | null;
};

export type PcInfoReportFilters = {
  search: string;
  divisionFilter: string;
  riskFilter: string;
  osFilter: string;
};

export const DEFAULT_PC_INFO_FILTERS: PcInfoReportFilters = {
  search: "",
  divisionFilter: "",
  riskFilter: "",
  osFilter: "",
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("pcInfoAuthToken")}` };
}

export function formatDate(date: string | null) {
  if (!date) return "—";
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return date;
  return parsed.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function riskBadgeClass(level: string | null) {
  if (level === "HIGH") return "obese";
  if (level === "MEDIUM") return "overweight";
  if (level === "LOW") return "normal";
  return "underweight";
}

export async function fetchPcInfoAssessments(): Promise<Assessment[]> {
  const response = await fetch(`${API_BASE_URL}/pc-info/assessments`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Failed to load report data.");
  return response.json();
}

export function filterPcInfoAssessments(assessments: Assessment[], filters: PcInfoReportFilters): Assessment[] {
  const term = filters.search.trim().toLowerCase();
  return assessments.filter((a) => {
    const division = a.division_name ?? "Unassigned";
    const matchesSearch =
      !term ||
      a.device_name.toLowerCase().includes(term) ||
      (a.serial_no ?? "").toLowerCase().includes(term) ||
      (a.owner_name ?? "").toLowerCase().includes(term);
    const matchesDivision = !filters.divisionFilter || division === filters.divisionFilter;
    const matchesRisk = !filters.riskFilter || a.risk_level === filters.riskFilter;
    const matchesOs = !filters.osFilter || a.os_edition === filters.osFilter;
    return matchesSearch && matchesDivision && matchesRisk && matchesOs;
  });
}

export function pcInfoFiltersToSearchParams(filters: PcInfoReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.divisionFilter) params.set("division", filters.divisionFilter);
  if (filters.riskFilter) params.set("risk", filters.riskFilter);
  if (filters.osFilter) params.set("os", filters.osFilter);
  return params;
}

export function pcInfoFiltersFromSearchParams(params: URLSearchParams): PcInfoReportFilters {
  return {
    search: params.get("search") ?? "",
    divisionFilter: params.get("division") ?? "",
    riskFilter: params.get("risk") ?? "",
    osFilter: params.get("os") ?? "",
  };
}
