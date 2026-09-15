import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  Search,
  Hash,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Download,
  FileSpreadsheet,
  Check,
  ChevronRight,
  Printer,
} from "lucide-react";
import "./Report.css";
import StatDrilldownModal, {
  type DrilldownRow,
} from "../components/StatDrilldownModal";
import {
  type Assessment,
  fetchBmiAssessments,
  filterAssessments,
  filtersToSearchParams,
  formatDate,
  getClassificationClass,
  getFullName,
  getInitials,
} from "../utils/bmiReport";

/*
 * ============================================================
 * HELPERS (Excel export only — not shared with the print page)
 * ============================================================
 */

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

  // Stat card drill-down modal ("who are these numbers")
  const [activeStat, setActiveStat] = useState<
    "total" | "normal" | "overweight" | "obese" | "underweight" | "bmi" | null
  >(null);

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
   * PAGINATION STATE
   * ============================================================
   */

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, rank, office, sex, classification, dateFilter]);

  /*
   * ============================================================
   * FETCH DATA
   * ============================================================
   */

  useEffect(() => {
    const loadAssessments = async () => {
      try {
        setLoading(true);
        setError("");
        setAssessments(await fetchBmiAssessments());
      } catch (err) {
        console.error("REPORT FETCH ERROR:", err);
        setError(err instanceof Error ? err.message : "Unable to load reports.");
      } finally {
        setLoading(false);
      }
    };

    loadAssessments();
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

  const filteredReports = useMemo(
    () => filterAssessments(assessments, { search, rank, office, sex, classification, dateFilter }),
    [assessments, search, rank, office, sex, classification, dateFilter],
  );

  /*
   * ============================================================
   * PAGINATION
   * ============================================================
   */

  const totalPages =
    Math.ceil(filteredReports.length / itemsPerPage) || 1;

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage]);

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
   * STAT CARD DRILL-DOWN LISTS ("who are these numbers")
   *
   * Rows are built lazily (only for the currently open modal,
   * inside useMemo) instead of eagerly for all six categories
   * on every render -- otherwise every keystroke in a filter
   * field would re-map the entire filtered report list six
   * times over.
   * ============================================================
   */

  const statMeta = {
    total: {
      title: "Filtered Records",
      subtitle: `${totalReports} records match the current filters`,
    },
    normal: {
      title: "Normal",
      subtitle: `${normalCount} personnel within normal BMI range`,
    },
    overweight: {
      title: "Overweight",
      subtitle: `${overweightCount} personnel classified as overweight`,
    },
    obese: {
      title: "Obese",
      subtitle: `${obeseCount} personnel classified as obese`,
    },
    underweight: {
      title: "Underweight",
      subtitle: `${underweightCount} personnel classified as underweight`,
    },
    bmi: {
      title: "Average BMI",
      subtitle: `Based on ${filteredReports.length} filtered records, sorted highest to lowest`,
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
        return filteredReports.map(toRow);
      case "normal":
        return filteredReports
          .filter((a) => a.who_classification === "Normal")
          .map(toRow);
      case "overweight":
        return filteredReports
          .filter((a) => a.who_classification === "Overweight")
          .map(toRow);
      case "obese":
        return filteredReports
          .filter((a) => a.who_classification === "Obese")
          .map(toRow);
      case "underweight":
        return filteredReports
          .filter((a) => a.who_classification === "Underweight")
          .map(toRow);
      case "bmi":
        return [...filteredReports].sort((a, b) => b.bmi - a.bmi).map(toRow);
      default:
        return [];
    }
  }, [activeStat, filteredReports]);

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
   * PRINTABLE FORMAT
   *
   * Opens a new tab at /report/print carrying the current filters
   * as a query string — the print page re-fetches and re-filters
   * independently (see utils/bmiReport.ts) rather than trying to
   * hand off live component state across tabs.
   * ============================================================
   */

  const openPrintableReport = () => {
    const query = filtersToSearchParams({
      search,
      rank,
      office,
      sex,
      classification,
      dateFilter,
    }).toString();

    window.open(
      `/report/print${query ? `?${query}` : ""}`,
      "_blank",
      "noopener,noreferrer",
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
            className="print-report-button"
            onClick={openPrintableReport}
            disabled={
              filteredReports.length === 0
            }
          >
            <span>
              <Printer size={14} strokeWidth={2.25} />
            </span>
            Printable Format
          </button>

          <button
            className="excel-export-button"
            onClick={exportToExcel}
            disabled={
              filteredReports.length === 0
            }
          >
            <span>
              <Download size={14} strokeWidth={2.25} />
            </span>

            Export Excel
          </button>

        </div>

      </section>

      {/* ======================================================
          SUMMARY
      ====================================================== */}

      <section className="report-summary">

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("total")}
        >

          <div className="summary-icon blue">
            <Hash size={18} strokeWidth={2} />
          </div>

          <div>
            <span>
              FILTERED RECORDS
            </span>

            <strong>
              {totalReports}
            </strong>

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("normal")}
        >

          <div className="summary-icon green">
            <CheckCircle2 size={18} strokeWidth={2} />
          </div>

          <div>
            <span>
              NORMAL
            </span>

            <strong>
              {normalCount}
            </strong>

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("overweight")}
        >

          <div className="summary-icon orange">
            <TrendingUp size={18} strokeWidth={2} />
          </div>

          <div>
            <span>
              OVERWEIGHT
            </span>

            <strong>
              {overweightCount}
            </strong>

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("obese")}
        >

          <div className="summary-icon red">
            <AlertTriangle size={18} strokeWidth={2} />
          </div>

          <div>
            <span>
              OBESE
            </span>

            <strong>
              {obeseCount}
            </strong>

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("underweight")}
        >

          <div className="summary-icon purple">
            <TrendingDown size={18} strokeWidth={2} />
          </div>

          <div>
            <span>
              UNDERWEIGHT
            </span>

            <strong>
              {underweightCount}
            </strong>

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

        <button
          type="button"
          className="report-summary-card sdm-card-trigger"
          onClick={() => setActiveStat("bmi")}
        >

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

            <span className="sdm-view-hint">View list →</span>
          </div>

        </button>

      </section>

      {activeStat && (
        <StatDrilldownModal
          title={statMeta[activeStat].title}
          subtitle={statMeta[activeStat].subtitle}
          rows={activeStatRows}
          emptyMessage="No records found."
          onClose={() => setActiveStat(null)}
        />
      )}

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
                <Search size={14} strokeWidth={2} />
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

                  paginatedReports.map(
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

        {/* ====================================================
            MODERN PAGINATION CONTROLS
        ===================================================== */}

        {!loading &&
          filteredReports.length > itemsPerPage && (
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
                    filteredReports.length
                  )}
                </strong>{" "}
                of <strong>{filteredReports.length}</strong> entries
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
              <span><Check size={12} strokeWidth={2.5} /></span>
              Personnel Information
            </div>

            <div>
              <span><Check size={12} strokeWidth={2.5} /></span>
              Office and Rank
            </div>

            <div>
              <span><Check size={12} strokeWidth={2.5} /></span>
              Physical Measurements
            </div>

            <div>
              <span><Check size={12} strokeWidth={2.5} /></span>
              BMI Classification
            </div>

            <div>
              <span><Check size={12} strokeWidth={2.5} /></span>
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
                <FileSpreadsheet size={16} strokeWidth={2} />
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
                <ChevronRight size={16} strokeWidth={2} />
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
                <Hash size={16} strokeWidth={2} />
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
                <ChevronRight size={16} strokeWidth={2} />
              </b>

            </button>

          </div>

        </div>

      </section>

    </div>
  );
}