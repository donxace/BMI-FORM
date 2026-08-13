import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import "./Report.css";

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type Classification =
  | "Underweight"
  | "Normal"
  | "Overweight"
  | "Obese";

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

  personnel?: Personnel;
};

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function getFullName(personnel?: Personnel) {
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

function getInitials(personnel?: Personnel) {
  if (!personnel) {
    return "NA";
  }

  const first = personnel.first_name?.charAt(0) ?? "";
  const last = personnel.surname?.charAt(0) ?? "";

  return `${first}${last}`.toUpperCase();
}

function getClassificationClass(classification: string) {
  return classification
    .toLowerCase()
    .replace(/\s+/g, "-");
}

function formatDate(date: string) {
  if (!date) {
    return "—";
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateForExcel(date: string) {
  if (!date) {
    return "";
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-US");
}

/*
 * ============================================================
 * REPORT PAGE
 * ============================================================
 */

export default function Report() {
  /*
   * ============================================================
   * STATE
   * ============================================================
   */

  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * FILTERS
   * ============================================================
   */

  const [search, setSearch] =
    useState("");

  const [rank, setRank] =
    useState("");

  const [office, setOffice] =
    useState("");

  const [sex, setSex] =
    useState("");

  const [classification, setClassification] =
    useState("");

  const [dateFilter, setDateFilter] =
    useState("all");

  /*
   * ============================================================
   * FETCH DATA
   * ============================================================
   */

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:3000/bmi-assessments",
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        const rawData =
          await response.json();

        if (!Array.isArray(rawData)) {
          throw new Error(
            "Invalid report data returned by server.",
          );
        }

        const data: Assessment[] =
          rawData.map((item: any) => {
            const personnelId = Number(
              item.personnel_id ??
                item.personnelId ??
                0,
            );

            const personnel: Personnel = {
              personnel_id: personnelId,

              rfid_uid:
                item.personnel_rfid_uid ??
                item.rfid_uid ??
                "",

              rank:
                item.personnel_rank ??
                item.rank ??
                "",

              surname:
                item.personnel_surname ??
                item.surname ??
                "",

              first_name:
                item.personnel_first_name ??
                item.first_name ??
                "",

              middle_initial:
                item.personnel_middle_initial ??
                item.middle_initial ??
                null,

              office:
                item.personnel_office ??
                item.office ??
                null,

              age:
                item.personnel_age ??
                item.age ??
                null,

              sex:
                item.personnel_sex ??
                item.sex ??
                null,
            };

            return {
              assessment_id: Number(
                item.assessment_assessment_id ??
                  item.assessment_id ??
                  0,
              ),

              personnel_id: personnelId,

              height: Number(
                item.assessment_height ?? 0,
              ),

              weight: Number(
                item.assessment_weight ?? 0,
              ),

              waist:
                item.assessment_waist != null
                  ? Number(
                      item.assessment_waist,
                    )
                  : null,

              hip:
                item.assessment_hip != null
                  ? Number(
                      item.assessment_hip,
                    )
                  : null,

              wrist:
                item.assessment_wrist != null
                  ? Number(
                      item.assessment_wrist,
                    )
                  : null,

              bmi: Number(
                item.assessment_bmi ?? 0,
              ),

              ibw:
                item.assessment_ibw != null
                  ? Number(
                      item.assessment_ibw,
                    )
                  : null,

              weight_to_lose:
                item.assessment_weight_to_lose !=
                null
                  ? Number(
                      item.assessment_weight_to_lose,
                    )
                  : null,

              pnp_classification:
                item.assessment_pnp_classification ??
                "N/A",

              who_classification:
                (item.assessment_who_classification ??
                  "Normal") as Classification,

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

        /*
         * ======================================================
         * LATEST TO OLDEST
         *
         * Assessment ID is the primary ordering.
         * ======================================================
         */

        data.sort(
          (a, b) =>
            b.assessment_id -
            a.assessment_id,
        );

        setAssessments(data);
      } catch (err) {
        console.error(
          "REPORT FETCH ERROR:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load reports.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  /*
   * ============================================================
   * FILTER OPTIONS
   * ============================================================
   */

  const officeOptions = useMemo(() => {
    return Array.from(
      new Set(
        assessments
          .map(
            (item) =>
              item.personnel?.office,
          )
          .filter(Boolean),
      ),
    ) as string[];
  }, [assessments]);

  const rankOptions = useMemo(() => {
    return Array.from(
      new Set(
        assessments
          .map(
            (item) =>
              item.personnel?.rank,
          )
          .filter(Boolean),
      ),
    ) as string[];
  }, [assessments]);

  const sexOptions = useMemo(() => {
    return Array.from(
      new Set(
        assessments
          .map(
            (item) =>
              item.personnel?.sex,
          )
          .filter(Boolean),
      ),
    ) as string[];
  }, [assessments]);

  /*
   * ============================================================
   * FILTER LOGIC
   * ============================================================
   */

  const filteredReports = useMemo(() => {
    const searchValue =
      search.toLowerCase().trim();

    const now = new Date();

    return assessments.filter(
      (assessment) => {
        const personnel =
          assessment.personnel;

        const fullName =
          getFullName(personnel).toLowerCase();

        const personnelRank =
          personnel?.rank?.toLowerCase() ?? "";

        const personnelOffice =
          personnel?.office?.toLowerCase() ?? "";

        const personnelSex =
          personnel?.sex?.toLowerCase() ?? "";

        const rfid =
          personnel?.rfid_uid?.toLowerCase() ?? "";

        const personnelId =
          String(
            assessment.personnel_id,
          );

        const assessmentId =
          String(
            assessment.assessment_id,
          );

        /*
         * Search personnel columns
         */

        const matchesSearch =
          !searchValue ||
          fullName.includes(searchValue) ||
          personnelRank.includes(searchValue) ||
          personnelOffice.includes(searchValue) ||
          personnelSex.includes(searchValue) ||
          rfid.includes(searchValue) ||
          personnelId.includes(searchValue) ||
          assessmentId.includes(searchValue);

        /*
         * Rank
         */

        const matchesRank =
          !rank ||
          personnel?.rank === rank;

        /*
         * Office
         */

        const matchesOffice =
          !office ||
          personnel?.office === office;

        /*
         * Sex
         */

        const matchesSex =
          !sex ||
          personnel?.sex === sex;

        /*
         * Classification
         */

        const matchesClassification =
          !classification ||
          assessment.who_classification ===
            classification;

        /*
         * Date
         */

        let matchesDate = true;

        const assessmentDate =
          new Date(
            assessment.assessment_date,
          );

        if (dateFilter === "today") {
          matchesDate =
            assessmentDate.toDateString() ===
            now.toDateString();
        }

        if (dateFilter === "month") {
          matchesDate =
            assessmentDate.getMonth() ===
              now.getMonth() &&
            assessmentDate.getFullYear() ===
              now.getFullYear();
        }

        if (dateFilter === "year") {
          matchesDate =
            assessmentDate.getFullYear() ===
            now.getFullYear();
        }

        return (
          matchesSearch &&
          matchesRank &&
          matchesOffice &&
          matchesSex &&
          matchesClassification &&
          matchesDate
        );
      },
    );
  }, [
    assessments,
    search,
    rank,
    office,
    sex,
    classification,
    dateFilter,
  ]);

  /*
   * ============================================================
   * STATISTICS
   * ============================================================
   */

  const totalReports =
    filteredReports.length;

  const normalCount =
    filteredReports.filter(
      (item) =>
        item.who_classification ===
        "Normal",
    ).length;

  const underweightCount =
    filteredReports.filter(
      (item) =>
        item.who_classification ===
        "Underweight",
    ).length;

  const overweightCount =
    filteredReports.filter(
      (item) =>
        item.who_classification ===
        "Overweight",
    ).length;

  const obeseCount =
    filteredReports.filter(
      (item) =>
        item.who_classification ===
        "Obese",
    ).length;

  const averageBMI =
    filteredReports.length > 0
      ? filteredReports.reduce(
          (sum, item) =>
            sum + item.bmi,
          0,
        ) / filteredReports.length
      : 0;

  /*
   * ============================================================
   * CLEAR FILTERS
   * ============================================================
   */

  const clearFilters = () => {
    setSearch("");
    setRank("");
    setOffice("");
    setSex("");
    setClassification("");
    setDateFilter("all");
  };

  /*
   * ============================================================
   * EXCEL EXPORT
   *
   * Exports ONLY filtered records.
   * ============================================================
   */

  const exportToExcel = () => {
    if (filteredReports.length === 0) {
      alert(
        "There are no records to export.",
      );
      return;
    }

    const excelData =
      filteredReports.map(
        (assessment, index) => {
          const personnel =
            assessment.personnel;

          return {
            "No.": index + 1,

            "Assessment ID":
              assessment.assessment_id,

            "Personnel ID":
              assessment.personnel_id,

            "RFID UID":
              personnel?.rfid_uid ?? "",

            "Rank":
              personnel?.rank ?? "",

            "Surname":
              personnel?.surname ?? "",

            "First Name":
              personnel?.first_name ?? "",

            "Middle Initial":
              personnel?.middle_initial ?? "",

            "Full Name":
              getFullName(personnel),

            "Office":
              personnel?.office ?? "",

            "Age":
              personnel?.age ?? "",

            "Sex":
              personnel?.sex ?? "",

            "Height (cm)":
              assessment.height,

            "Weight (kg)":
              assessment.weight,

            "Waist (cm)":
              assessment.waist ?? "",

            "Hip (cm)":
              assessment.hip ?? "",

            "Wrist (cm)":
              assessment.wrist ?? "",

            "BMI":
              assessment.bmi,

            "WHO Classification":
              assessment.who_classification,

            "PNP Classification":
              assessment.pnp_classification,

            "Ideal Body Weight (kg)":
              assessment.ibw ?? "",

            "Weight to Lose (kg)":
              assessment.weight_to_lose ?? "",

            "Assessment Date":
              formatDateForExcel(
                assessment.assessment_date,
              ),

            "Unit Representative":
              assessment.unit_representative ??
              "",

            "Health Service Representative":
              assessment.health_service_representative ??
              "",

            "Encoder":
              assessment.encoder ?? "",
          };
        },
      );

    /*
     * Create worksheet
     */

    const worksheet =
      XLSX.utils.json_to_sheet(
        excelData,
      );

    /*
     * Set readable column widths
     */

    worksheet["!cols"] = [
      { wch: 6 },
      { wch: 15 },
      { wch: 14 },
      { wch: 18 },
      { wch: 12 },
      { wch: 18 },
      { wch: 18 },
      { wch: 15 },
      { wch: 28 },
      { wch: 22 },
      { wch: 8 },
      { wch: 10 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 10 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 20 },
      { wch: 18 },
      { wch: 25 },
      { wch: 30 },
      { wch: 22 },
    ];

    /*
     * Create workbook
     */

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "BMI Reports",
    );

    /*
     * Filename
     */

    const date =
      new Date()
        .toISOString()
        .split("T")[0];

    const filename =
      `BMI_Report_${date}.xlsx`;

    /*
     * Download
     */

    XLSX.writeFile(
      workbook,
      filename,
    );
  };

  /*
   * ============================================================
   * EXPORT CURRENT FILTER SUMMARY
   * ============================================================
   */

  const exportSummaryToExcel = () => {
    if (filteredReports.length === 0) {
      alert(
        "There are no records to export.",
      );
      return;
    }

    const summaryData = [
      {
        "Report": "BMI Assessment Report",
        "Generated":
          new Date().toLocaleString(),
      },

      {
        "Total Reports":
          totalReports,
        "Average BMI":
          averageBMI > 0
            ? averageBMI.toFixed(2)
            : "N/A",
        "Normal":
          normalCount,
        "Underweight":
          underweightCount,
        "Overweight":
          overweightCount,
        "Obese":
          obeseCount,
      },
    ];

    const worksheet =
      XLSX.utils.json_to_sheet(
        summaryData,
      );

    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 25 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Summary",
    );

    const date =
      new Date()
        .toISOString()
        .split("T")[0];

    XLSX.writeFile(
      workbook,
      `BMI_Report_Summary_${date}.xlsx`,
    );
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
    <div className="report-page">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="report-header">

        <div>
          <div className="breadcrumb">
            Main Menu / Reports
          </div>

          <h1>
            BMI Reports
          </h1>

          <p>
            Generate and export organized
            BMI assessment reports based
            on personnel and health filters.
          </p>
        </div>

        <div className="report-date">
          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>
        </div>

      </div>

      {/* ======================================================
          REPORT GENERATION CARD
      ====================================================== */}

      <section className="report-generator">

        <div className="generator-content">

          <div className="generator-icon">
            XLS
          </div>

          <div>

            <span className="generator-label">
              REPORT GENERATOR
            </span>

            <h2>
              Export Filtered BMI Records
            </h2>

            <p>
              Apply personnel filters below,
              then export the matching records
              into an Excel spreadsheet.
            </p>

          </div>

        </div>

        <div className="generator-actions">

          <button
            className="summary-export-button"
            onClick={
              exportSummaryToExcel
            }
            disabled={
              filteredReports.length === 0
            }
          >
            Export Summary
          </button>

          <button
            className="excel-export-button"
            onClick={exportToExcel}
            disabled={
              filteredReports.length === 0
            }
          >
            <span>
              ↓
            </span>

            Export Excel
          </button>

        </div>

      </section>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="report-summary">

        <div className="report-summary-card">

          <div className="summary-icon blue">
            #
          </div>

          <div>
            <span>
              FILTERED RECORDS
            </span>

            <strong>
              {totalReports}
            </strong>
          </div>

        </div>

        <div className="report-summary-card">

          <div className="summary-icon green">
            ✓
          </div>

          <div>
            <span>
              NORMAL
            </span>

            <strong>
              {normalCount}
            </strong>
          </div>

        </div>

        <div className="report-summary-card">

          <div className="summary-icon orange">
            !
          </div>

          <div>
            <span>
              OVERWEIGHT
            </span>

            <strong>
              {overweightCount}
            </strong>
          </div>

        </div>

        <div className="report-summary-card">

          <div className="summary-icon red">
            !
          </div>

          <div>
            <span>
              OBESE
            </span>

            <strong>
              {obeseCount}
            </strong>
          </div>

        </div>

        <div className="report-summary-card">

          <div className="summary-icon purple">
            ↓
          </div>

          <div>
            <span>
              UNDERWEIGHT
            </span>

            <strong>
              {underweightCount}
            </strong>
          </div>

        </div>

        <div className="report-summary-card">

          <div className="summary-icon teal">
            BMI
          </div>

          <div>
            <span>
              AVERAGE BMI
            </span>

            <strong>
              {averageBMI > 0
                ? averageBMI.toFixed(1)
                : "—"}
            </strong>
          </div>

        </div>

      </section>

      {/* ======================================================
          PERSONNEL FILTERS
      ====================================================== */}

      <section className="report-card">

        <div className="section-header">

          <div className="section-title">

            <span className="section-number">
              01
            </span>

            <div>

              <h2>
                Personnel & Report Filters
              </h2>

              <p>
                Select the personnel information
                you want included in the Excel
                report.
              </p>

            </div>

          </div>

          <button
            className="clear-report-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

        <div className="report-filter-grid">

          {/* SEARCH */}

          <div className="report-field search-field">

            <label>
              SEARCH PERSONNEL
            </label>

            <div className="report-search">

              <span>
                🔍
              </span>

              <input
                type="text"
                placeholder="Name, RFID, personnel ID..."
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
              />

            </div>

          </div>

          {/* RANK */}

          <div className="report-field">

            <label>
              RANK
            </label>

            <select
              value={rank}
              onChange={(event) =>
                setRank(
                  event.target.value,
                )
              }
            >

              <option value="">
                All Ranks
              </option>

              {rankOptions.map(
                (rankName) => (
                  <option
                    key={rankName}
                    value={rankName}
                  >
                    {rankName}
                  </option>
                ),
              )}

            </select>

          </div>

          {/* OFFICE */}

          <div className="report-field">

            <label>
              OFFICE
            </label>

            <select
              value={office}
              onChange={(event) =>
                setOffice(
                  event.target.value,
                )
              }
            >

              <option value="">
                All Offices
              </option>

              {officeOptions.map(
                (officeName) => (
                  <option
                    key={officeName}
                    value={officeName}
                  >
                    {officeName}
                  </option>
                ),
              )}

            </select>

          </div>

          {/* SEX */}

          <div className="report-field">

            <label>
              SEX
            </label>

            <select
              value={sex}
              onChange={(event) =>
                setSex(
                  event.target.value,
                )
              }
            >

              <option value="">
                All
              </option>

              {sexOptions.map(
                (sexName) => (
                  <option
                    key={sexName}
                    value={sexName}
                  >
                    {sexName}
                  </option>
                ),
              )}

            </select>

          </div>

          {/* CLASSIFICATION */}

          <div className="report-field">

            <label>
              BMI CLASSIFICATION
            </label>

            <select
              value={classification}
              onChange={(event) =>
                setClassification(
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

          {/* PERIOD */}

          <div className="report-field">

            <label>
              PERIOD
            </label>

            <select
              value={dateFilter}
              onChange={(event) =>
                setDateFilter(
                  event.target.value,
                )
              }
            >

              <option value="all">
                All Time
              </option>

              <option value="today">
                Today
              </option>

              <option value="month">
                This Month
              </option>

              <option value="year">
                This Year
              </option>

            </select>

          </div>

        </div>

      </section>

      {/* ======================================================
          EXPORT PREVIEW
      ====================================================== */}

      <section className="report-card table-card">

        <div className="table-header">

          <div className="section-title">

            <span className="section-number">
              02
            </span>

            <div>

              <h2>
                Export Preview
              </h2>

              <p>
                These are the records that
                will be included in your
                Excel report.
              </p>

            </div>

          </div>

          <span className="report-count">
            {filteredReports.length} records
          </span>

        </div>

        {error && (

          <div className="report-error">

            <strong>
              Unable to load reports
            </strong>

            <span>
              {error}
            </span>

          </div>

        )}

        {loading ? (

          <div className="report-loading">

            <div className="loading-spinner" />

            <p>
              Loading report records...
            </p>

          </div>

        ) : (

          <div className="report-table-wrapper">

            <table className="report-table">

              <thead>

                <tr>

                  <th>
                    ID
                  </th>

                  <th>
                    PERSONNEL
                  </th>

                  <th>
                    RANK
                  </th>

                  <th>
                    OFFICE
                  </th>

                  <th>
                    SEX
                  </th>

                  <th>
                    AGE
                  </th>

                  <th>
                    BMI
                  </th>

                  <th>
                    CLASSIFICATION
                  </th>

                  <th>
                    ASSESSMENT DATE
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredReports.length ===
                0 ? (

                  <tr>

                    <td
                      colSpan={9}
                      className="empty-report"
                    >

                      <strong>
                        No matching records
                      </strong>

                      <span>
                        Change your filters
                        to generate a report.
                      </span>

                    </td>

                  </tr>

                ) : (

                  filteredReports.map(
                    (assessment) => {

                      const personnel =
                        assessment.personnel;

                      return (

                        <tr
                          key={
                            assessment.assessment_id
                          }
                        >

                          <td>

                            <strong className="report-id">
                              #
                              {String(
                                assessment.assessment_id,
                              ).padStart(
                                4,
                                "0",
                              )}
                            </strong>

                          </td>

                          <td>

                            <div className="report-person">

                              <div className="report-avatar">

                                {getInitials(
                                  personnel,
                                )}

                              </div>

                              <div>

                                <strong>

                                  {personnel?.rank
                                    ? `${personnel.rank} `
                                    : ""}

                                  {getFullName(
                                    personnel,
                                  )}

                                </strong>

                                <small>

                                  Personnel #
                                  {
                                    assessment.personnel_id
                                  }

                                </small>

                              </div>

                            </div>

                          </td>

                          <td>
                            {personnel?.rank ??
                              "—"}
                          </td>

                          <td>

                            <span className="report-office">

                              {personnel?.office ??
                                "—"}

                            </span>

                          </td>

                          <td>
                            {personnel?.sex ??
                              "—"}
                          </td>

                          <td>
                            {personnel?.age ??
                              "—"}
                          </td>

                          <td>

                            <strong className="report-bmi">

                              {assessment.bmi >
                              0
                                ? assessment.bmi.toFixed(
                                    1,
                                  )
                                : "N/A"}

                            </strong>

                          </td>

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

                          <td>

                            <span className="report-date-cell">

                              {formatDate(
                                assessment.assessment_date,
                              )}

                            </span>

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

        {!loading &&
          filteredReports.length > 0 && (

            <div className="report-footer">

              Showing{" "}

              <strong>
                {filteredReports.length}
              </strong>{" "}

              of{" "}

              <strong>
                {assessments.length}
              </strong>{" "}

              records

            </div>

          )}

      </section>

      {/* ======================================================
          REPORT INFORMATION
      ====================================================== */}

      <section className="report-bottom-grid">

        <div className="report-card">

          <div className="small-card-header">

            <div>

              <h3>
                Excel Report Contents
              </h3>

              <p>
                Information included in
                the exported spreadsheet
              </p>

            </div>

          </div>

          <div className="report-content-list">

            <div>
              <span>✓</span>
              Personnel Information
            </div>

            <div>
              <span>✓</span>
              Office and Rank
            </div>

            <div>
              <span>✓</span>
              Physical Measurements
            </div>

            <div>
              <span>✓</span>
              BMI Classification
            </div>

            <div>
              <span>✓</span>
              Assessment Information
            </div>

          </div>

        </div>

        <div className="report-card">

          <div className="small-card-header">

            <div>

              <h3>
                Export Actions
              </h3>

              <p>
                Generate reports from
                the current filters
              </p>

            </div>

          </div>

          <div className="report-actions">

            <button
              onClick={exportToExcel}
              disabled={
                filteredReports.length ===
                0
              }
            >

              <span>
                XLS
              </span>

              <div>

                <strong>
                  Export Excel Report
                </strong>

                <small>
                  Export all filtered
                  personnel records
                </small>

              </div>

              <b>
                →
              </b>

            </button>

            <button
              onClick={
                exportSummaryToExcel
              }
              disabled={
                filteredReports.length ===
                0
              }
            >

              <span>
                #
              </span>

              <div>

                <strong>
                  Export Summary
                </strong>

                <small>
                  Export classification
                  statistics
                </small>

              </div>

              <b>
                →
              </b>

            </button>

          </div>

        </div>

      </section>

    </div>
  );
}