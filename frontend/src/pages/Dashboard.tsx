import "./Dashboard.css";

type Assessment = {
  id: number;
  name: string;
  rank: string;
  office: string;
  bmi: number;
  classification: "Normal" | "Underweight" | "Overweight" | "Obese";
  date: string;
};

const recentAssessments: Assessment[] = [
  {
    id: 1,
    name: "Juan Dela Cruz",
    rank: "PCPL",
    office: "PNP Health Service",
    bmi: 22.4,
    classification: "Normal",
    date: "Aug 11, 2026",
  },
  {
    id: 2,
    name: "Maria Santos",
    rank: "PSSG",
    office: "Personnel Division",
    bmi: 27.1,
    classification: "Overweight",
    date: "Aug 11, 2026",
  },
  {
    id: 3,
    name: "Pedro Reyes",
    rank: "PCPT",
    office: "Finance Division",
    bmi: 31.2,
    classification: "Obese",
    date: "Aug 10, 2026",
  },
  {
    id: 4,
    name: "Ana Garcia",
    rank: "PAT",
    office: "Administrative Division",
    bmi: 18.2,
    classification: "Underweight",
    date: "Aug 10, 2026",
  },
];

const bmiDistribution = [
  {
    label: "Underweight",
    count: 38,
    percentage: 12,
  },
  {
    label: "Normal",
    count: 214,
    percentage: 65,
  },
  {
    label: "Overweight",
    count: 52,
    percentage: 16,
  },
  {
    label: "Obese",
    count: 24,
    percentage: 7,
  },
];

