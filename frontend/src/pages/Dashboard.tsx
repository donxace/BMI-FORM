import { useEffect, useMemo, useState } from "react";
import "./Dashboard.css";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * ============================================================
 * TYPES & INTERFACES
 * ============================================================
 */

type Classification = "Underweight" | "Normal" | "Overweight" | "Obese";

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

  personnel_rfid_uid: string | null;
  personnel_rank: string | null;
  personnel_surname: string | null;
  personnel_first_name: string | null;
  personnel_middle_initial: string | null;
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
  if (value.includes("underweight")) return "Underweight";
  if (value.includes("overweight")) return "Overweight";
  if (value.includes("obese") || value.includes("obesity")) return "Obese";
  return "Normal";
}

function classificationClass(classification: string) {
  return classification.toLowerCase().replace(/\s+/g, "-");
}

function getFullName(personnel?: Personnel) {
  if (!personnel) return "Unknown Personnel";
  return [personnel.first_name, personnel.middle_initial, personnel.surname]
    .filter(Boolean)
    .join(" ");
}

function getInitials(personnel?: Personnel) {
  if (!personnel) return "NA";
  const firstInitial = personnel.first_name?.charAt(0) ?? "";
  const lastInitial = personnel.surname?.charAt(0) ?? "";
  return `${firstInitial}${lastInitial}`.toUpperCase();
}

