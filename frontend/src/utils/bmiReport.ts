// Shared between Report.tsx (the on-screen filterable report) and
// ReportPrint.tsx (the printable version opened in a new tab) so both
// always agree on what a "filtered record" is — the print page reads the
// same filters back out of its URL query string and re-runs this same
// logic rather than trying to hand off live component state across tabs.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

export type Classification = "Underweight" | "Normal" | "Overweight" | "Obese";

export type Personnel = {
  personnel_id: number;
  rfid_uid: string;
  rank: string;
  surname: string;
  first_name: string;
  middle_initial: string | null;
  office: string | null;
  age: number | null;
  sex: string | null;
};

export type Assessment = {
  assessment_id: number;
  personnel_id: number;

  height: number;
  weight: number;
  waist: number | null;
  hip: number | null;
  wrist: number | null;

  bmi: number;
  ibw: number | null;
  weight_to_lose: number | null;

  pnp_classification: string;
  who_classification: Classification;

  assessment_date: string;

  unit_representative: string | null;
  health_service_representative: string | null;
  encoder: string | null;

  personnel?: Personnel;
};

export type ReportFilters = {
  search: string;
  rank: string;
  office: string;
  sex: string;
  classification: string;
  // Plain string, not a union — Report.tsx's dateFilter state comes
  // straight off a native <select>'s event.target.value (also just
  // string), and both sides only ever compare it with === against the
  // same four literals, so a narrower type would only add friction.
  dateFilter: string;
};

export const DEFAULT_FILTERS: ReportFilters = {
  search: "",
  rank: "",
  office: "",
  sex: "",
  classification: "",
  dateFilter: "all",
};

export function getFullName(personnel?: Personnel) {
  if (!personnel) return "Unknown Personnel";
  return [personnel.first_name, personnel.middle_initial, personnel.surname].filter(Boolean).join(" ");
}

export function getInitials(personnel?: Personnel) {
  if (!personnel) return "NA";
  const first = personnel.first_name?.charAt(0) ?? "";
  const last = personnel.surname?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase();
}

export function getClassificationClass(classification: string) {
  return classification.toLowerCase().replace(/\s+/g, "-");
}

