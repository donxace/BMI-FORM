import { useEffect, useMemo, useState } from "react";
import "./Assessment.css";

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

  personnel?: Personnel;
};

/*
 * ============================================================
 * HELPER FUNCTIONS
 * ============================================================
 */

function getClassificationClass(
  classification: string,
) {
  return classification
    .toLowerCase()
    .replace(/\s+/g, "-");
}

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
 * ASSESSMENT PAGE
 * ============================================================
 */

export default function Assessment() {
  /*
   * ============================================================
   * ASSESSMENT STATE
   * ============================================================
   */

  const [assessmentList, setAssessmentList] =
    useState<Assessment[]>([]);

  const [loadingAssessments, setLoadingAssessments] =
    useState(true);

  const [assessmentError, setAssessmentError] =
    useState("");

  /*
   * ============================================================
   * SEARCH / FILTER STATE
   * ============================================================
   */

  const [search, setSearch] =
    useState("");

  const [classificationFilter, setClassificationFilter] =
    useState("");

  /*
   * ============================================================
   * SELECTED ASSESSMENT STATE
   * ============================================================
   */

  const [selectedAssessment, setSelectedAssessment] =
    useState<Assessment | null>(null);

  /*
   * ============================================================
   * LOAD ASSESSMENTS FROM DATABASE
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
          "http://localhost:3000/bmi-assessments",
        );

        console.log(
          "Response status:",
          response.status,
        );

        console.log(
          "Response OK:",
          response.ok,
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`,
          );
        }

        const rawData =
          await response.json();

        console.log(
          "RAW BMI API RESPONSE:",
          rawData,
        );

        console.log(
          "RAW BMI API RESPONSE JSON:",
          JSON.stringify(
            rawData,
            null,
            2,
          ),
        );

        console.log(
          "Is array:",
          Array.isArray(rawData),
        );

        if (!Array.isArray(rawData)) {
          throw new Error(
            "Invalid assessment data returned by the server.",
          );
        }

        /*
         * ========================================================
         * IMPORTANT
         *
         * The API returns personnel fields directly in the
         * assessment object.
         *
         * Example:
         *
         * {
         *   assessment_id: 1,
         *   personnel_id: 7,
         *   rank: "PCPL",
         *   surname: "Santos",
         *   first_name: "Juan",
         *   office: "PNP Health Service"
         * }
         *
         * We convert that flat response into the structure
         * used by this component.
         * ========================================================
         */

        const data: Assessment[] =
          rawData.map(
            (item: any) => {
              const assessmentId =
                Number(
                  item.assessment_id ??
                    item.assessmentId ??
                    item.id ??
                    0,
                );

              const personnelId =
                Number(
                  item.personnel_id ??
                    item.personnelId ??
                    item.personnel?.personnel_id ??
                    0,
                );

              const personnel: Personnel = {
                personnel_id:
                  personnelId,

                rfid_uid:
                  item.rfid_uid ??
                  item.rfidUid ??
                  item.personnel?.rfid_uid ??
                  item.personnel?.rfidUid ??
                  "",

                rank:
                  item.rank ??
                  item.personnel?.rank ??
                  "",

                surname:
                  item.surname ??
                  item.personnel?.surname ??
                  "",

                first_name:
                  item.first_name ??
                  item.firstName ??
                  item.personnel?.first_name ??
                  item.personnel?.firstName ??
                  "",

                middle_initial:
                  item.middle_initial ??
                  item.middleInitial ??
                  item.personnel?.middle_initial ??
                  item.personnel?.middleInitial ??
                  null,

                office:
                  item.office ??
                  item.personnel?.office ??
                  null,

                age:
                  item.age !== null &&
                  item.age !== undefined
                    ? Number(item.age)
                    : item.personnel?.age !==
                        null &&
                      item.personnel?.age !==
                        undefined
                    ? Number(
                        item.personnel.age,
                      )
                    : null,

                sex:
                  item.sex ??
                  item.personnel?.sex ??
                  null,
              };

              const whoClassification =
                item.who_classification ??
                item.whoClassification ??
                "Normal";

              return {
                assessment_id:
                  assessmentId,

                personnel_id:
                  personnelId,

                height:
                  item.height !== null &&
                  item.height !== undefined
                    ? Number(item.height)
                    : 0,

                weight:
                  item.weight !== null &&
                  item.weight !== undefined
                    ? Number(item.weight)
                    : 0,

                waist:
                  item.waist !== null &&
                  item.waist !== undefined
                    ? Number(item.waist)
                    : null,

                hip:
                  item.hip !== null &&
                  item.hip !== undefined
                    ? Number(item.hip)
                    : null,

                wrist:
                  item.wrist !== null &&
                  item.wrist !== undefined
                    ? Number(item.wrist)
                    : null,

                bmi:
                  item.bmi !== null &&
                  item.bmi !== undefined
                    ? Number(item.bmi)
                    : 0,

                ibw:
                  item.ibw !== null &&
                  item.ibw !== undefined
                    ? Number(item.ibw)
                    : null,

                weight_to_lose:
                  item.weight_to_lose !== null &&
                  item.weight_to_lose !==
                    undefined
                    ? Number(
                        item.weight_to_lose,
                      )
                    : null,

                pnp_classification:
                  item.pnp_classification ??
                  item.pnpClassification ??
                  "N/A",

                who_classification:
                  whoClassification as Classification,

                assessment_date:
                  item.assessment_date ??
                  item.assessmentDate ??
                  "",

                unit_representative:
                  item.unit_representative ??
                  item.unitRepresentative ??
                  null,

                health_service_representative:
                  item.health_service_representative ??
                  item.healthServiceRepresentative ??
                  null,

                encoder:
                  item.encoder ??
                  null,

                personnel,
              };
            },
          );

        console.log(
          "CONVERTED ASSESSMENTS:",
          data,
        );

        setAssessmentList(data);
      } catch (error) {
        console.error(
          "ASSESSMENT FETCH ERROR:",
          error,
        );

        if (error instanceof TypeError) {
          console.error(
            "This is probably a network/CORS/fetch URL problem.",
          );
        }

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
    const searchValue =
      search.toLowerCase().trim();

    return assessmentList.filter(
      (assessment) => {
        const personnel =
          assessment.personnel;

        const fullName =
          getFullName(
            personnel,
          ).toLowerCase();

        const rank =
          personnel?.rank
            ?.toLowerCase() ?? "";

        const office =
          personnel?.office
            ?.toLowerCase() ?? "";

        const rfid =
          personnel?.rfid_uid
            ?.toLowerCase() ?? "";

        const personnelId =
          String(
            assessment.personnel_id,
          );

        const assessmentId =
          String(
            assessment.assessment_id,
          );

        const matchesSearch =
          !searchValue ||
          fullName.includes(
            searchValue,
          ) ||
          rank.includes(
            searchValue,
          ) ||
          office.includes(
            searchValue,
          ) ||
          rfid.includes(
            searchValue,
          ) ||
          personnelId.includes(
            searchValue,
          ) ||
          assessmentId.includes(
            searchValue,
          );

        const matchesClassification =
          !classificationFilter ||
          assessment.who_classification ===
            classificationFilter;

        return (
          matchesSearch &&
          matchesClassification
        );
      },
    );
  }, [
    assessmentList,
    search,
    classificationFilter,
  ]);

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
   * VIEW ASSESSMENT
   * ============================================================
   */

  const handleViewAssessment = (
    assessment: Assessment,
  ) => {
    console.log(
      "Selected assessment:",
      assessment,
    );

    setSelectedAssessment(
      assessment,
    );
  };

  /*
   * ============================================================
   * CLOSE ASSESSMENT
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
    console.log(
      "Opening BMI PDF:",
      assessmentId,
    );

    window.open(
      `http://localhost:3000/health-reports/bmi/${assessmentId}/pdf`,
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
          PAGE HEADER
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
          STAT CARDS
      ======================================================= */}

      <section className="assessment-stat-grid">

        {/* TOTAL */}

        <div className="assessment-stat-card">

          <div className="stat-top">

            <span>
              Total Assessments
            </span>

            <div className="stat-icon blue">
              #
            </div>

          </div>

          <h2>
            {totalAssessments}
          </h2>

          <div className="stat-change positive">
            Recorded assessments
          </div>

        </div>

        {/* NORMAL */}

        <div className="assessment-stat-card">

          <div className="stat-top">

            <span>
              Normal
            </span>

            <div className="stat-icon green">
              ✓
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

        </div>

        {/* OVERWEIGHT */}

        <div className="assessment-stat-card">

          <div className="stat-top">

            <span>
              Overweight
            </span>

            <div className="stat-icon orange">
              !
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

        </div>

        {/* OBESE */}

        <div className="assessment-stat-card">

          <div className="stat-top">

            <span>
              Obese
            </span>

            <div className="stat-icon red">
              !
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

        </div>

        {/* UNDERWEIGHT */}

        <div className="assessment-stat-card">

          <div className="stat-top">

            <span>
              Underweight
            </span>

            <div className="stat-icon purple">
              ↓
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

        </div>

      </section>

      {/* ======================================================
          ASSESSMENT TABLE
      ======================================================= */}

      <section className="assessment-card">

        {/* CARD HEADER */}

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
            SEARCH AND FILTERS
        ===================================================== */}

        <div className="assessment-filters">

          {/* SEARCH */}

          <div className="search-wrapper">

            <span>
              🔍
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

          {/* CLASSIFICATION */}

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

          /* ==================================================
             TABLE
          ================================================== */

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

                  filteredAssessments.map(
                    (
                      assessment,
                    ) => {

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

                                  {personnel?.rank
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

                              {personnel?.office ??
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
            TABLE FOOTER
        ===================================================== */}

        {!loadingAssessments &&
          filteredAssessments.length >
            0 && (

            <div className="table-footer">

              <span>

                Showing{" "}

                <strong>
                  {
                    filteredAssessments.length
                  }
                </strong>{" "}

                of{" "}

                <strong>
                  {
                    assessmentList.length
                  }
                </strong>{" "}

                assessments

              </span>

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
                ⌕
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
                ›
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
                ✓
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
                ›
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
                !
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
                ›
              </span>

            </button>

          </div>

        </div>

        {/* ASSESSMENT SUMMARY */}

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
          ASSESSMENT DETAILS MODAL
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

            {/* MODAL HEADER */}

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

                  {
                    selectedAssessment
                      .personnel?.rank
                  }{" "}

                  {getFullName(
                    selectedAssessment.personnel,
                  )}

                </h3>

                <p>

                  {
                    selectedAssessment
                      .personnel?.office ??
                    "No office assigned"
                  }

                </p>

              </div>

            </div>

            {/* BMI RESULT */}

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

            {/* CLASSIFICATIONS */}

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

                    {
                      selectedAssessment.weight_to_lose !==
                      null
                        ? `${selectedAssessment.weight_to_lose} kg`
                        : "—"
                    }

                  </strong>

                </div>

              </div>

            </div>

            {/* ASSESSMENT INFORMATION */}

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

                    {
                      selectedAssessment.unit_representative ??
                      "—"
                    }

                  </strong>

                </div>

                <div>

                  <span>
                    Health Service
                    Representative
                  </span>

                  <strong>

                    {
                      selectedAssessment.health_service_representative ??
                      "—"
                    }

                  </strong>

                </div>

                <div>

                  <span>
                    Encoder
                  </span>

                  <strong>

                    {
                      selectedAssessment.encoder ??
                      "—"
                    }

                  </strong>

                </div>

                <div>

                  <span>
                    RFID UID
                  </span>

                  <strong>

                    {
                      selectedAssessment
                        .personnel
                        ?.rfid_uid ??
                      "—"
                    }

                  </strong>

                </div>

              </div>

            </div>

            {/* MODAL ACTIONS */}

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