import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Hash,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  FilterX,
  ChevronRight,
} from "lucide-react";
import "./Assessment.css";
import StatDrilldownModal, {
  type DrilldownRow,
} from "../components/StatDrilldownModal";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * ============================================================
 * CLASSIFICATION TYPE
 * ============================================================
 */

type Classification =
  | "Underweight"
  | "Normal"
  | "Overweight"
  | "Obese";

/*
 * ============================================================
 * PERSONNEL TYPE
 * ============================================================
 */

type Personnel = {
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

/*
 * ============================================================
 * ASSESSMENT TYPE
 * ============================================================
 */

type Assessment = {
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

  personnel: Personnel;
};

/*
 * ============================================================
 * API RESPONSE TYPE
 *
 * Matches your actual API response:
 *
 * assessment_assessment_id
 * assessment_personnel_id
 * assessment_height
 * personnel_first_name
 * personnel_surname
 * etc.
 * ============================================================
 */

type AssessmentApiResponse = {
  assessment_assessment_id: string | number;
  assessment_personnel_id: string | number;

  assessment_height: string | number;
  assessment_weight: string | number;
  assessment_waist: string | number | null;
  assessment_hip: string | number | null;
  assessment_wrist: string | number | null;

  assessment_bmi: string | number;
  assessment_ibw: string | number | null;
  assessment_weight_to_lose: string | number | null;

  assessment_pnp_classification: string | null;
  assessment_who_classification: string | null;

  assessment_assessment_date: string;
  assessment_unit_representative: string | null;
  assessment_health_service_representative: string | null;
  assessment_encoder: string | null;
  assessment_created_at?: string;

  personnel_rfid_uid: string | null;
  personnel_rank: string | null;
  personnel_surname: string | null;
  personnel_first_name: string | null;
  personnel_middle_initial: string | null;
  personnel_q?: string | null;
  personnel_age: number | string | null;
  personnel_sex: string | null;
  personnel_office: string | null;
};

/*
 * ============================================================
 * CLASSIFICATION NORMALIZER
 *
 * API:
 * "Normal weight"
 *
 * UI:
 * "Normal"
 * ============================================================
 */

function normalizeClassification(
  classification: string | null | undefined,
): Classification {
  const value =
    classification
      ?.toLowerCase()
      .trim();

  if (!value) {
    return "Normal";
  }

  if (
    value === "underweight" ||
    value.includes("underweight")
  ) {
    return "Underweight";
  }

  if (
    value === "overweight" ||
    value.includes("overweight")
  ) {
    return "Overweight";
  }

  if (
    value === "obese" ||
    value.includes("obesity")
  ) {
    return "Obese";
  }

  if (
    value === "normal" ||
    value.includes("normal weight")
  ) {
    return "Normal";
  }

  return "Normal";
}

/*
 * ============================================================
 * CLASSIFICATION CSS
 * ============================================================
 */

function getClassificationClass(
  classification: string,
) {
  return classification
    .toLowerCase()
    .replace(/\s+/g, "-");
}

/*
 * ============================================================
 * FULL NAME
 * ============================================================
 */

function getFullName(
  personnel?: Personnel,
) {
  if (!personnel) {
    return "Unknown Personnel";
  }

  return [
    personnel.first_name,
    personnel.middle_initial,
    personnel.surname,
  ]
    .filter(Boolean)
    .join(" ");
}

/*
 * ============================================================
 * INITIALS
 * ============================================================
 */

function getInitials(
  personnel?: Personnel,
) {
  if (!personnel) {
    return "NA";
  }

  const firstInitial =
    personnel.first_name?.charAt(0) ?? "";

  const lastInitial =
    personnel.surname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/*
 * ============================================================
 * DATE FORMAT
 * ============================================================
 */

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );
}

/*
 * ============================================================
 * SAFE NUMBER
 * ============================================================
 */

