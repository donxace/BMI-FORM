import { useEffect, useMemo, useState } from "react";
import "./Analytics.css";

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
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/*
 * ============================================================
 * ANALYTICS PAGE
 * ============================================================
 */

export default function Analytics() {
  const [assessments, setAssessments] =
    useState<Assessment[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * ==========================================================
   * FILTERS
   * ==========================================================
   */

  const [office, setOffice] =
    useState("");

  const [rank, setRank] =
    useState("");

  const [sex, setSex] =
    useState("");

  const [classification, setClassification] =
    useState("");

  const [period, setPeriod] =
    useState("all");

  /*
   * ==========================================================
   * FETCH DATA
   * ==========================================================
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
            "Invalid analytics data returned by server.",
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

              personnel,
            };
          });

        data.sort(
          (a, b) =>
            b.assessment_id -
            a.assessment_id,
        );

        setAssessments(data);
      } catch (err) {
        console.error(
          "ANALYTICS FETCH ERROR:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load analytics.",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, []);

  /*
   * ==========================================================
   * FILTER OPTIONS
   * ==========================================================
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
   * ==========================================================
   * FILTERED DATA
   * ==========================================================
   */

  const filteredAssessments =
    useMemo(() => {
      const now = new Date();

      return assessments.filter(
        (assessment) => {
          const personnel =
            assessment.personnel;

          const assessmentDate =
            new Date(
              assessment.assessment_date,
            );

          const matchesOffice =
            !office ||
            personnel?.office === office;

          const matchesRank =
            !rank ||
            personnel?.rank === rank;

          const matchesSex =
            !sex ||
            personnel?.sex === sex;

          const matchesClassification =
            !classification ||
            assessment.who_classification ===
              classification;

          let matchesPeriod = true;

          if (period === "today") {
            matchesPeriod =
              assessmentDate.toDateString() ===
              now.toDateString();
          }

          if (period === "month") {
            matchesPeriod =
              assessmentDate.getMonth() ===
                now.getMonth() &&
              assessmentDate.getFullYear() ===
                now.getFullYear();
          }

          if (period === "year") {
            matchesPeriod =
              assessmentDate.getFullYear() ===
              now.getFullYear();
          }

          return (
            matchesOffice &&
            matchesRank &&
            matchesSex &&
            matchesClassification &&
            matchesPeriod
          );
        },
      );
    }, [
      assessments,
      office,
      rank,
      sex,
      classification,
      period,
    ]);

  /*
   * ==========================================================
   * CORE ANALYTICS
   * ==========================================================
   */

  const totalAssessments =
    filteredAssessments.length;

  const uniquePersonnel =
    new Set(
      filteredAssessments.map(
        (item) => item.personnel_id,
      ),
    ).size;

  const averageBMI =
    totalAssessments > 0
      ? filteredAssessments.reduce(
          (sum, item) =>
            sum + item.bmi,
          0,
        ) / totalAssessments
      : 0;

  const averageWeight =
    totalAssessments > 0
      ? filteredAssessments.reduce(
          (sum, item) =>
            sum + item.weight,
          0,
        ) / totalAssessments
      : 0;

  const averageHeight =
    totalAssessments > 0
      ? filteredAssessments.reduce(
          (sum, item) =>
            sum + item.height,
          0,
        ) / totalAssessments
      : 0;

  const normalCount =
    filteredAssessments.filter(
      (item) =>
        item.who_classification ===
        "Normal",
    ).length;

  const underweightCount =
    filteredAssessments.filter(
      (item) =>
        item.who_classification ===
        "Underweight",
    ).length;

  const overweightCount =
    filteredAssessments.filter(
      (item) =>
        item.who_classification ===
        "Overweight",
    ).length;

  const obeseCount =
    filteredAssessments.filter(
      (item) =>
        item.who_classification ===
        "Obese",
    ).length;

  const healthyPercentage =
    totalAssessments > 0
      ? (normalCount /
          totalAssessments) *
        100
      : 0;

  const elevatedPercentage =
    totalAssessments > 0
      ? ((overweightCount +
          obeseCount) /
          totalAssessments) *
        100
      : 0;

  /*
   * ==========================================================
   * OFFICE ANALYTICS
   * ==========================================================
   */

  const officeAnalytics = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        bmiTotal: number;
        normal: number;
        overweight: number;
        obese: number;
        underweight: number;
      }
    >();

    filteredAssessments.forEach(
      (assessment) => {
        const officeName =
          assessment.personnel?.office ||
          "Unassigned";

        const existing =
          map.get(officeName) ?? {
            count: 0,
            bmiTotal: 0,
            normal: 0,
            overweight: 0,
            obese: 0,
            underweight: 0,
          };

        existing.count++;
        existing.bmiTotal +=
          assessment.bmi;

        if (
          assessment.who_classification ===
          "Normal"
        ) {
          existing.normal++;
        }

        if (
          assessment.who_classification ===
          "Underweight"
        ) {
          existing.underweight++;
        }

        if (
          assessment.who_classification ===
          "Overweight"
        ) {
          existing.overweight++;
        }

        if (
          assessment.who_classification ===
          "Obese"
        ) {
          existing.obese++;
        }

        map.set(
          officeName,
          existing,
        );
      },
    );

    return Array.from(
      map.entries(),
    )
      .map(([name, value]) => ({
        name,
        ...value,
        averageBMI:
          value.count > 0
            ? value.bmiTotal /
              value.count
            : 0,
      }))
      .sort(
        (a, b) =>
          b.count - a.count,
      );
  }, [filteredAssessments]);

  /*
   * ==========================================================
   * SEX ANALYTICS
   * ==========================================================
   */

  const sexAnalytics = useMemo(() => {
    const map = new Map<
      string,
      {
        count: number;
        bmiTotal: number;
      }
    >();

    filteredAssessments.forEach(
      (assessment) => {
        const sexName =
          assessment.personnel?.sex ||
          "Unknown";

        const existing =
          map.get(sexName) ?? {
            count: 0,
            bmiTotal: 0,
          };

        existing.count++;
        existing.bmiTotal +=
          assessment.bmi;

        map.set(
          sexName,
          existing,
        );
      },
    );

    return Array.from(
      map.entries(),
    ).map(([name, value]) => ({
      name,
      count: value.count,
      averageBMI:
        value.count > 0
          ? value.bmiTotal /
            value.count
          : 0,
    }));
  }, [filteredAssessments]);

  /*
   * ==========================================================
   * RECENT ACTIVITY
   * ==========================================================
   */

  const recentAssessments =
    filteredAssessments.slice(
      0,
      8,
    );

  /*
   * ==========================================================
   * CLEAR FILTERS
   * ==========================================================
   */

  const clearFilters = () => {
    setOffice("");
    setRank("");
    setSex("");
    setClassification("");
    setPeriod("all");
  };

  /*
   * ==========================================================
   * CURRENT DATE
   * ==========================================================
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
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="analytics-page">

      {/* HEADER */}

      <div className="analytics-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Analytics
          </div>

          <h1>
            BMI Analytics
          </h1>

          <p>
            Analyze BMI trends, personnel
            health distributions, and
            organizational health indicators.
          </p>

        </div>

        <div className="analytics-date">

          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>

        </div>

      </div>

      {/* ANALYTICS FILTERS */}

      <section className="analytics-card">

        <div className="section-header">

          <div className="section-title">

            <span className="section-number">
              01
            </span>

            <div>

              <h2>
                Analytics Filters
              </h2>

              <p>
                Adjust the population used
                for the analytics below.
              </p>

            </div>

          </div>

          <button
            className="clear-analytics-button"
            onClick={clearFilters}
          >
            Clear Filters
          </button>

        </div>

        <div className="analytics-filter-grid">

          <div className="analytics-field">

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
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}

            </select>

          </div>

          <div className="analytics-field">

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
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}

            </select>

          </div>

          <div className="analytics-field">

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
                (item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ),
              )}

            </select>

          </div>

          <div className="analytics-field">

            <label>
              CLASSIFICATION
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

          <div className="analytics-field">

            <label>
              PERIOD
            </label>

            <select
              value={period}
              onChange={(event) =>
                setPeriod(
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

      {/* KPI CARDS */}

      <section className="analytics-summary">

        <div className="analytics-summary-card">

          <div className="analytics-icon blue">
            #
          </div>

          <div>

            <span>
              ASSESSMENTS
            </span>

            <strong>
              {totalAssessments}
            </strong>

            <small>
              Filtered records
            </small>

          </div>

        </div>

        <div className="analytics-summary-card">

          <div className="analytics-icon green">
            P
          </div>

          <div>

            <span>
              PERSONNEL
            </span>

            <strong>
              {uniquePersonnel}
            </strong>

            <small>
              Unique personnel
            </small>

          </div>

        </div>

        <div className="analytics-summary-card">

          <div className="analytics-icon teal">
            BMI
          </div>

          <div>

            <span>
              AVERAGE BMI
            </span>

            <strong>
              {averageBMI
                ? averageBMI.toFixed(1)
                : "—"}
            </strong>

            <small>
              Population average
            </small>

          </div>

        </div>

        <div className="analytics-summary-card">

          <div className="analytics-icon green">
            ✓
          </div>

          <div>

            <span>
              NORMAL
            </span>

            <strong>
              {normalCount}
            </strong>

            <small>
              {healthyPercentage.toFixed(
                1,
              )}
              % of assessments
            </small>

          </div>

        </div>

        <div className="analytics-summary-card">

          <div className="analytics-icon orange">
            !
          </div>

          <div>

            <span>
              ELEVATED
            </span>

            <strong>
              {overweightCount +
                obeseCount}
            </strong>

            <small>
              {elevatedPercentage.toFixed(
                1,
              )}
              % overweight/obese
            </small>

          </div>

        </div>

        <div className="analytics-summary-card">

          <div className="analytics-icon purple">
            KG
          </div>

          <div>

            <span>
              AVG. WEIGHT
            </span>

            <strong>
              {averageWeight
                ? averageWeight.toFixed(
                    1,
                  )
                : "—"}
            </strong>

            <small>
              Average kilograms
            </small>

          </div>

        </div>

      </section>

      {/* CLASSIFICATION DISTRIBUTION */}

      <section className="analytics-grid">

        <div className="analytics-card">

          <div className="card-heading">

            <div>

              <h3>
                BMI Classification Distribution
              </h3>

              <p>
                Distribution of personnel
                across BMI categories.
              </p>

            </div>

            <span className="card-tag">
              {totalAssessments} TOTAL
            </span>

          </div>

          <div className="classification-chart">

            <div className="distribution-row">

              <div className="distribution-label">
                <span className="dot underweight" />
                Underweight
              </div>

              <div className="distribution-track">

                <div
                  className="distribution-fill underweight"
                  style={{
                    width: `${
                      totalAssessments
                        ? (underweightCount /
                            totalAssessments) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

              <strong>
                {underweightCount}
              </strong>

            </div>

            <div className="distribution-row">

              <div className="distribution-label">
                <span className="dot normal" />
                Normal
              </div>

              <div className="distribution-track">

                <div
                  className="distribution-fill normal"
                  style={{
                    width: `${
                      totalAssessments
                        ? (normalCount /
                            totalAssessments) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

              <strong>
                {normalCount}
              </strong>

            </div>

            <div className="distribution-row">

              <div className="distribution-label">
                <span className="dot overweight" />
                Overweight
              </div>

              <div className="distribution-track">

                <div
                  className="distribution-fill overweight"
                  style={{
                    width: `${
                      totalAssessments
                        ? (overweightCount /
                            totalAssessments) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

              <strong>
                {overweightCount}
              </strong>

            </div>

            <div className="distribution-row">

              <div className="distribution-label">
                <span className="dot obese" />
                Obese
              </div>

              <div className="distribution-track">

                <div
                  className="distribution-fill obese"
                  style={{
                    width: `${
                      totalAssessments
                        ? (obeseCount /
                            totalAssessments) *
                          100
                        : 0
                    }%`,
                  }}
                />

              </div>

              <strong>
                {obeseCount}
              </strong>

            </div>

          </div>

        </div>

        {/* POPULATION PROFILE */}

        <div className="analytics-card">

          <div className="card-heading">

            <div>

              <h3>
                Population Profile
              </h3>

              <p>
                Average physical measurements.
              </p>

            </div>

          </div>

          <div className="profile-grid">

            <div>
              <span>
                Average BMI
              </span>

              <strong>
                {averageBMI
                  ? averageBMI.toFixed(2)
                  : "—"}
              </strong>

              <small>
                kg/m²
              </small>
            </div>

            <div>
              <span>
                Average Weight
              </span>

              <strong>
                {averageWeight
                  ? averageWeight.toFixed(
                      1,
                    )
                  : "—"}
              </strong>

              <small>
                kilograms
              </small>
            </div>

            <div>
              <span>
                Average Height
              </span>

              <strong>
                {averageHeight
                  ? averageHeight.toFixed(
                      1,
                    )
                  : "—"}
              </strong>

              <small>
                centimeters
              </small>
            </div>

            <div>
              <span>
                Normal Rate
              </span>

              <strong>
                {healthyPercentage.toFixed(
                  1,
                )}
                %
              </strong>

              <small>
                of assessments
              </small>
            </div>

          </div>

        </div>

      </section>

      {/* OFFICE ANALYTICS */}

      <section className="analytics-card">

        <div className="card-heading">

          <div>

            <h3>
              Office Health Analysis
            </h3>

            <p>
              Compare assessment volume and
              average BMI across offices.
            </p>

          </div>

          <span className="card-tag">
            {officeAnalytics.length} OFFICES
          </span>

        </div>

        {officeAnalytics.length ===
        0 ? (

          <div className="analytics-empty">
            No office data available.
          </div>

        ) : (

          <div className="office-table-wrapper">

            <table className="analytics-table">

              <thead>

                <tr>

                  <th>
                    OFFICE
                  </th>

                  <th>
                    ASSESSMENTS
                  </th>

                  <th>
                    AVG. BMI
                  </th>

                  <th>
                    NORMAL
                  </th>

                  <th>
                    OVERWEIGHT
                  </th>

                  <th>
                    OBESE
                  </th>

                </tr>

              </thead>

              <tbody>

                {officeAnalytics.map(
                  (item) => (
                    <tr key={item.name}>

                      <td>
                        <strong>
                          {item.name}
                        </strong>
                      </td>

                      <td>
                        {item.count}
                      </td>

                      <td>

                        <strong className="table-bmi">
                          {item.averageBMI.toFixed(
                            1,
                          )}
                        </strong>

                      </td>

                      <td>

                        <span className="mini-badge normal">
                          {item.normal}
                        </span>

                      </td>

                      <td>

                        <span className="mini-badge overweight">
                          {item.overweight}
                        </span>

                      </td>

                      <td>

                        <span className="mini-badge obese">
                          {item.obese}
                        </span>

                      </td>

                    </tr>
                  ),
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* SEX ANALYTICS + INSIGHTS */}

      <section className="analytics-grid">

        <div className="analytics-card">

          <div className="card-heading">

            <div>

              <h3>
                Sex Distribution
              </h3>

              <p>
                Assessment volume and average
                BMI by sex.
              </p>

            </div>

          </div>

          <div className="sex-list">

            {sexAnalytics.length ===
            0 ? (

              <div className="analytics-empty">
                No sex data available.
              </div>

            ) : (

              sexAnalytics.map(
                (item) => (
                  <div
                    className="sex-row"
                    key={item.name}
                  >

                    <div>

                      <strong>
                        {item.name}
                      </strong>

                      <small>
                        {item.count}{" "}
                        assessment
                        {item.count !== 1
                          ? "s"
                          : ""}
                      </small>

                    </div>

                    <div className="sex-bmi">

                      <span>
                        Average BMI
                      </span>

                      <strong>
                        {item.averageBMI.toFixed(
                          1,
                        )}
                      </strong>

                    </div>

                  </div>
                ),
              )

            )}

          </div>

        </div>

        {/* INSIGHTS */}

        <div className="analytics-card">

          <div className="card-heading">

            <div>

              <h3>
                Health Insights
              </h3>

              <p>
                Key observations from the
                selected population.
              </p>

            </div>

          </div>

          <div className="insight-list">

            <div className="insight-item">

              <span className="insight-icon blue">
                #
              </span>

              <div>

                <strong>
                  Assessment Coverage
                </strong>

                <p>
                  {totalAssessments} assessment
                  {totalAssessments !== 1
                    ? "s"
                    : ""}{" "}
                  recorded for{" "}
                  {uniquePersonnel} unique
                  personnel.
                </p>

              </div>

            </div>

            <div className="insight-item">

              <span className="insight-icon green">
                ✓
              </span>

              <div>

                <strong>
                  Normal BMI
                </strong>

                <p>
                  {healthyPercentage.toFixed(
                    1,
                  )}
                  % of the selected
                  assessments are classified
                  as Normal.
                </p>

              </div>

            </div>

            <div className="insight-item">

              <span className="insight-icon orange">
                !
              </span>

              <div>

                <strong>
                  Elevated BMI
                </strong>

                <p>
                  {elevatedPercentage.toFixed(
                    1,
                  )}
                  % are classified as
                  Overweight or Obese.
                </p>

              </div>

            </div>

            <div className="insight-item">

              <span className="insight-icon purple">
                BMI
              </span>

              <div>

                <strong>
                  Population Average
                </strong>

                <p>
                  The current population
                  average BMI is{" "}
                  {averageBMI
                    ? averageBMI.toFixed(
                        1,
                      )
                    : "not available"}
                  .
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* RECENT ASSESSMENTS */}

      <section className="analytics-card">

        <div className="card-heading">

          <div>

            <h3>
              Recent Assessment Activity
            </h3>

            <p>
              Latest assessment records within
              the selected filters.
            </p>

          </div>

          <span className="card-tag">
            LATEST
          </span>

        </div>

        {loading ? (

          <div className="analytics-loading">

            <div className="analytics-spinner" />

            <p>
              Loading analytics...
            </p>

          </div>

        ) : error ? (

          <div className="analytics-error">

            <strong>
              Unable to load analytics
            </strong>

            <span>
              {error}
            </span>

          </div>

        ) : recentAssessments.length ===
          0 ? (

          <div className="analytics-empty">
            No assessment records match
            the selected filters.
          </div>

        ) : (

          <div className="recent-list">

            {recentAssessments.map(
              (assessment) => {

                const personnel =
                  assessment.personnel;

                return (
                  <div
                    className="recent-row"
                    key={
                      assessment.assessment_id
                    }
                  >

                    <div className="recent-avatar">
                      {personnel?.first_name?.charAt(
                        0,
                      )}
                      {personnel?.surname?.charAt(
                        0,
                      )}
                    </div>

                    <div className="recent-person">

                      <strong>
                        {getFullName(
                          personnel,
                        )}
                      </strong>

                      <small>
                        {personnel?.rank ??
                          "No Rank"}{" "}
                        •{" "}
                        {personnel?.office ??
                          "No Office"}
                      </small>

                    </div>

                    <div className="recent-bmi">

                      <span>
                        BMI
                      </span>

                      <strong>
                        {assessment.bmi.toFixed(
                          1,
                        )}
                      </strong>

                    </div>

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

                    <div className="recent-date">
                      {formatDate(
                        assessment.assessment_date,
                      )}
                    </div>

                  </div>
                );
              },
            )}

          </div>

        )}

      </section>

      {/* FOOTER */}

      <div className="analytics-footer">

        Analytics are calculated from the
        currently selected BMI assessment
        records.

        <strong>
          Data source: BMI Assessment System
        </strong>

      </div>

    </div>
  );
}