function classificationClass(
  classification: Assessment["classification"],
) {
  return classification.toLowerCase();
}

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* MAIN */}
      <main className="main-content">

        <div className="content">

          {/* DATE + ACTIONS */}
          <div className="content-header">

            <div>
              <span className="date-label">
                MONTH OF 
              </span>

              <strong>
                August 11, 2026
              </strong>
            </div>

            <div className="header-actions">

              <button className="secondary-button">
                ⬇ Export Report
              </button>

              <button className="primary-button">
                + New Assessment
              </button>

            </div>

          </div>

          {/* STAT CARDS */}
          <section className="stat-grid">

            <div className="stat-card">

              <div className="stat-top">
                <span>Total Personnel</span>
                <div className="stat-icon blue">
                  ♙
                </div>
              </div>

              <h2>1,245</h2>

              <div className="stat-change positive">
                ↑ 4.8%
                <span>from last month</span>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>Assessments</span>

                <div className="stat-icon purple">
                  ▣
                </div>
              </div>

              <h2>328</h2>

              <div className="stat-change positive">
                ↑ 12.6%
                <span>this month</span>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>Normal BMI</span>

                <div className="stat-icon green">
                  ✓
                </div>
              </div>

              <h2>214</h2>

              <div className="stat-change neutral">
                65.2%
                <span>of assessments</span>
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-top">
                <span>Needs Attention</span>

                <div className="stat-icon orange">
                  !
                </div>
              </div>

              <h2>114</h2>

              <div className="stat-change warning">
                34.8%
                <span>need monitoring</span>
              </div>

            </div>

          </section>

          {/* MAIN DASHBOARD GRID */}
          <section className="dashboard-grid">

            {/* BMI DISTRIBUTION */}
            <div className="card bmi-card">

              <div className="card-header">

                <div>
                  <h3>BMI Distribution</h3>
                  <p>
                    Current assessment classification
                  </p>
                </div>

                <button className="card-menu">
                  ⋮
                </button>

              </div>

              <div className="distribution">

                {bmiDistribution.map((item) => (

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
                        className={`progress-bar ${item.label
                          .toLowerCase()
                          .replace(" ", "-")}`}
                        style={{
                          width: `${item.percentage}%`,
                        }}
                      />

                    </div>

                    <span className="percentage">
                      {item.percentage}%
                    </span>

                  </div>

                ))}

              </div>

            </div>

            {/* QUICK ACTIONS */}
            <div className="card quick-card">

              <div className="card-header">

                <div>
                  <h3>Quick Actions</h3>
                  <p>
                    Frequently used functions
                  </p>
                </div>

              </div>

              <div className="quick-actions">

                <button>
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

                  <span>›</span>
                </button>

                <button>
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

                  <span>›</span>
                </button>

                <button>
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

                  <span>›</span>
                </button>

              </div>

            </div>

          </section>

          {/* RECENT ASSESSMENTS */}
          <section className="card assessments-card">

            <div className="card-header">

              <div>
                <h3>Recent BMI Assessments</h3>

                <p>
                  Latest personnel assessments
                </p>
              </div>

              <button className="view-all">
                View all →
              </button>

            </div>

            <div className="table-container">

              <table>

                <thead>

                  <tr>
                    <th>PERSONNEL</th>
                    <th>RANK</th>
                    <th>OFFICE</th>
                    <th>BMI</th>
                    <th>CLASSIFICATION</th>
                    <th>DATE</th>
                    <th></th>
                  </tr>

                </thead>

                <tbody>

                  {recentAssessments.map(
                    (assessment) => (

                      <tr key={assessment.id}>

                        <td>

                          <div className="person-cell">

                            <div className="person-avatar">
                              {assessment.name
                                .split(" ")
                                .map((word) =>
                                  word[0],
                                )
                                .slice(0, 2)
                                .join("")}
                            </div>

                            <div>
                              <strong>
                                {assessment.name}
                              </strong>

                              <small>
                                Personnel ID #{String(
                                  assessment.id,
                                ).padStart(4, "0")}
                              </small>
                            </div>

                          </div>

                        </td>

                        <td>
                          {assessment.rank}
                        </td>

                        <td>
                          {assessment.office}
                        </td>

                        <td>

                          <strong className="bmi-value">
                            {assessment.bmi}
                          </strong>

                          <small>
                            kg/m²
                          </small>

                        </td>

                        <td>

                          <span
                            className={`badge ${classificationClass(
                              assessment.classification,
                            )}`}
                          >
                            <span className="badge-dot" />
                            {assessment.classification}
                          </span>

                        </td>

                        <td>
                          {assessment.date}
                        </td>

                        <td>

                          <button className="row-menu">
                            ⋮
                          </button>

                        </td>

                      </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>

          </section>

          {/* BOTTOM GRID */}
          <section className="bottom-grid">

            <div className="card">

              <div className="card-header">

                <div>
                  <h3>Assessment Activity</h3>
                  <p>
                    Number of assessments this week
                  </p>
                </div>

                <select>
                  <option>This Week</option>
                  <option>This Month</option>
                  <option>This Year</option>
                </select>

              </div>

              <div className="activity-chart">

                <div className="chart-y">
                  <span>80</span>
                  <span>60</span>
                  <span>40</span>
                  <span>20</span>
                  <span>0</span>
                </div>

                <div className="chart-area">

                  {[45, 62, 38, 75, 55, 68, 82].map(
                    (height, index) => (

                      <div
                        className="chart-column"
                        key={index}
                      >

                        <div
                          className="chart-bar"
                          style={{
                            height: `${height}%`,
                          }}
                        />

                        <span>
                          {
                            [
                              "Mon",
                              "Tue",
                              "Wed",
                              "Thu",
                              "Fri",
                              "Sat",
                              "Sun",
                            ][index]
                          }
                        </span>

                      </div>

                    ),
                  )}

                </div>

              </div>

            </div>

            {/* SYSTEM SUMMARY */}
            <div className="card system-card">

              <div className="card-header">

                <div>
                  <h3>System Summary</h3>
                  <p>
                    BMI monitoring status
                  </p>
                </div>

              </div>

              <div className="summary-list">

                <div>
                  <span>Personnel Records</span>
                  <strong>1,245</strong>
                </div>

                <div>
                  <span>Total Assessments</span>
                  <strong>3,842</strong>
                </div>

                <div>
                  <span>Average BMI</span>
                  <strong>24.8</strong>
                </div>

                <div>
                  <span>Assessments Today</span>
                  <strong>42</strong>
                </div>

              </div>

              <button className="full-report-button">
                View Analytics →
              </button>

            </div>

          </section>

        </div>

      </main>

    </div>
  );
}