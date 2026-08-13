import { useEffect, useMemo, useState } from "react";
import "./Measurement.css";

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
  q: string | null;
  age: number | null;
  sex: string | null;
  office: string | null;
};

function getClassification(bmi: number): Classification {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

function getPNPClassification(bmi: number) {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23) return "Normal";
  if (bmi < 25) return "Overweight";
  if (bmi < 30) return "Obese Class I";
  return "Obese Class II";
}

function getClassificationClass(classification: Classification) {
  return classification.toLowerCase();
}

function getFullName(personnel: Personnel) {
  return [
    personnel.first_name,
    personnel.middle_initial,
    personnel.surname,
  ]
    .filter(Boolean)
    .join(" ");
}

function getInitials(personnel: Personnel) {
  const firstInitial = personnel.first_name?.charAt(0) ?? "";
  const lastInitial = personnel.surname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

export default function Measurement() {
  
  const [savedAssessmentId, setSavedAssessmentId] = useState<number | null>(null);
  const [personnelList, setPersonnelList] = useState<Personnel[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] =
    useState<Personnel | null>(null);

  const [loadingPersonnel, setLoadingPersonnel] = useState(true);
  const [personnelError, setPersonnelError] = useState("");

  const [sessionStarted, setSessionStarted] = useState(false);

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [wrist, setWrist] = useState("");

  const [sessionStatus, setSessionStatus] = useState<
    "Ready" | "Measuring" | "Review"
  >("Ready");

  /*
   * ============================================================
   * LOAD PERSONNEL FROM DATABASE
   * ============================================================
   */

 useEffect(() => {
    const fetchPersonnel = async () => {
      try {
        setLoadingPersonnel(true);
        setPersonnelError("");

        console.log("Fetching personnel...");

        const response = await fetch("http://localhost:3000/personnel");

        console.log("Response status:", response.status);
        console.log("Response OK:", response.ok);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const rawData = await response.json();

        console.log("Raw personnel data:", rawData);
        console.log("Is array:", Array.isArray(rawData));

        const data: Personnel[] = rawData.map((person: any) => ({
          personnel_id: Number(person.personnel_id),
          rfid_uid: person.rfid_uid,
          rank: person.rank,
          surname: person.surname,
          first_name: person.first_name,
          middle_initial: person.middle_initial,
          q: person.q,
          age: person.age,
          sex: person.sex,
          office: person.office,
        }));

        console.log("Converted personnel data:", data);

        setPersonnelList(data);
      } catch (error) {
        console.error("PERSONNEL FETCH ERROR:", error);

        if (error instanceof TypeError) {
          console.error(
            "This is probably a network/CORS/fetch URL problem."
          );
        }

        setPersonnelError(
          error instanceof Error
            ? error.message
            : "Unable to load personnel from the database."
        );
      } finally {
        setLoadingPersonnel(false);
      }
    };

    fetchPersonnel();
  }, []);

  /*
   * ============================================================
   * BMI CALCULATION
   * ============================================================
   */

  const bmi = useMemo(() => {
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (
      !heightValue ||
      !weightValue ||
      heightValue <= 0 ||
      weightValue <= 0
    ) {
      return null;
    }

    const heightMeters = heightValue / 100;

    return weightValue / (heightMeters * heightMeters);
  }, [height, weight]);

  const classification = bmi
    ? getClassification(bmi)
    : null;

  const pnpClassification = bmi
    ? getPNPClassification(bmi)
    : null;

  /*
   * ============================================================
   * IDEAL BODY WEIGHT
   * ============================================================
   *
   * Current placeholder:
   * IBW = 22 × height²
   *
   * Replace this when your approved PNP IBW formula
   * is finalized.
   */

  const ibw = useMemo(() => {
    if (!height) return null;

    const heightValue = Number(height);

    if (!heightValue || heightValue <= 0) {
      return null;
    }

    const heightMeters = heightValue / 100;

    return 22 * heightMeters * heightMeters;
  }, [height]);

  /*
   * ============================================================
   * WEIGHT TO LOSE
   * ============================================================
   */

  const weightToLose = useMemo(() => {
    if (!weight || !ibw) return 0;

    const currentWeight = Number(weight);

    return currentWeight > ibw
      ? currentWeight - ibw
      : 0;
  }, [weight, ibw]);

  /*
   * ============================================================
   * START SESSION
   * ============================================================
   */

  const startSession = () => {
    if (!selectedPersonnel) return;

    setSessionStarted(true);
    setSessionStatus("Measuring");
  };

  /*
   * ============================================================
   * RESET SESSION
   * ============================================================
   */

  const resetSession = () => {
    setSelectedPersonnel(null);

    setSessionStarted(false);

    setHeight("");
    setWeight("");
    setWaist("");
    setHip("");
    setWrist("");

    setSessionStatus("Ready");
  };

  /*
   * ============================================================
   * REVIEW
   * ============================================================
   */

  const handleReview = () => {
    setSessionStatus("Review");
  };

  /*
   * ============================================================
   * SAVE ASSESSMENT
   * ============================================================
   */

  const handleSave = async () => {
    if (!selectedPersonnel) {
      alert("Please select personnel.");
      return;
    }

    if (!bmi) {
      alert("Height and weight are required.");
      return;
    }

    const assessment = {
      personnel_id: selectedPersonnel.personnel_id,

      height: Number(height),

      weight: Number(weight),

      waist: waist
        ? Number(waist)
        : null,

      hip: hip
        ? Number(hip)
        : null,

      wrist: wrist
        ? Number(wrist)
        : null,

      bmi: Number(bmi.toFixed(2)),

      ibw: ibw
        ? Number(ibw.toFixed(2))
        : null,

      weight_to_lose:
        Number(weightToLose.toFixed(2)),

      pnp_classification:
        pnpClassification,

      who_classification:
        classification,

      assessment_date:
        new Date().toISOString().split("T")[0],

      unit_representative: null,

      health_service_representative: null,

      encoder: null,
    };

    console.log("Assessment:", assessment);

    try {
      const response = await fetch(
        "http://localhost:3000/bmi-assessments",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assessment),
        }
      );

      const savedAssessment = await response.json();

      console.log("STATUS:", response.status);
      console.log("SAVED ASSESSMENT:", savedAssessment);

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(savedAssessment)}`
        );
      }

      const assessmentId = savedAssessment.assessment_id;

      if (!assessmentId) {
        throw new Error(
          "Assessment was saved, but no assessment_id was returned."
        );
      }

      console.log("SAVED ASSESSMENT ID:", assessmentId);

      setSavedAssessmentId(assessmentId);

      alert(
        `BMI assessment #${assessmentId} saved successfully.`
      );

      

      resetSession();

    } catch (error) {
      console.error("SAVE BMI ERROR:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Failed to save BMI assessment."
      );
    }
  };

  /*
   * ============================================================
   * FORM COMPLETION
   * ============================================================
   */

  const isComplete =
    Boolean(height) &&
    Boolean(weight) &&
    Boolean(waist) &&
    Boolean(hip) &&
    Boolean(wrist);

  /*
   * ============================================================
   * CURRENT DATE
   * ============================================================
   */

  const assessmentDate =
    new Date().toLocaleDateString(
      "en-US",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    );

  const handlePreview = () => {
  if (!savedAssessmentId) {
    alert("Please save the BMI assessment first.");
    return;
  }

    window.open(
      `http://localhost:3000/health-reports/bmi/${savedAssessmentId}/pdf`,
      "_blank"
    );
  };

  return (
    <div className="measurement-page">

      {/* ======================================================
          PAGE HEADER
      ======================================================= */}

      <div className="measurement-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Measurement
          </div>

          <h1>
            Current Measurement
          </h1>

          <p>
            Conduct and record the current BMI
            assessment session.
          </p>

        </div>

        <div className="session-indicator">

          <span
            className={
              sessionStarted
                ? "indicator-dot active"
                : "indicator-dot"
            }
          />

          {sessionStarted
            ? "Session Active"
            : "No Active Session"}

        </div>

      </div>

      {/* ======================================================
          SESSION PROGRESS
      ======================================================= */}

      <div className="session-progress">

        <div className="progress-step active">

          <span>1</span>

          <div>
            <strong>
              Personnel
            </strong>

            <small>
              Select personnel
            </small>
          </div>

        </div>

        <div className="progress-line" />

        <div
          className={`progress-step ${
            sessionStarted
              ? "active"
              : ""
          }`}
        >

          <span>2</span>

          <div>
            <strong>
              Measurements
            </strong>

            <small>
              Record measurements
            </small>
          </div>

        </div>

        <div className="progress-line" />

        <div
          className={`progress-step ${
            sessionStatus === "Review"
              ? "active"
              : ""
          }`}
        >

          <span>3</span>

          <div>
            <strong>
              Review
            </strong>

            <small>
              Verify results
            </small>
          </div>

        </div>

        <div className="progress-line" />

        <div className="progress-step">

          <span>4</span>

          <div>
            <strong>
              Complete
            </strong>

            <small>
              Save assessment
            </small>
          </div>

        </div>

      </div>

      {/* ======================================================
          MAIN LAYOUT
      ======================================================= */}

      <div className="measurement-layout">

        {/* ====================================================
            LEFT SIDE
        ===================================================== */}

        <div className="measurement-main">

          {/* ==================================================
              PERSONNEL CARD
          =================================================== */}

          <section className="measurement-card">

            <div className="section-header">

              <div>

                <span className="section-number">
                  01
                </span>

                <div>

                  <h2>
                    Personnel Information
                  </h2>

                  <p>
                    Select the personnel for this
                    assessment.
                  </p>

                </div>

              </div>

            </div>

            <div className="personnel-selector">

              <label>
                Personnel
              </label>

              <select
                value={
                  selectedPersonnel
                    ?.personnel_id ?? ""
                }
                onChange={(event) => {

                const id = Number(event.target.value);

                const personnel = personnelList.find(
                  (item) => item.personnel_id === id
                );

                  setSelectedPersonnel(
                    personnel ?? null
                  );

                }}
                disabled={
                  sessionStarted ||
                  loadingPersonnel
                }
              >

                <option value="">

                  {loadingPersonnel
                    ? "Loading personnel..."
                    : "Select personnel..."}

                </option>

                {personnelList.map(
                  (person) => (

                    <option
                      value={
                        person.personnel_id
                      }
                      key={
                        person.personnel_id
                      }
                    >

                      {person.rank} —{" "}
                      {getFullName(person)}

                    </option>

                  )
                )}

              </select>

              {personnelError && (

                <small
                  style={{
                    color: "#dc2626",
                    display: "block",
                    marginTop: "6px",
                  }}
                >
                  {personnelError}
                </small>

              )}

            </div>

            {/* ==============================================
                SELECTED PERSONNEL
            =============================================== */}

            {selectedPersonnel && (

              <div className="personnel-preview">

                <div className="large-avatar">

                  {getInitials(
                    selectedPersonnel
                  )}

                </div>

                <div className="person-details">

                  <h3>

                    {selectedPersonnel.rank}{" "}

                    {getFullName(
                      selectedPersonnel
                    )}

                  </h3>

                  <p>
                    {selectedPersonnel.office ||
                      "No office assigned"}
                  </p>

                  <div className="person-tags">

                    <span>
                      Age:{" "}
                      {selectedPersonnel.age ??
                        "N/A"}
                    </span>

                    <span>
                      Sex:{" "}
                      {selectedPersonnel.sex ??
                        "N/A"}
                    </span>

                    <span>
                      ID:{" "}
                      {String(
                        selectedPersonnel
                          .personnel_id
                      ).padStart(4, "0")}
                    </span>

                    <span>
                      RFID:{" "}
                      {selectedPersonnel.rfid_uid}
                    </span>

                    {selectedPersonnel.q && (

                      <span>
                        Q:{" "}
                        {selectedPersonnel.q}
                      </span>

                    )}

                  </div>

                </div>

              </div>

            )}

            {/* ==============================================
                START SESSION
            =============================================== */}

            {!sessionStarted && (

              <button
                className="start-button"
                disabled={
                  !selectedPersonnel
                }
                onClick={startSession}
              >

                <span>
                  ▶
                </span>

                Start Measurement Session

              </button>

            )}

          </section>

          {/* ==================================================
              BODY MEASUREMENTS
          =================================================== */}

          <section
            className={`measurement-card ${
              !sessionStarted
                ? "disabled-card"
                : ""
            }`}
          >

            <div className="section-header">

              <div>

                <span className="section-number">
                  02
                </span>

                <div>

                  <h2>
                    Body Measurements
                  </h2>

                  <p>
                    Enter the measurements recorded
                    during this session.
                  </p>

                </div>

              </div>

              <span className="live-badge">
                ● LIVE SESSION
              </span>

            </div>

            <div className="measurement-grid">

              {/* HEIGHT */}

              <div className="measurement-input">

                <div className="input-label">

                  <div className="measurement-icon">
                    ↕
                  </div>

                  <div>

                    <label>
                      Height
                    </label>

                    <small>
                      Standing height
                    </small>

                  </div>

                </div>

                <div className="input-wrapper">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={height}
                    onChange={(e) =>
                      setHeight(
                        e.target.value
                      )
                    }
                    disabled={
                      !sessionStarted
                    }
                  />

                  <span>
                    cm
                  </span>

                </div>

              </div>

              {/* WEIGHT */}

              <div className="measurement-input">

                <div className="input-label">

                  <div className="measurement-icon">
                    ⚖
                  </div>

                  <div>

                    <label>
                      Weight
                    </label>

                    <small>
                      Body weight
                    </small>

                  </div>

                </div>

                <div className="input-wrapper">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value
                      )
                    }
                    disabled={
                      !sessionStarted
                    }
                  />

                  <span>
                    kg
                  </span>

                </div>

              </div>

              {/* WAIST */}

              <div className="measurement-input">

                <div className="input-label">

                  <div className="measurement-icon">
                    ◉
                  </div>

                  <div>

                    <label>
                      Waist
                    </label>

                    <small>
                      Waist circumference
                    </small>

                  </div>

                </div>

                <div className="input-wrapper">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={waist}
                    onChange={(e) =>
                      setWaist(
                        e.target.value
                      )
                    }
                    disabled={
                      !sessionStarted
                    }
                  />

                  <span>
                    cm
                  </span>

                </div>

              </div>

              {/* HIP */}

              <div className="measurement-input">

                <div className="input-label">

                  <div className="measurement-icon">
                    ◉
                  </div>

                  <div>

                    <label>
                      Hip
                    </label>

                    <small>
                      Hip circumference
                    </small>

                  </div>

                </div>

                <div className="input-wrapper">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={hip}
                    onChange={(e) =>
                      setHip(
                        e.target.value
                      )
                    }
                    disabled={
                      !sessionStarted
                    }
                  />

                  <span>
                    cm
                  </span>

                </div>

              </div>

              {/* WRIST */}

              <div className="measurement-input">

                <div className="input-label">

                  <div className="measurement-icon">
                    ◉
                  </div>

                  <div>

                    <label>
                      Wrist
                    </label>

                    <small>
                      Wrist circumference
                    </small>

                  </div>

                </div>

                <div className="input-wrapper">

                  <input
                    type="number"
                    placeholder="0.0"
                    value={wrist}
                    onChange={(e) =>
                      setWrist(
                        e.target.value
                      )
                    }
                    disabled={
                      !sessionStarted
                    }
                  />

                  <span>
                    cm
                  </span>

                </div>

              </div>

            </div>

            <div className="measurement-note">

              <span>
                ⓘ
              </span>

              <p>
                Ensure measurements are taken
                using calibrated equipment and
                recorded in the correct units.
              </p>

            </div>

          </section>

          {/* ==================================================
              ACTIONS
          =================================================== */}

          {sessionStarted && (

            <div className="session-actions">

              <button
                className="cancel-button"
                onClick={resetSession}
              >
                Cancel Session
              </button>

              {sessionStatus !==
                "Review" && (

                <button
                  className="review-button"
                  disabled={!isComplete}
                  onClick={handleReview}
                >
                  Review Results →
                </button>

              )}

              {sessionStatus ===
                "Review" && (

                <button
                  className="save-button"
                  disabled={!isComplete}
                  onClick={handleSave}
                >
                  ✓ Save Assessment
                </button>

              )}

            </div>

          )}

        </div>

        {/* ====================================================
            RIGHT SIDE
        ===================================================== */}

        <aside className="measurement-sidebar">
                    {/* ==================================================
              PDF PREVIEW
          =================================================== */}
          <section className="form-preview-card">

            <div className="small-card-header">
              <div>
                <h3>BMI Form</h3>
                <p>PNP Health Service Form</p>
              </div>
            </div>

            {/* FORM PREVIEW */}
            {savedAssessmentId ? (

              <div className="pdf-preview-container">
                <iframe
                  src={`http://localhost:3000/health-reports/bmi/${savedAssessmentId}/pdf`}
                  title="BMI Assessment Form"
                  className="pdf-preview"
                />
              </div>

            ) : (

              <div className="form-preview">

                <div className="preview-logo">
                  PNP
                </div>

                <div className="preview-lines">
                  <span />
                  <span />
                  <span className="long" />
                </div>

                <div className="preview-title">
                  BODY MASS INDEX
                </div>

                <div className="preview-table">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>

                <p className="preview-placeholder">
                  Save an assessment to generate
                  the BMI form.
                </p>

              </div>

            )}


          <button
            className="preview-button"
            disabled={!savedAssessmentId}
            onClick={handlePreview}
          >
            Preview BMI Form
          </button>


          </section>

          {/* ==================================================
              BMI RESULT
          =================================================== */}

          <section className="result-card">

            <div className="result-header">

              <div>

                <span>
                  CURRENT RESULT
                </span>

                <h2>
                  BMI Result
                </h2>

              </div>

              <div className="result-icon">
                BMI
              </div>

            </div>

            {bmi ? (

              <>

                <div className="bmi-result">

                  <strong>
                    {bmi.toFixed(1)}
                  </strong>

                  <span>
                    kg/m²
                  </span>

                </div>

                <div
                  className={`result-classification ${getClassificationClass(
                    classification!
                  )}`}
                >

                  <span className="classification-dot" />

                  {classification}

                </div>

                <div className="result-divider" />

                <div className="result-details">

                  <div>

                    <span>
                      PNP Classification
                    </span>

                    <strong>
                      {pnpClassification}
                    </strong>

                  </div>

                  <div>

                    <span>
                      WHO Classification
                    </span>

                    <strong>
                      {classification}
                    </strong>

                  </div>

                </div>

              </>

            ) : (

              <div className="empty-result">

                <div className="empty-bmi">
                  —
                </div>

                <p>
                  Enter height and weight
                  to calculate BMI.
                </p>

              </div>

            )}

          </section>

          {/* ==================================================
              ADDITIONAL RESULTS
          =================================================== */}

          <section className="additional-card">

            <div className="small-card-header">

              <h3>
                Additional Results
              </h3>

            </div>

            <div className="additional-result">

              <div>

                <span>
                  Ideal Body Weight
                </span>

                <small>
                  Estimated IBW
                </small>

              </div>

              <strong>

                {ibw
                  ? `${ibw.toFixed(1)} kg`
                  : "—"}

              </strong>

            </div>

            <div className="additional-result">

              <div>

                <span>
                  Weight to Lose
                </span>

                <small>
                  Based on IBW
                </small>

              </div>

              <strong>

                {ibw
                  ? `${weightToLose.toFixed(1)} kg`
                  : "—"}

              </strong>

            </div>

          </section>

          {/* ==================================================
              SESSION INFORMATION
          =================================================== */}

          <section className="session-card">

            <div className="small-card-header">

              <h3>
                Session Information
              </h3>

            </div>

            <div className="session-info-row">

              <span>
                Session status
              </span>

              <strong
                className={
                  sessionStarted
                    ? "online"
                    : ""
                }
              >
                {sessionStarted
                  ? "Active"
                  : "Ready"}
              </strong>

            </div>

            <div className="session-info-row">

              <span>
                Measurements
              </span>

              <strong>

                {
                  [
                    height,
                    weight,
                    waist,
                    hip,
                    wrist,
                  ].filter(Boolean).length
                }

                /5

              </strong>

            </div>

            <div className="session-info-row">

              <span>
                Assessment date
              </span>

              <strong>
                {assessmentDate}
              </strong>

            </div>

          </section>

                  ///

        </aside>

      </div>

    </div>
  );
}