function formatDate(date: string) {
  if (!date) return "—";
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function numberOrNull(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

const parseLocalDate = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match.map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(dateStr);
};

/*
 * ============================================================
 * DASHBOARD COMPONENT
 * ============================================================
 */

export default function Dashboard() {
  const navigate = useNavigate();

  // Raw fetched assessments
  const [allAssessments, setAllAssessments] = useState<Assessment[]>([]);
  const [totalPersonnel, setTotalPersonnel] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Month Selection State
  const [selectedMonthFilter, setSelectedMonthFilter] = useState<string>("ALL");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  /*
   * Fetch Personnel Count
   */
  useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/personnel`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setTotalPersonnel(data.length);
        }
      } catch (err) {
        console.error("PERSONNEL FETCH ERROR:", err);
      }
    };
    fetchPersonnel();
  }, []);

  /*
   * Fetch BMI Assessments
   */
  useEffect(() => {
    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/bmi-assessments`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawData = (await response.json()) as AssessmentApiResponse[];

        if (!Array.isArray(rawData)) {
          throw new Error("Invalid assessment data returned by the server.");
        }

        const convertedData: Assessment[] = rawData.map((item) => {
          const personnelId = Number(item.assessment_personnel_id);

          const personnel: Personnel = {
            personnel_id: personnelId,
            rfid_uid: item.personnel_rfid_uid ?? "",
            rank: item.personnel_rank ?? "",
            surname: item.personnel_surname ?? "",
            first_name: item.personnel_first_name ?? "",
            middle_initial: item.personnel_middle_initial ?? null,
            office: item.personnel_office ?? null,
            age: numberOrNull(item.personnel_age),
            sex: item.personnel_sex ?? null,
          };

          return {
            assessment_id: Number(item.assessment_assessment_id),
            personnel_id: personnelId,
            height: Number(item.assessment_height) || 0,
            weight: Number(item.assessment_weight) || 0,
            waist: numberOrNull(item.assessment_waist),
            hip: numberOrNull(item.assessment_hip),
            wrist: numberOrNull(item.assessment_wrist),
            bmi: Number(item.assessment_bmi) || 0,
            ibw: numberOrNull(item.assessment_ibw),
            weight_to_lose: numberOrNull(item.assessment_weight_to_lose),
            pnp_classification: item.assessment_pnp_classification ?? "N/A",
            who_classification: normalizeClassification(
              item.assessment_who_classification
            ),
            assessment_date: item.assessment_assessment_date ?? "",
            unit_representative: item.assessment_unit_representative ?? null,
            health_service_representative:
              item.assessment_health_service_representative ?? null,
            encoder: item.assessment_encoder ?? null,
            personnel,
          };
        });

        setAllAssessments(convertedData);

        // Default filter: Find the latest available month in dataset
        if (convertedData.length > 0) {
          const timestamps = convertedData
            .map((item) => parseLocalDate(item.assessment_date)?.getTime() ?? 0)
            .filter((ts) => ts > 0);

          if (timestamps.length > 0) {
            const maxTimestamp = Math.max(...timestamps);
            const latestDate = new Date(maxTimestamp);
            const defaultKey = `${latestDate.getFullYear()}-${latestDate.getMonth()}`;
            setSelectedMonthFilter(defaultKey);
          }
        }
      } catch (err) {
        console.error("DASHBOARD FETCH ERROR:", err);
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
   * Available Months Dropdown Items
   */
  const availableMonths = useMemo(() => {
    const monthsMap = new Map<
      string,
      { label: string; year: number; month: number }
    >();

    allAssessments.forEach((item) => {
      const date = parseLocalDate(item.assessment_date);
      if (!date) return;

      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date
        .toLocaleDateString("en-US", { month: "long", year: "numeric" })
        .toUpperCase();

      if (!monthsMap.has(key)) {
        monthsMap.set(key, { label, year: date.getFullYear(), month: date.getMonth() });
      }
    });

    // Sort descending by date
    return Array.from(monthsMap.entries()).sort(
      ([keyA], [keyB]) => (keyA > keyB ? -1 : 1)
    );
  }, [allAssessments]);

  /*
   * Active Filtered List based on Dropdown Selection
   */
  const filteredList = useMemo(() => {
    if (selectedMonthFilter === "ALL") {
      return allAssessments;
    }

    const [targetYear, targetMonth] = selectedMonthFilter.split("-").map(Number);

    return allAssessments.filter((item) => {
      const date = parseLocalDate(item.assessment_date);
      if (!date) return false;
      return (
        date.getFullYear() === targetYear && date.getMonth() === targetMonth
      );
    });
  }, [allAssessments, selectedMonthFilter]);

  /*
   * Current Display Label for Month Header
   */
  const currentMonthLabel = useMemo(() => {
    if (selectedMonthFilter === "ALL") return "ALL RECORDS";

    const selected = availableMonths.find(([key]) => key === selectedMonthFilter);
    if (selected) {
      return selected[1].label;
    }

    return new Date().toLocaleDateString("en-US", { month: "long" }).toUpperCase();
  }, [selectedMonthFilter, availableMonths]);

  /*
   * COMPUTED METRICS
   */
  const totalAssessments = filteredList.length;

  const uniquePersonnelCount = useMemo(() => {
    const ids = new Set(filteredList.map((a) => a.personnel_id));
    return ids.size;
  }, [filteredList]);

  const normalCount = useMemo(
    () => filteredList.filter((a) => a.who_classification === "Normal").length,
    [filteredList]
  );

  const overweightCount = useMemo(
    () => filteredList.filter((a) => a.who_classification === "Overweight").length,
    [filteredList]
  );

  const obeseCount = useMemo(
    () => filteredList.filter((a) => a.who_classification === "Obese").length,
    [filteredList]
  );

  const underweightCount = useMemo(
    () => filteredList.filter((a) => a.who_classification === "Underweight").length,
    [filteredList]
  );

  const needsAttentionCount = overweightCount + obeseCount + underweightCount;

  const averageBmi = useMemo(() => {
    if (totalAssessments === 0) return "0.0";
    const sum = filteredList.reduce((acc, curr) => acc + (curr.bmi || 0), 0);
    return (sum / totalAssessments).toFixed(1);
  }, [filteredList, totalAssessments]);

  const bmiDistribution = useMemo(() => {
    const calcPercentage = (count: number) =>
      totalAssessments > 0
        ? Math.round((count / totalAssessments) * 100)
        : 0;

    return [
      {
        label: "Underweight",
        count: underweightCount,
        percentage: calcPercentage(underweightCount),
      },
      {
        label: "Normal",
        count: normalCount,
        percentage: calcPercentage(normalCount),
      },
      {
        label: "Overweight",
        count: overweightCount,
        percentage: calcPercentage(overweightCount),
      },
      {
        label: "Obese",
        count: obeseCount,
        percentage: calcPercentage(obeseCount),
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
   * PAGINATION CALCULATIONS
   */
  const sortedAssessments = useMemo(() => {
    return [...filteredList].sort((a, b) => b.assessment_id - a.assessment_id);
  }, [filteredList]);

  const totalPages = Math.ceil(sortedAssessments.length / itemsPerPage) || 1;

  const paginatedAssessments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedAssessments.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedAssessments, currentPage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleMonthChange = (val: string) => {
    setSelectedMonthFilter(val);
    setCurrentPage(1); // Reset page on month switch
  };

  /*
   * RENDER
   */
  return (
    <div className="dashboard">
      <main className="main-content">
        <div className="content">

          {/* HEADER */}
          <div className="content-header">
            <div>
              <span className="date-label">MONTH OF</span>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <strong className="current-month">{currentMonthLabel}</strong>

                {/* MONTH DROP-DOWN SELECTOR */}
                {availableMonths.length > 0 && (
                  <select
            className="month-select"
            value={selectedMonthFilter}
            onChange={(e) => handleMonthChange(e.target.value)}
          >
                    <option value="ALL">Show All Months</option>
                    {availableMonths.map(([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="header-actions">
              <button
                onClick={() => navigate("/Report")}
                className="secondary-button"
              >
                ⬇ Export Report
              </button>

              <button
                className="primary-button"
                onClick={() => navigate("/Measurement")}
              >
                + New Assessment
              </button>
            </div>
          </div>

          {/* ERROR DISPLAY */}
          {error && (
            <div
              className="assessment-error"
              style={{ marginBottom: "20px" }}
            >
              <strong>Unable to load dashboard data: </strong>
              <span>{error}</span>
            </div>
          )}

          {/* STAT CARDS */}
          <section className="stat-grid">
            <div className="stat-card">
              <div className="stat-top">
                <span>Total Personnel</span>
                <div className="stat-icon blue">♙</div>
              </div>
              <h2>{loading ? "..." : totalPersonnel}</h2>
              <div className="stat-change positive">
                <span>Registered in system</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Total Assessments</span>
                <div className="stat-icon purple">▣</div>
              </div>
              <h2>{loading ? "..." : totalAssessments}</h2>
              <div className="stat-change positive">
                <span>Recorded for selected period</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Normal BMI</span>
                <div className="stat-icon green">✓</div>
              </div>
              <h2>{loading ? "..." : normalCount}</h2>
              <div className="stat-change neutral">
                {totalAssessments > 0
                  ? `${((normalCount / totalAssessments) * 100).toFixed(1)}%`
                  : "0%"}
                <span> of assessments</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-top">
                <span>Needs Attention</span>
                <div className="stat-icon orange">!</div>
              </div>
              <h2>{loading ? "..." : needsAttentionCount}</h2>
              <div className="stat-change warning">
                {totalAssessments > 0
                  ? `${((needsAttentionCount / totalAssessments) * 100).toFixed(1)}%`
                  : "0%"}
                <span> need monitoring</span>
              </div>
            </div>
          </section>

          {/* MAIN DASHBOARD GRID */}
          <section className="dashboard-grid">
            <div className="card bmi-card">
              <div className="card-header">
                <div>
                  <h3>BMI Distribution</h3>
                  <p>Current assessment classification breakdown</p>
                </div>
              </div>

              <div className="distribution">
                {bmiDistribution.map((item) => (
                  <div className="distribution-row" key={item.label}>
                    <div className="distribution-info">
                      <span>{item.label}</span>
                      <strong>{item.count}</strong>
                    </div>

                    <div className="progress">
                      <div
                        className={`progress-bar ${item.label.toLowerCase()}`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>

                    <span className="percentage">{item.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card quick-card">
              <div className="card-header">
                <div>
                  <h3>Quick Actions</h3>
                  <p>Frequently used functions</p>
                </div>
              </div>

              <div className="quick-actions">
                <button onClick={() => navigate("/Measurement")}>
                  <span className="quick-icon blue">+</span>
                  <div>
                    <strong>New Assessment</strong>
                    <small>Record BMI measurement</small>
                  </div>
                  <span>›</span>
                </button>

                <button onClick={() => navigate("/Personnel?add=true")}>
                  <span className="quick-icon green">♙</span>
                  <div>
                    <strong>Add Personnel</strong>
                    <small>Register new personnel</small>
                  </div>
                  <span>›</span>
                </button>

                <button onClick={() => navigate("/Report")}>
                  <span className="quick-icon purple">▤</span>
                  <div>
                    <strong>Generate Report</strong>
                    <small>Create BMI report</small>
                  </div>
                  <span>›</span>
                </button>
              </div>
            </div>
          </section>

          {/* RECENT ASSESSMENTS TABLE WITH MODERN PAGINATION */}
          <section className="card assessments-card">
            <div className="card-header">
              <div>
                <h3>Recent BMI Assessments</h3>
                <p>Latest personnel assessment records</p>
              </div>
            </div>

            <div className="table-container">
              {loading ? (
                <div style={{ padding: "2rem", textAlign: "center" }}>
                  Loading assessments...
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>PERSONNEL</th>
                        <th>RANK</th>
                        <th>OFFICE</th>
                        <th>BMI</th>
                        <th>CLASSIFICATION</th>
                        <th>DATE</th>
                      </tr>
                    </thead>

                    <tbody>
                      {paginatedAssessments.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            style={{ textAlign: "center", padding: "2rem" }}
                          >
                            No assessments found for this month.
                          </td>
                        </tr>
                      ) : (
                        paginatedAssessments.map((assessment) => (
                          <tr key={assessment.assessment_id}>
                            <td>
                              <div className="person-cell">
                                <div className="person-avatar">
                                  {getInitials(assessment.personnel)}
                                </div>
                                <div>
                                  <strong>
                                    {getFullName(assessment.personnel)}
                                  </strong>
                                  <small>
                                    Personnel ID #
                                    {String(
                                      assessment.personnel_id
                                    ).padStart(4, "0")}
                                  </small>
                                </div>
                              </div>
                            </td>

                            <td>{assessment.personnel.rank || "—"}</td>

                            <td>
                              {assessment.personnel.office || "No office"}
                            </td>

                            <td>
                              <strong className="bmi-value">
                                {assessment.bmi > 0
                                  ? assessment.bmi.toFixed(1)
                                  : "N/A"}
                              </strong>
                              <small> kg/m²</small>
                            </td>

                            <td>
                              <span
                                className={`badge ${classificationClass(
                                  assessment.who_classification
                                )}`}
                              >
                                <span className="badge-dot" />
                                {assessment.who_classification}
                              </span>
                            </td>

                            <td>{formatDate(assessment.assessment_date)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>

                  {/* MODERN PAGINATION CONTROLS */}
                  {sortedAssessments.length > itemsPerPage && (
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
                            sortedAssessments.length
                          )}
                        </strong>{" "}
                        of <strong>{sortedAssessments.length}</strong> entries
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
                </>
              )}
            </div>
          </section>

          {/* SYSTEM SUMMARY */}
          <section className="bottom-grid">
            <div className="card system-card">
              <div className="card-header">
                <div>
                  <h3>System Summary</h3>
                  <p>BMI monitoring status</p>
                </div>
              </div>

              <div className="summary-list">
                <div>
                  <span>Assessed Personnel</span>
                  <strong>{uniquePersonnelCount}</strong>
                </div>

                <div>
                  <span>Total Assessments</span>
                  <strong>{totalAssessments}</strong>
                </div>

                <div>
                  <span>Average BMI</span>
                  <strong>{averageBmi}</strong>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}