export function formatDate(date: string) {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Fetches every BMI assessment and maps it into Assessment[], same
// mapping/sort Report.tsx has always done. Throws on a non-ok response or
// unexpected payload shape — callers decide how to surface that.
export async function fetchBmiAssessments(): Promise<Assessment[]> {
  const response = await fetch(`${API_BASE_URL}/bmi-assessments`, {
    headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const rawData = await response.json();
  if (!Array.isArray(rawData)) {
    throw new Error("Invalid report data returned by server.");
  }

  const data: Assessment[] = rawData.map((item: any) => {
    const personnelId = Number(item.assessment_personnel_id ?? item.personnel_id ?? item.personnelId ?? 0);

    const personnel: Personnel = {
      personnel_id: personnelId,
      rfid_uid: item.personnel_rfid_uid ?? item.rfid_uid ?? "",
      rank: item.personnel_rank ?? item.rank ?? "",
      surname: item.personnel_surname ?? item.surname ?? "",
      first_name: item.personnel_first_name ?? item.first_name ?? "",
      middle_initial: item.personnel_middle_initial ?? item.middle_initial ?? null,
      office: item.personnel_office ?? item.office ?? null,
      age: item.personnel_age ?? item.age ?? null,
      sex: item.personnel_sex ?? item.sex ?? null,
    };

    return {
      assessment_id: Number(item.assessment_assessment_id ?? item.assessment_id ?? 0),
      personnel_id: personnelId,
      height: Number(item.assessment_height ?? 0),
      weight: Number(item.assessment_weight ?? 0),
      waist: item.assessment_waist != null ? Number(item.assessment_waist) : null,
      hip: item.assessment_hip != null ? Number(item.assessment_hip) : null,
      wrist: item.assessment_wrist != null ? Number(item.assessment_wrist) : null,
      bmi: Number(item.assessment_bmi ?? 0),
      ibw: item.assessment_ibw != null ? Number(item.assessment_ibw) : null,
      weight_to_lose: item.assessment_weight_to_lose != null ? Number(item.assessment_weight_to_lose) : null,
      pnp_classification: item.assessment_pnp_classification ?? "N/A",
      who_classification: (item.assessment_who_classification ?? "Normal") as Classification,
      assessment_date: item.assessment_assessment_date ?? "",
      unit_representative: item.assessment_unit_representative ?? null,
      health_service_representative: item.assessment_health_service_representative ?? null,
      encoder: item.assessment_encoder ?? null,
      personnel,
    };
  });

  data.sort((a, b) => b.assessment_id - a.assessment_id);
  return data;
}

export function filterAssessments(assessments: Assessment[], filters: ReportFilters): Assessment[] {
  const searchValue = filters.search.toLowerCase().trim();
  const now = new Date();

  return assessments.filter((assessment) => {
    const personnel = assessment.personnel;
    const fullName = getFullName(personnel).toLowerCase();
    const personnelRank = personnel?.rank?.toLowerCase() ?? "";
    const personnelOffice = personnel?.office?.toLowerCase() ?? "";
    const personnelSex = personnel?.sex?.toLowerCase() ?? "";
    const rfid = personnel?.rfid_uid?.toLowerCase() ?? "";
    const personnelId = String(assessment.personnel_id);
    const assessmentId = String(assessment.assessment_id);

    const matchesSearch =
      !searchValue ||
      fullName.includes(searchValue) ||
      personnelRank.includes(searchValue) ||
      personnelOffice.includes(searchValue) ||
      personnelSex.includes(searchValue) ||
      rfid.includes(searchValue) ||
      personnelId.includes(searchValue) ||
      assessmentId.includes(searchValue);

    const matchesRank = !filters.rank || personnel?.rank === filters.rank;
    const matchesOffice = !filters.office || personnel?.office === filters.office;
    const matchesSex = !filters.sex || personnel?.sex === filters.sex;
    const matchesClassification = !filters.classification || assessment.who_classification === filters.classification;

    let matchesDate = true;
    const assessmentDate = new Date(assessment.assessment_date);

    if (filters.dateFilter === "today") {
      matchesDate = assessmentDate.toDateString() === now.toDateString();
    }
    if (filters.dateFilter === "month") {
      matchesDate = assessmentDate.getMonth() === now.getMonth() && assessmentDate.getFullYear() === now.getFullYear();
    }
    if (filters.dateFilter === "year") {
      matchesDate = assessmentDate.getFullYear() === now.getFullYear();
    }

    return matchesSearch && matchesRank && matchesOffice && matchesSex && matchesClassification && matchesDate;
  });
}

// Encodes only the non-default filters into a query string, and the
// reverse — read back out of a URLSearchParams. Keeps the printable
// tab's URL clean (no filters = no query string) and round-trips exactly.
export function filtersToSearchParams(filters: ReportFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.rank) params.set("rank", filters.rank);
  if (filters.office) params.set("office", filters.office);
  if (filters.sex) params.set("sex", filters.sex);
  if (filters.classification) params.set("classification", filters.classification);
  if (filters.dateFilter !== "all") params.set("dateFilter", filters.dateFilter);
  return params;
}

export function filtersFromSearchParams(params: URLSearchParams): ReportFilters {
  const dateFilter = params.get("dateFilter");
  return {
    search: params.get("search") ?? "",
    rank: params.get("rank") ?? "",
    office: params.get("office") ?? "",
    sex: params.get("sex") ?? "",
    classification: params.get("classification") ?? "",
    dateFilter: dateFilter === "today" || dateFilter === "month" || dateFilter === "year" ? dateFilter : "all",
  };
}
