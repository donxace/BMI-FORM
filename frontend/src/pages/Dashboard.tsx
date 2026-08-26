import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

/*
 * ============================================================
 * TYPES & INTERFACES
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
  personnel: Personnel;
};

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
 * HELPER FUNCTIONS
 * ============================================================
 */

function normalizeClassification(
  classification: string | null | undefined
): Classification {
  const value = classification?.toLowerCase().trim();

  if (!value) return "Normal";

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

function classificationClass(classification: string) {
  return classification
    .toLowerCase()
    .replace(/\s+/g, "-");
}

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

  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function numberOrNull(
  value: string | number | null | undefined
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

/*
 * ============================================================
 * DASHBOARD COMPONENT
 * ============================================================
 */

export default function Dashboard() {
  const navigate = useNavigate();

  const [assessmentList, setAssessmentList] =
    useState<Assessment[]>([]);

  /*
   * Total personnel comes directly from:
   *
   * GET /personnel
   *
   * This is NOT calculated from assessments.
   */
  const [totalPersonnel, setTotalPersonnel] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ============================================================
   * FETCH TOTAL PERSONNEL
   * ============================================================
   *
   * This gets ALL personnel from the personnel endpoint.
   *
   * Example:
   *
   * /personnel
   *
   * [
   *   { personnel_id: 1, ... },
   *   { personnel_id: 2, ... },
   *   ...
   *   { personnel_id: 11, ... }
   * ]
   *
   * data.length === 11
   *
   * Therefore Total Personnel = 11
   */

  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/personnel"
        );

        if (!response.ok) {
          throw new Error(
            `Personnel API HTTP ${response.status}`
          );
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
          throw new Error(
            "Invalid personnel data returned by the server."
          );
        }

        setTotalPersonnel(data.length);
      } catch (err) {
        console.error(
          "PERSONNEL FETCH ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load personnel records."
        );
      }
    };

    fetchPersonnel();
  }, []);

  /*
   * ============================================================
   * FETCH BMI ASSESSMENTS
   * ============================================================
   */

  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          "http://localhost:3000/bmi-assessments"
        );

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}`
          );
        }

        const rawData =
          (await response.json()) as AssessmentApiResponse[];

        if (!Array.isArray(rawData)) {
          throw new Error(
            "Invalid assessment data returned by the server."
          );
        }

        const convertedData: Assessment[] =
          rawData.map((item) => {
            const personnelId = Number(
              item.assessment_personnel_id
            );

            const personnel: Personnel = {
              personnel_id: personnelId,

              rfid_uid:
                item.personnel_rfid_uid ?? "",

              rank:
                item.personnel_rank ?? "",

              surname:
                item.personnel_surname ?? "",

              first_name:
                item.personnel_first_name ?? "",

              middle_initial:
                item.personnel_middle_initial ??
                null,

              office:
                item.personnel_office ?? null,

              age:
                numberOrNull(
                  item.personnel_age
                ),

              sex:
                item.personnel_sex ?? null,
            };

            return {
              assessment_id: Number(
                item.assessment_assessment_id
              ),

              personnel_id: personnelId,

              height:
                Number(
                  item.assessment_height
                ) || 0,

              weight:
                Number(
                  item.assessment_weight
                ) || 0,

              waist:
                numberOrNull(
                  item.assessment_waist
                ),

              hip:
                numberOrNull(
                  item.assessment_hip
                ),

              wrist:
                numberOrNull(
                  item.assessment_wrist
                ),

              bmi:
                Number(
                  item.assessment_bmi
                ) || 0,

              ibw:
                numberOrNull(
                  item.assessment_ibw
                ),

              weight_to_lose:
                numberOrNull(
                  item.assessment_weight_to_lose
                ),

              pnp_classification:
                item.assessment_pnp_classification ??
                "N/A",

              who_classification:
                normalizeClassification(
                  item.assessment_who_classification
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

        setAssessmentList(convertedData);
      } catch (err) {
        console.error(
          "DASHBOARD FETCH ERROR:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load dashboard records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  /*
   * ============================================================
   * COMPUTED METRICS
   * ============================================================
   */

  /*
   * Total assessments comes from /bmi-assessments.
   */
  const totalAssessments =
    assessmentList.length;

  /*
   * Number of unique personnel who actually
   * have BMI assessments.
   *
   * This is different from totalPersonnel.
   */
  const uniquePersonnelCount = useMemo(() => {
    const ids = new Set(
      assessmentList.map(
        (assessment) =>
          assessment.personnel_id
      )
    );

    return ids.size;
  }, [assessmentList]);

  /*
   * Normal BMI
   */
  const normalCount = useMemo(
    () =>
      assessmentList.filter(
        (assessment) =>
          assessment.who_classification ===
          "Normal"
      ).length,
    [assessmentList]
  );

  /*
   * Overweight BMI
   */
  const overweightCount = useMemo(
    () =>
      assessmentList.filter(
        (assessment) =>
          assessment.who_classification ===
          "Overweight"
      ).length,
    [assessmentList]
  );

  /*
   * Obese BMI
   */
  const obeseCount = useMemo(
    () =>
      assessmentList.filter(
        (assessment) =>
          assessment.who_classification ===
          "Obese"
      ).length,
    [assessmentList]
  );

  /*
   * Underweight BMI
   */
  const underweightCount = useMemo(
    () =>
      assessmentList.filter(
        (assessment) =>
          assessment.who_classification ===
          "Underweight"
      ).length,
    [assessmentList]
  );

  /*
   * Needs attention =
   *
   * Underweight
   * +
   * Overweight
   * +
   * Obese
   */
  const needsAttentionCount =
    overweightCount +
    obeseCount +
    underweightCount;

  /*
   * Average BMI
   */
  const averageBmi = useMemo(() => {
    if (totalAssessments === 0) {
      return "0.0";
    }

    const sum = assessmentList.reduce(
      (acc, curr) =>
        acc + (curr.bmi || 0),
      0
    );

    return (
      sum / totalAssessments
    ).toFixed(1);
  }, [
    assessmentList,
    totalAssessments,
  ]);

  /*
   * ============================================================
   * BMI DISTRIBUTION
   * ============================================================
   */

  const bmiDistribution = useMemo(() => {
    const calcPercentage = (
      count: number
    ) =>
      totalAssessments > 0
        ? Math.round(
            (count / totalAssessments) *
              100
          )
        : 0;

    return [
      {
        label: "Underweight",
        count: underweightCount,
        percentage:
          calcPercentage(
            underweightCount
          ),
      },

      {
        label: "Normal",
        count: normalCount,
        percentage:
          calcPercentage(normalCount),
      },

      {
        label: "Overweight",
        count: overweightCount,
        percentage:
          calcPercentage(
            overweightCount
          ),
      },

      {
        label: "Obese",
        count: obeseCount,
        percentage:
          calcPercentage(obeseCount),
      },
    ];
  }, [
    totalAssessments,
    underweightCount,
    normalCount,
    overweightCount,
    obeseCount,
  ]);

  /*
   * ============================================================
   * RECENT ASSESSMENTS
   * ============================================================
   */

  const recentAssessments = useMemo(() => {
    return [...assessmentList]
      .sort(
        (a, b) =>
          b.assessment_id -
          a.assessment_id
      )
      .slice(0, 5);
  }, [assessmentList]);

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
      }
    );

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="content-header">
            <div>
              <span className="date-label">
                TODAY IS
              </span>

              <strong>
                {currentDate}
              </strong>
            </div>

            <div className="header-actions">
              <button
                onClick={() =>
                  navigate("/Report")
                }
                className="secondary-button"
              >
                ⬇ Export Report
              </button>

              <button
                className="primary-button"
                onClick={() =>
                  navigate("/Measurement")
                }
              >
                + New Assessment
              </button>
            </div>
          </div>

          {/* ==================================================
              ERROR
          ================================================== */}

          {error && (
            <div
              className="assessment-error"
              style={{
                marginBottom: "20px",
              }}
            >
              <strong>
                Unable to load dashboard data
              </strong>

              <span>
                {error}
              </span>
            </div>
          )}

          {/* ==================================================
              STAT CARDS
          ================================================== */}

          <section className="stat-grid">

            {/* TOTAL PERSONNEL */}

            <div className="stat-card">
              <div className="stat-top">
                <span>
                  Total Personnel
                </span>

                <div className="stat-icon blue">
                  ♙
                </div>
              </div>

              <h2>
                {loading
                  ? "..."
                  : totalPersonnel}
              </h2>

              <div className="stat-change positive">
                <span>
                  Registered in system
                </span>
              </div>
            </div>

            {/* TOTAL ASSESSMENTS */}

            <div className="stat-card">
              <div className="stat-top">
                <span>
                  Total Assessments
                </span>

                <div className="stat-icon purple">
                  ▣
                </div>
              </div>

              <h2>
                {loading
                  ? "..."
                  : totalAssessments}
              </h2>

              <div className="stat-change positive">
                <span>
                  Recorded in system
                </span>
              </div>
            </div>

            {/* NORMAL BMI */}

            <div className="stat-card">
              <div className="stat-top">
                <span>
                  Normal BMI
                </span>

                <div className="stat-icon green">
                  ✓
                </div>
              </div>

              <h2>
                {loading
                  ? "..."
                  : normalCount}
              </h2>

              <div className="stat-change neutral">
                {totalAssessments > 0
                  ? `${(
                      (normalCount /
                        totalAssessments) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}

                <span>
                  {" "}
                  of assessments
                </span>
              </div>
            </div>

            {/* NEEDS ATTENTION */}

            <div className="stat-card">
              <div className="stat-top">
                <span>
                  Needs Attention
                </span>

                <div className="stat-icon orange">
                  !
                </div>
              </div>

              <h2>
                {loading
                  ? "..."
                  : needsAttentionCount}
              </h2>

              <div className="stat-change warning">
                {totalAssessments > 0
                  ? `${(
                      (needsAttentionCount /
                        totalAssessments) *
                      100
                    ).toFixed(1)}%`
                  : "0%"}

                <span>
                  {" "}
                  need monitoring
                </span>
              </div>
            </div>

          </section>

          {/* ==================================================
              MAIN DASHBOARD GRID
          ================================================== */}

          <section className="dashboard-grid">

            {/* BMI DISTRIBUTION */}

            <div className="card bmi-card">
              <div className="card-header">
                <div>
                  <h3>
                    BMI Distribution
                  </h3>

                  <p>
                    Current assessment
                    classification breakdown
                  </p>
                </div>
              </div>

              <div className="distribution">
                {bmiDistribution.map(
                  (item) => (
                    <div
                      className="distribution-row"
                      key={item.label}
                    >
                      <div className="distribution-info">
                        <span>
                          {item.label}
                        </span>

                        <strong>
                          {item.count}
                        </strong>
                      </div>

                      <div className="progress">
                        <div
                          className={`progress-bar ${item.label.toLowerCase()}`}
                          style={{
                            width: `${item.percentage}%`,
                          }}
                        />
                      </div>

                      <span className="percentage">
                        {item.percentage}%
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* QUICK ACTIONS */}

            <div className="card quick-card">
              <div className="card-header">
                <div>
                  <h3>
                    Quick Actions
                  </h3>

                  <p>
                    Frequently used functions
                  </p>
                </div>
              </div>

              <div className="quick-actions">

                <button
                  onClick={() =>
                    navigate(
                      "/Measurement"
                    )
                  }
                >
                  <span className="quick-icon blue">
                    +
                  </span>

                  <div>
                    <strong>
                      New Assessment
                    </strong>

                    <small>
                      Record BMI measurement
                    </small>
                  </div>

                  <span>
                    ›
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate(
                      "/Personnel"
                    )
                  }
                >
                  <span className="quick-icon green">
                    ♙
                  </span>

                  <div>
                    <strong>
                      Add Personnel
                    </strong>

                    <small>
                      Register new personnel
                    </small>
                  </div>

                  <span>
                    ›
                  </span>
                </button>

                <button
                  onClick={() =>
                    navigate("/Report")
                  }
                >
                  <span className="quick-icon purple">
                    ▤
                  </span>

                  <div>
                    <strong>
                      Generate Report
                    </strong>

                    <small>
                      Create BMI report
                    </small>
                  </div>

                  <span>
                    ›
                  </span>
                </button>

              </div>
            </div>

          </section>

          {/* ==================================================
              RECENT ASSESSMENTS
          ================================================== */}

          <section className="card assessments-card">

            <div className="card-header">
              <div>
                <h3>
                  Recent BMI Assessments
                </h3>

                <p>
                  Latest personnel assessment
                  records
                </p>
              </div>
            </div>

            <div className="table-container">

              {loading ? (
                <div
                  style={{
                    padding: "2rem",
                    textAlign: "center",
                  }}
                >
                  Loading recent
                  assessments...
                </div>
              ) : (
                <table>

                  <thead>
                    <tr>
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
                        BMI
                      </th>

                      <th>
                        CLASSIFICATION
                      </th>

                      <th>
                        DATE
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {recentAssessments.length ===
                    0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          style={{
                            textAlign:
                              "center",
                            padding:
                              "2rem",
                          }}
                        >
                          No recent
                          assessments
                          found.
                        </td>
                      </tr>
                    ) : (
                      recentAssessments.map(
                        (assessment) => (
                          <tr
                            key={
                              assessment.assessment_id
                            }
                          >

                            <td>
                              <div className="person-cell">

                                <div className="person-avatar">
                                  {getInitials(
                                    assessment.personnel
                                  )}
                                </div>

                                <div>
                                  <strong>
                                    {getFullName(
                                      assessment.personnel
                                    )}
                                  </strong>

                                  <small>
                                    Personnel ID #
                                    {String(
                                      assessment.personnel_id
                                    ).padStart(
                                      4,
                                      "0"
                                    )}
                                  </small>
                                </div>

                              </div>
                            </td>

                            <td>
                              {assessment
                                .personnel
                                .rank ||
                                "—"}
                            </td>

                            <td>
                              {assessment
                                .personnel
                                .office ||
                                "No office"}
                            </td>

                            <td>
                              <strong className="bmi-value">
                                {assessment.bmi >
                                0
                                  ? assessment.bmi.toFixed(
                                      1
                                    )
                                  : "N/A"}
                              </strong>

                              <small>
                                {" "}
                                kg/m²
                              </small>
                            </td>

                            <td>
                              <span
                                className={`badge ${classificationClass(
                                  assessment.who_classification
                                )}`}
                              >
                                <span className="badge-dot" />

                                {
                                  assessment.who_classification
                                }
                              </span>
                            </td>

                            <td>
                              {formatDate(
                                assessment.assessment_date
                              )}
                            </td>

                          </tr>
                        )
                      )
                    )}

                  </tbody>

                </table>
              )}

            </div>
          </section>

          {/* ==================================================
              SYSTEM SUMMARY
          ================================================== */}

          <section className="bottom-grid">

            <div className="card system-card">

              <div className="card-header">
                <div>
                  <h3>
                    System Summary
                  </h3>

                  <p>
                    BMI monitoring status
                  </p>
                </div>
              </div>

              <div className="summary-list">

                <div>
                  <span>
                    Assessed Personnel
                  </span>

                  <strong>
                    {uniquePersonnelCount}
                  </strong>
                </div>

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
                    Average BMI
                  </span>

                  <strong>
                    {averageBmi}
                  </strong>
                </div>

              </div>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}