function numberOrNull(
  value: string | number | null | undefined,
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

/*
 * ============================================================
 * ASSESSMENT PAGE
 * ============================================================
 */

export default function Assessment() {
  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [assessmentList, setAssessmentList] =
    useState<Assessment[]>([]);

  const [loadingAssessments, setLoadingAssessments] =
    useState(true);

  const [assessmentError, setAssessmentError] =
    useState("");

  // Stat card drill-down modal ("who are these numbers")
  const [activeStat, setActiveStat] = useState<
    "total" | "normal" | "overweight" | "obese" | "underweight" | null
  >(null);

  /*
   * ============================================================
   * SEARCH / FILTER
   * ============================================================
   */

  const [search, setSearch] =
    useState("");

  const [classificationFilter, setClassificationFilter] =
    useState("");

  /*
   * ============================================================
   * PAGINATION STATE
   * ============================================================
   */

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, classificationFilter]);

  /*
   * ============================================================
   * SELECTED ASSESSMENT
   * ============================================================
   */

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  /*
   * ============================================================
   * LOAD ASSESSMENTS
   * ============================================================
   */

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoadingAssessments(true);
        setAssessmentError("");

        console.log(
          "Fetching BMI assessments...",
        );

        const response = await fetch(
         `${API_BASE_URL}/bmi-assessments`,
         {
           headers: {
             Authorization: `Bearer ${localStorage.getItem("authToken")}`,
           },
         },
        );

        console.log(
          "Assessment API status:",
          response.status,
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        const rawData =
          (await response.json()) as AssessmentApiResponse[];

        console.log(
          "RAW BMI API RESPONSE:",
          rawData,
        );

        if (!Array.isArray(rawData)) {
          throw new Error(
            "Invalid assessment data returned by the server.",
          );
        }

        /*
         * ========================================================
         * CONVERT API RESPONSE
         *
         * API uses:
         *
         * assessment_assessment_id
         * assessment_height
         * personnel_first_name
         *
         * Component uses:
         *
         * assessment_id
         * height
         * personnel.first_name
         * ========================================================
         */

        const convertedData: Assessment[] =
          rawData.map((item) => {
            const personnelId =
              Number(
                item.assessment_personnel_id,
              );

            const personnel: Personnel = {
              personnel_id: personnelId,

              rfid_uid:
                item.personnel_rfid_uid ??
                "",

              rank:
                item.personnel_rank ??
                "",

              surname:
                item.personnel_surname ??
                "",

              first_name:
                item.personnel_first_name ??
                "",

              middle_initial:
                item.personnel_middle_initial ??
                null,

              office:
                item.personnel_office ??
                null,

              age:
                numberOrNull(
                  item.personnel_age,
                ),

              sex:
                item.personnel_sex ??
                null,
            };

            return {
              assessment_id:
                Number(
                  item.assessment_assessment_id,
                ),

              personnel_id:
                personnelId,

              height:
                Number(
                  item.assessment_height,
                ) || 0,

              weight:
                Number(
                  item.assessment_weight,
                ) || 0,

              waist:
                numberOrNull(
                  item.assessment_waist,
                ),

              hip:
                numberOrNull(
                  item.assessment_hip,
                ),

              wrist:
                numberOrNull(
                  item.assessment_wrist,
                ),

              bmi:
                Number(
                  item.assessment_bmi,
                ) || 0,

              ibw:
                numberOrNull(
                  item.assessment_ibw,
                ),

              weight_to_lose:
                numberOrNull(
                  item.assessment_weight_to_lose,
                ),

              pnp_classification:
                item.assessment_pnp_classification ??
                "N/A",

              /*
               * Converts:
               *
               * "Normal weight"
               *
               * into:
               *
               * "Normal"
               */
              who_classification:
                normalizeClassification(
                  item.assessment_who_classification,
                ),

              assessment_date:
                item.assessment_assessment_date ??
                "",

              unit_representative:
                item.assessment_unit_representative ??
                null,

              health_service_representative:
                item.assessment_health_service_representative ??
                null,

              encoder:
                item.assessment_encoder ??
                null,

              personnel,
            };
          });

        console.log(
          "CONVERTED ASSESSMENTS:",
          convertedData,
        );

        setAssessmentList(
          convertedData,
        );
      } catch (error) {
        console.error(
          "ASSESSMENT FETCH ERROR:",
          error,
        );

        setAssessmentError(
          error instanceof Error
            ? error.message
            : "Unable to load assessments from the database.",
        );
      } finally {
        setLoadingAssessments(false);
      }
    };

    fetchAssessments();
  }, []);

  /*
   * ============================================================
   * FILTER ASSESSMENTS
   * ============================================================
   */

  const filteredAssessments = useMemo(() => {
  const searchValue = search.toLowerCase().trim();

  return [...assessmentList]
    .filter((assessment) => {
      const personnel = assessment.personnel;

      const fullName = getFullName(personnel).toLowerCase();
      const rank = personnel?.rank?.toLowerCase() ?? "";
      const office = personnel?.office?.toLowerCase() ?? "";
      const rfid = personnel?.rfid_uid?.toLowerCase() ?? "";

      const personnelId = String(assessment.personnel_id);
      const assessmentId = String(assessment.assessment_id);

      const matchesSearch =
        !searchValue ||
        fullName.includes(searchValue) ||
        rank.includes(searchValue) ||
        office.includes(searchValue) ||
        rfid.includes(searchValue) ||
        personnelId.includes(searchValue) ||
        assessmentId.includes(searchValue);

      const matchesClassification =
        !classificationFilter ||
        assessment.who_classification === classificationFilter;

      return matchesSearch && matchesClassification;
    })
.sort((a, b) => {
  return b.assessment_id - a.assessment_id;
});
}, [
  assessmentList,
  search,
  classificationFilter,
]);

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const totalPages =
    Math.ceil(filteredAssessments.length / itemsPerPage) || 1;

  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAssessments, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  /*
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  const totalAssessments =
    assessmentList.length;

  const normalAssessments =
    assessmentList.filter(
      (assessment) =>
        assessment.who_classification ===
        "Normal",
    ).length;

  const overweightAssessments =
    assessmentList.filter(
      (assessment) =>
        assessment.who_classification ===
        "Overweight",
    ).length;

  const obeseAssessments =
    assessmentList.filter(
      (assessment) =>
        assessment.who_classification ===
        "Obese",
    ).length;

  const underweightAssessments =
    assessmentList.filter(
      (assessment) =>
        assessment.who_classification ===
        "Underweight",
    ).length;

  /*
   * ============================================================
   * STAT CARD DRILL-DOWN LISTS ("who are these numbers")
   *
   * Rows are built lazily (only for the currently open modal,
   * inside useMemo) instead of eagerly for all five categories
   * on every render -- otherwise every keystroke in the search
   * box would re-map the entire assessment list five times over.
   * ============================================================
   */

  const statMeta = {
    total: {
      title: "Total Assessments",
      subtitle: `${totalAssessments} assessments recorded`,
    },
    normal: {
      title: "Normal",
      subtitle: `${normalAssessments} personnel within normal BMI range`,
    },
    overweight: {
      title: "Overweight",
      subtitle: `${overweightAssessments} personnel classified as overweight`,
    },
    obese: {
      title: "Obese",
      subtitle: `${obeseAssessments} personnel classified as obese`,
    },
    underweight: {
      title: "Underweight",
      subtitle: `${underweightAssessments} personnel classified as underweight`,
    },
  } as const;

  const activeStatRows = useMemo((): DrilldownRow[] => {
    if (!activeStat) {
      return [];
    }

    const toRow = (a: Assessment): DrilldownRow => ({
      id: a.assessment_id,
      initials: getInitials(a.personnel),
      title: getFullName(a.personnel),
      subtitle: `${a.personnel?.office || "No office"} · ${formatDate(
        a.assessment_date
      )}`,
      value: a.bmi > 0 ? a.bmi.toFixed(1) : "N/A",
      valueUnit: "kg/m²",
      badgeLabel: a.who_classification,
      badgeClass: getClassificationClass(a.who_classification),
    });

    switch (activeStat) {
      case "total":
        return assessmentList.map(toRow);
      case "normal":
        return assessmentList
          .filter((a) => a.who_classification === "Normal")
          .map(toRow);
      case "overweight":
        return assessmentList
          .filter((a) => a.who_classification === "Overweight")
          .map(toRow);
      case "obese":
        return assessmentList
          .filter((a) => a.who_classification === "Obese")
          .map(toRow);
      case "underweight":
        return assessmentList
          .filter((a) => a.who_classification === "Underweight")
          .map(toRow);
      default:
        return [];
    }
  }, [activeStat, assessmentList]);

  /*
   * ============================================================
   * VIEW
   * ============================================================
   */

  const handleViewAssessment = (
    assessment: Assessment,
  ) => {
    setSelectedAssessment(
      assessment,
    );
  };

  /*
   * ============================================================
   * CLOSE
   * ============================================================
   */

  const handleCloseAssessment = () => {
    setSelectedAssessment(null);
  };

  /*
   * ============================================================
   * PDF PREVIEW
   * ============================================================
   */

  const handlePreview = (
    assessmentId: number,
  ) => {
    // window.open is a direct browser navigation — it can't attach an
    // Authorization header, so the token has to travel as a query param
    // here (the endpoint now requires one; see HealthReportAccessGuard).
    const token = localStorage.getItem("authToken") ?? "";
    window.open(
      `${API_BASE_URL}/health-reports/bmi/${assessmentId}/pdf?token=${encodeURIComponent(token)}`,
      "_blank",
    );
  };

  /*
   * ============================================================
   * CLEAR FILTERS
   * ============================================================
   */

  const handleClearFilters = () => {
    setSearch("");
    setClassificationFilter("");
  };

  /*
   * ============================================================
   * CURRENT DATE
   * ============================================================
   */

  const currentDate =
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      },
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="assessment-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="assessment-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Assessments
          </div>

          <h1>
            BMI Assessments
          </h1>

          <p>
            View, review, and manage
            recorded BMI assessment
            results.
          </p>

        </div>

        <div className="assessment-date">

          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>

        </div>

      </div>

      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <section className="assessment-stat-grid">

        <button
          type="button"
          className="assessment-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("total")}
        >

          <div className="stat-top">

            <span>
              Total Assessments
            </span>

            <div className="stat-icon blue">
              <Hash size={18} strokeWidth={2} />
            </div>

          </div>

          <h2>
            {totalAssessments}
          </h2>

          <div className="stat-change positive">
            Recorded assessments
          </div>

          <span className="sdm-view-hint">View list →</span>

        </button>

        <button
          type="button"
          className="assessment-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("normal")}
        >

          <div className="stat-top">

            <span>
              Normal
            </span>

            <div className="stat-icon green">
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>

          </div>

          <h2>
            {normalAssessments}
          </h2>

          <div className="stat-change neutral">

            {totalAssessments > 0
              ? `${(
                  (normalAssessments /
                    totalAssessments) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}

            <span>
              of assessments
            </span>

          </div>

          <span className="sdm-view-hint">View list →</span>

        </button>

        <button
          type="button"
          className="assessment-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("overweight")}
        >

          <div className="stat-top">

            <span>
              Overweight
            </span>

            <div className="stat-icon orange">
              <TrendingUp size={18} strokeWidth={2} />
            </div>

          </div>

          <h2>
            {overweightAssessments}
          </h2>

          <div className="stat-change neutral">

            {totalAssessments > 0
              ? `${(
                  (overweightAssessments /
                    totalAssessments) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}

            <span>
              of assessments
            </span>

          </div>

          <span className="sdm-view-hint">View list →</span>

        </button>

        <button
          type="button"
          className="assessment-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("obese")}
        >

          <div className="stat-top">

            <span>
              Obese
            </span>

            <div className="stat-icon red">
              <AlertTriangle size={18} strokeWidth={2} />
            </div>

          </div>

          <h2>
            {obeseAssessments}
          </h2>

          <div className="stat-change neutral">

            {totalAssessments > 0
              ? `${(
                  (obeseAssessments /
                    totalAssessments) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}

            <span>
              of assessments
            </span>

          </div>

          <span className="sdm-view-hint">View list →</span>

        </button>

        <button
          type="button"
          className="assessment-stat-card sdm-card-trigger"
          onClick={() => setActiveStat("underweight")}
        >

          <div className="stat-top">

            <span>
              Underweight
            </span>

            <div className="stat-icon purple">
              <TrendingDown size={18} strokeWidth={2} />
            </div>

          </div>

          <h2>
            {underweightAssessments}
          </h2>

          <div className="stat-change neutral">

            {totalAssessments > 0
              ? `${(
                  (underweightAssessments /
                    totalAssessments) *
                  100
                ).toFixed(1)}%`
              : "0%"}{" "}

            <span>
              of assessments
            </span>

          </div>

          <span className="sdm-view-hint">View list →</span>

        </button>

      </section>

      {activeStat && (
        <StatDrilldownModal
          title={statMeta[activeStat].title}
          subtitle={statMeta[activeStat].subtitle}
          rows={activeStatRows}
          emptyMessage="No assessments found."
          onClose={() => setActiveStat(null)}
        />
      )}

      {/* ======================================================
          ASSESSMENT RECORDS
      ======================================================= */}

      <section className="assessment-card">

        <div className="section-header">

          <div>

            <span className="section-number">
              01
            </span>

            <div>

              <h2>
                Assessment Records
              </h2>

              <p>
                View and review saved
                BMI assessment records.
              </p>

            </div>

          </div>

          <div className="record-count">
            {filteredAssessments.length}{" "}
            records
          </div>

        </div>

        {/* ====================================================
            FILTERS
        ===================================================== */}

        <div className="assessment-filters">

          <div className="search-wrapper">

            <span>
              <Search size={15} strokeWidth={2} />
            </span>

            <input
              type="text"
              placeholder="Search personnel, RFID, rank, office or assessment ID..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value,
                )
              }
            />

          </div>

          <select
            value={
              classificationFilter
            }
            onChange={(event) =>
              setClassificationFilter(
                event.target.value,
              )
            }
          >

            <option value="">
              All Classifications
            </option>

            <option value="Underweight">
              Underweight
            </option>

            <option value="Normal">
              Normal
            </option>

            <option value="Overweight">
              Overweight
            </option>

            <option value="Obese">
              Obese
            </option>

          </select>

        </div>

        {/* ====================================================
            ERROR
        ===================================================== */}

        {assessmentError && (

          <div className="assessment-error">

            <strong>
              Unable to load assessments
            </strong>

            <span>
              {assessmentError}
            </span>

          </div>

        )}

        {/* ====================================================
            LOADING
        ===================================================== */}

        {loadingAssessments ? (

          <div className="assessment-loading">

            <div className="loading-spinner" />

            <p>
              Loading assessment
              records...
            </p>

          </div>

        ) : (

          <div className="table-container">

            <table>

              <thead>

                <tr>

                  <th>
                    ASSESSMENT
                  </th>

                  <th>
                    PERSONNEL
                  </th>

                  <th>
                    OFFICE
                  </th>

                  <th>
                    HEIGHT
                  </th>

                  <th>
                    WEIGHT
                  </th>

                  <th>
                    BMI
                  </th>

                  <th>
                    CLASSIFICATION
                  </th>

                  <th>
                    DATE
                  </th>

                  <th>
                    ACTION
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredAssessments.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="empty-table"
                    >

                      <div>

                        <strong>
                          No assessments
                          found
                        </strong>

                        <span>
                          Try changing
                          your search or
                          filters.
                        </span>

                      </div>

                    </td>

                  </tr>

                ) : (

                  paginatedAssessments.map(
                    (assessment) => {

                      const personnel =
                        assessment.personnel;

                      return (

                        <tr
                          key={
                            assessment.assessment_id
                          }
                        >

                          {/* ASSESSMENT */}

                          <td>

                            <div className="assessment-id">

                              <span>
                                #
                              </span>

                              <div>

                                <strong>
                                  {String(
                                    assessment.assessment_id,
                                  ).padStart(
                                    4,
                                    "0",
                                  )}
                                </strong>

                                <small>
                                  Assessment ID
                                </small>

                              </div>

                            </div>

                          </td>

                          {/* PERSONNEL */}

                          <td>

                            <div className="person-cell">

                              <div className="person-avatar">

                                {getInitials(
                                  personnel,
                                )}

                              </div>

                              <div>

                                <strong>

                                  {personnel.rank
                                    ? `${personnel.rank} `
                                    : ""}

                                  {getFullName(
                                    personnel,
                                  )}

                                </strong>

                                <small>

                                  Personnel ID #

                                  {String(
                                    assessment.personnel_id,
                                  ).padStart(
                                    4,
                                    "0",
                                  )}

                                </small>

                              </div>

                            </div>

                          </td>

                          {/* OFFICE */}

                          <td>

                            <span className="office-text">

                              {personnel.office ??
                                "No office assigned"}

                            </span>

                          </td>

                          {/* HEIGHT */}

                          <td>

                            {assessment.height >
                            0
                              ? `${assessment.height} cm`
                              : "N/A"}

                          </td>

                          {/* WEIGHT */}

                          <td>

                            {assessment.weight >
                            0
                              ? `${assessment.weight} kg`
                              : "N/A"}

                          </td>

                          {/* BMI */}

                          <td>

                            <strong className="bmi-value">

                              {Number.isFinite(
                                assessment.bmi,
                              ) &&
                              assessment.bmi >
                                0
                                ? assessment.bmi.toFixed(
                                    1,
                                  )
                                : "N/A"}

                            </strong>

                          </td>

                          {/* CLASSIFICATION */}

                          <td>

                            <span
                              className={`classification-badge ${getClassificationClass(
                                assessment.who_classification,
                              )}`}
                            >

                              <span className="classification-dot" />

                              {
                                assessment.who_classification
                              }

                            </span>

                          </td>

                          {/* DATE */}

                          <td>

                            <span className="date-text">

                              {formatDate(
                                assessment.assessment_date,
                              )}

                            </span>

                          </td>

                          {/* ACTION */}

                          <td>

                            <div className="row-actions">

                              <button
                                title="View Assessment"
                                onClick={() =>
                                  handleViewAssessment(
                                    assessment,
                                  )
                                }
                              >
                                View
                              </button>

                            </div>

                          </td>

                        </tr>

                      );
                    },
                  )

                )}

              </tbody>

            </table>

          </div>

        )}

        {/* ====================================================
            MODERN PAGINATION CONTROLS
        ===================================================== */}

        {!loadingAssessments &&
          filteredAssessments.length > itemsPerPage && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing{" "}
                <strong>
                  {(currentPage - 1) * itemsPerPage + 1}
                </strong>{" "}
                to{" "}
                <strong>
                  {Math.min(
                    currentPage * itemsPerPage,
                    filteredAssessments.length
                  )}
                </strong>{" "}
                of <strong>{filteredAssessments.length}</strong> entries
              </div>

              <div className="pagination-controls">
                {/* Previous Button */}
                <button
                  className="btn-modern-nav"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  aria-label="Previous Page"
                >
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  <span>Previous</span>
                </button>

                {/* Page Numbers */}
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(
                    (page) =>
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                  )
                  .reduce<(number | string)[]>((acc, page, idx, src) => {
                    if (
                      idx > 0 &&
                      page - (src[idx - 1] as number) > 1
                    ) {
                      acc.push("...");
                    }
                    acc.push(page);
                    return acc;
                  }, [])
                  .map((item, index) =>
                    typeof item === "number" ? (
                      <button
                        key={item}
                        className={`pagination-btn ${
                          currentPage === item ? "active" : ""
                        }`}
                        onClick={() => handlePageChange(item)}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        key={`ellipsis-${index}`}
                        className="pagination-ellipsis"
                      >
                        •••
                      </span>
                    )
                  )}

                {/* Next Button */}
                <button
                  className="btn-modern-nav btn-next"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  aria-label="Next Page"
                >
                  <span>Next</span>
                  <svg
                    className="nav-icon"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          )}

      </section>

      {/* ======================================================
          BOTTOM GRID
      ======================================================= */}

      <section className="assessment-bottom-grid">

        {/* QUICK ACTIONS */}

        <div className="assessment-card">

          <div className="small-card-header">

            <div>

              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used
                assessment functions
              </p>

            </div>

          </div>

          <div className="quick-actions">

            <button
              onClick={
                handleClearFilters
              }
            >

              <span className="quick-icon blue">
                <FilterX size={16} strokeWidth={2} />
              </span>

              <div>

                <strong>
                  Clear Filters
                </strong>

                <small>
                  Reset assessment
                  search and
                  classification filters
                </small>

              </div>

              <span>
                <ChevronRight size={16} strokeWidth={2} />
              </span>

            </button>

            <button
              onClick={() =>
                setClassificationFilter(
                  "Normal",
                )
              }
            >

              <span className="quick-icon green">
                <CheckCircle2 size={16} strokeWidth={2} />
              </span>

              <div>

                <strong>
                  View Normal
                </strong>

                <small>
                  Show only normal
                  BMI assessments
                </small>

              </div>

              <span>
                <ChevronRight size={16} strokeWidth={2} />
              </span>

            </button>

            <button
              onClick={() =>
                setClassificationFilter(
                  "Overweight",
                )
              }
            >

              <span className="quick-icon orange">
                <TrendingUp size={16} strokeWidth={2} />
              </span>

              <div>

                <strong>
                  View Overweight
                </strong>

                <small>
                  Show overweight
                  assessment records
                </small>

              </div>

              <span>
                <ChevronRight size={16} strokeWidth={2} />
              </span>

            </button>

          </div>

        </div>

        {/* SUMMARY */}

        <div className="assessment-card">

          <div className="small-card-header">

            <div>

              <h3>
                Assessment Summary
              </h3>

              <p>
                Current BMI database
                records
              </p>

            </div>

          </div>

          <div className="summary-list">

            <div>

              <span>
                Total Assessments
              </span>

              <strong>
                {totalAssessments}
              </strong>

            </div>

            <div>

              <span>
                Normal
              </span>

              <strong>
                {normalAssessments}
              </strong>

            </div>

            <div>

              <span>
                Overweight
              </span>

              <strong>
                {overweightAssessments}
              </strong>

            </div>

            <div>

              <span>
                Obese
              </span>

              <strong>
                {obeseAssessments}
              </strong>

            </div>

            <div>

              <span>
                Underweight
              </span>

              <strong>
                {underweightAssessments}
              </strong>

            </div>

          </div>

          <button
            className="full-report-button"
            onClick={
              handleClearFilters
            }
          >
            Clear All Filters →
          </button>

        </div>

      </section>

      {/* ======================================================
          ASSESSMENT MODAL
      ======================================================= */}

      {selectedAssessment && (

        <div
          className="assessment-overlay"
          onClick={
            handleCloseAssessment
          }
        >

          <div
            className="assessment-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="modal-header">

              <div>

                <span>
                  BMI ASSESSMENT
                </span>

                <h2>

                  Assessment #

                  {String(
                    selectedAssessment.assessment_id,
                  ).padStart(
                    4,
                    "0",
                  )}

                </h2>

              </div>

              <button
                className="modal-close"
                onClick={
                  handleCloseAssessment
                }
                title="Close"
              >
                ×
              </button>

            </div>

            {/* PERSONNEL */}

            <div className="modal-personnel">

              <div className="modal-avatar">

                {getInitials(
                  selectedAssessment.personnel,
                )}

              </div>

              <div>

                <span>
                  PERSONNEL
                </span>

                <h3>

                  {selectedAssessment.personnel.rank}{" "}

                  {getFullName(
                    selectedAssessment.personnel,
                  )}

                </h3>

                <p>

                  {selectedAssessment.personnel.office ??
                    "No office assigned"}

                </p>

              </div>

            </div>

            {/* BMI */}

            <div className="modal-bmi-result">

              <div>

                <span>
                  BMI
                </span>

                <strong>

                  {selectedAssessment.bmi >
                  0
                    ? selectedAssessment.bmi.toFixed(
                        1,
                      )
                    : "N/A"}

                </strong>

                <small>
                  kg/m²
                </small>

              </div>

              <span
                className={`classification-badge ${getClassificationClass(
                  selectedAssessment.who_classification,
                )}`}
              >

                <span className="classification-dot" />

                {
                  selectedAssessment.who_classification
                }

              </span>

            </div>

            {/* BODY MEASUREMENTS */}

            <div className="modal-section">

              <h3>
                Body Measurements
              </h3>

              <div className="detail-grid">

                <div>

                  <span>
                    Height
                  </span>

                  <strong>

                    {selectedAssessment.height >
                    0
                      ? `${selectedAssessment.height} cm`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Weight
                  </span>

                  <strong>

                    {selectedAssessment.weight >
                    0
                      ? `${selectedAssessment.weight} kg`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Waist
                  </span>

                  <strong>

                    {selectedAssessment.waist !==
                    null
                      ? `${selectedAssessment.waist} cm`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Hip
                  </span>

                  <strong>

                    {selectedAssessment.hip !==
                    null
                      ? `${selectedAssessment.hip} cm`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Wrist
                  </span>

                  <strong>

                    {selectedAssessment.wrist !==
                    null
                      ? `${selectedAssessment.wrist} cm`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Assessment Date
                  </span>

                  <strong>

                    {formatDate(
                      selectedAssessment.assessment_date,
                    )}

                  </strong>

                </div>

              </div>

            </div>

            {/* CLASSIFICATION */}

            <div className="modal-section">

              <h3>
                Classification
              </h3>

              <div className="classification-grid">

                <div>

                  <span>
                    PNP Classification
                  </span>

                  <strong>

                    {
                      selectedAssessment.pnp_classification
                    }

                  </strong>

                </div>

                <div>

                  <span>
                    WHO Classification
                  </span>

                  <strong>

                    {
                      selectedAssessment.who_classification
                    }

                  </strong>

                </div>

                <div>

                  <span>
                    Ideal Body Weight
                  </span>

                  <strong>

                    {selectedAssessment.ibw !==
                    null
                      ? `${selectedAssessment.ibw} kg`
                      : "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Weight to Lose
                  </span>

                  <strong>

                    {selectedAssessment.weight_to_lose !==
                    null
                      ? `${selectedAssessment.weight_to_lose} kg`
                      : "—"}

                  </strong>

                </div>

              </div>

            </div>

            {/* INFORMATION */}

            <div className="modal-section">

              <h3>
                Assessment Information
              </h3>

              <div className="classification-grid">

                <div>

                  <span>
                    Unit Representative
                  </span>

                  <strong>

                    {selectedAssessment.unit_representative ??
                      "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Health Service
                    Representative
                  </span>

                  <strong>

                    {selectedAssessment.health_service_representative ??
                      "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    Encoder
                  </span>

                  <strong>

                    {selectedAssessment.encoder ??
                      "—"}

                  </strong>

                </div>

                <div>

                  <span>
                    RFID UID
                  </span>

                  <strong>

                    {selectedAssessment.personnel.rfid_uid ||
                      "—"}

                  </strong>

                </div>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="modal-actions">

              <button
                className="modal-secondary-button"
                onClick={
                  handleCloseAssessment
                }
              >
                Close
              </button>

              <button
                className="modal-primary-button"
                onClick={() =>
                  handlePreview(
                    selectedAssessment.assessment_id,
                  )
                }
              >
                Preview BMI Form →
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}