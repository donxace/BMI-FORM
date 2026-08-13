import { useEffect, useMemo, useState } from "react";
import "./Measurement.css";

/*
 * ============================================================
 * API CONFIGURATION
 * ============================================================
 *
 * Architecture:
 *
 * ESP32 + RFID Reader
 *        ↓
 * POST /personnel/rfid
 *        ↓
 * NestJS Backend
 *        ↓
 * GET /personnel/rfid/latest
 *        ↓
 * React Measurement Page
 *
 * React NEVER connects directly to the ESP32.
 * The ESP32 communicates with NestJS.
 * ============================================================
 */

const API_BASE_URL = "http://localhost:3000";

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

type PersonnelMode = "manual" | "automatic";

type RFIDStatus =
  | "Waiting"
  | "Scanning"
  | "Found"
  | "Error";

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

type RFIDResponse = {
  rfid_uid?: string | null;
  personnel?: Personnel | null;
};

/*
 * ============================================================
 * BMI CLASSIFICATION
 * ============================================================
 */

function getClassification(
  bmi: number
): Classification {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";

  return "Obese";
}

/*
 * ============================================================
 * PNP BMI CLASSIFICATION
 * ============================================================
 */

function getPNPClassification(
  bmi: number
): string {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 23) return "Normal";
  if (bmi < 25) return "Overweight";
  if (bmi < 30) return "Obese Class I";

  return "Obese Class II";
}

/*
 * ============================================================
 * CLASSIFICATION CSS CLASS
 * ============================================================
 */

function getClassificationClass(
  classification: Classification
): string {
  return classification.toLowerCase();
}

/*
 * ============================================================
 * PERSONNEL NAME
 * ============================================================
 */

function getFullName(
  personnel: Personnel
): string {
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
 * PERSONNEL INITIALS
 * ============================================================
 */

function getInitials(
  personnel: Personnel
): string {
  const firstInitial =
    personnel.first_name?.charAt(0) ?? "";

  const lastInitial =
    personnel.surname?.charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase();
}

/*
 * ============================================================
 * MAIN COMPONENT
 * ============================================================
 */

export default function Measurement() {
  /*
   * ============================================================
   * PERSONNEL
   * ============================================================
   */

  const [
    personnelList,
    setPersonnelList,
  ] = useState<Personnel[]>([]);

  const [
    selectedPersonnel,
    setSelectedPersonnel,
  ] = useState<Personnel | null>(null);

  const [
    loadingPersonnel,
    setLoadingPersonnel,
  ] = useState(true);

  const [
    personnelError,
    setPersonnelError,
  ] = useState("");

  /*
   * ============================================================
   * PERSONNEL IDENTIFICATION MODE
   *
   * MANUAL:
   * User selects personnel from the dropdown.
   *
   * AUTOMATIC:
   * ESP32 reads RFID.
   *
   * ESP32 sends RFID UID to NestJS.
   *
   * React polls NestJS for the latest RFID scan.
   *
   * React does NOT communicate directly with ESP32.
   * ============================================================
   */

  const [
    personnelMode,
    setPersonnelMode,
  ] = useState<PersonnelMode>("manual");

  const [
    rfidStatus,
    setRfidStatus,
  ] = useState<RFIDStatus>("Waiting");

  const [
    rfidUid,
    setRfidUid,
  ] = useState("");

  const [
    rfidError,
    setRfidError,
  ] = useState("");

  /*
   * ============================================================
   * SESSION
   * ============================================================
   */

  const [
    sessionStarted,
    setSessionStarted,
  ] = useState(false);

  const [
    sessionStatus,
    setSessionStatus,
  ] = useState<
    "Ready" | "Measuring" | "Review"
  >("Ready");

  /*
   * ============================================================
   * MEASUREMENTS
   * ============================================================
   */

  const [height, setHeight] =
    useState("");

  const [weight, setWeight] =
    useState("");

  const [waist, setWaist] =
    useState("");

  const [hip, setHip] =
    useState("");

  const [wrist, setWrist] =
    useState("");

  /*
   * ============================================================
   * SAVED ASSESSMENT
   * ============================================================
   */

  const [
    savedAssessmentId,
    setSavedAssessmentId,
  ] = useState<number | null>(null);

  /*
   * ============================================================
   * LOAD PERSONNEL FROM DATABASE
   * ============================================================
   */

  useEffect(() => {
    const fetchPersonnel =
      async () => {
        try {
          setLoadingPersonnel(true);
          setPersonnelError("");

          console.log(
            "Fetching personnel..."
          );

          const response =
            await fetch(
              `${API_BASE_URL}/personnel`
            );

          console.log(
            "Personnel response:",
            response.status
          );

          if (!response.ok) {
            throw new Error(
              `HTTP ${response.status}`
            );
          }

          const rawData =
            await response.json();

          if (!Array.isArray(rawData)) {
            throw new Error(
              "Personnel API did not return an array."
            );
          }

          const data: Personnel[] =
            rawData.map(
              (person: any) => ({
                personnel_id: Number(
                  person.personnel_id
                ),

                rfid_uid:
                  person.rfid_uid ?? "",

                rank:
                  person.rank ?? "",

                surname:
                  person.surname ?? "",

                first_name:
                  person.first_name ?? "",

                middle_initial:
                  person.middle_initial ??
                  null,

                q:
                  person.q ?? null,

                age:
                  person.age !== null &&
                  person.age !== undefined
                    ? Number(person.age)
                    : null,

                sex:
                  person.sex ?? null,

                office:
                  person.office ?? null,
              })
            );

          console.log(
            "Personnel loaded:",
            data
          );

          setPersonnelList(data);
        } catch (error) {
          console.error(
            "PERSONNEL FETCH ERROR:",
            error
          );

          setPersonnelError(
            error instanceof Error
              ? error.message
              : "Unable to load personnel."
          );
        } finally {
          setLoadingPersonnel(false);
        }
      };

    fetchPersonnel();
  }, []);

  /*
   * ============================================================
   * RFID AUTOMATIC PERSONNEL DETECTION
   * ============================================================
   *
   * IMPORTANT:
   *
   * React does NOT detect the ESP32 directly.
   *
   * The actual communication is:
   *
   * RFID Reader
   *      ↓
   * ESP32
   *      ↓
   * POST /personnel/rfid
   *      ↓
   * NestJS
   *      ↓
   * GET /personnel/rfid/latest
   *      ↓
   * React
   *
   * The ESP32 must therefore send the RFID UID
   * to the NestJS backend.
   *
   * Expected NestJS response:
   *
   * {
   *   "rfid_uid": "RFID001",
   *   "personnel": {
   *      ...
   *   }
   * }
   *
   * ============================================================
   */

  useEffect(() => {
    if (personnelMode !== "automatic") {
      setRfidStatus("Waiting");
      setRfidError("");
      return;
    }

    setRfidStatus("Scanning");
    setRfidError("");
    setSelectedPersonnel(null);
    setRfidUid("");

    let cancelled = false;

    const checkRFID =
      async () => {
        try {
          const response =
            await fetch(
              `${API_BASE_URL}/personnel/rfid/latest`,
              {
                method: "GET",
                headers: {
                  Accept:
                    "application/json",
                },
                cache: "no-store",
              }
            );

          if (!response.ok) {
            throw new Error(
              `RFID service HTTP ${response.status}`
            );
          }

          const data: RFIDResponse =
            await response.json();

          if (cancelled) {
            return;
          }

          /*
           * No RFID scan has been received
           * from the ESP32 yet.
           */

          if (!data.rfid_uid) {
            setRfidStatus("Scanning");
            setRfidUid("");
            setSelectedPersonnel(null);
            return;
          }

          /*
           * RFID UID received from NestJS.
           */

          setRfidUid(data.rfid_uid);

          /*
           * RFID was received but the UID
           * does not belong to a registered
           * personnel.
           */

          if (!data.personnel) {
            setSelectedPersonnel(null);

            setRfidStatus("Error");

            setRfidError(
              "RFID card is not registered in the personnel database."
            );

            return;
          }

          /*
           * Personnel successfully identified.
           */

          setSelectedPersonnel(
            data.personnel
          );

          setRfidStatus("Found");

          setRfidError("");

          console.log(
            "RFID PERSONNEL FOUND:",
            data.personnel
          );
        } catch (error) {
          if (cancelled) {
            return;
          }

          console.error(
            "RFID DETECTION ERROR:",
            error
          );

          setRfidStatus("Error");

          setRfidError(
            error instanceof Error
              ? error.message
              : "Unable to communicate with RFID service."
          );
        }
      };

    /*
     * Check immediately.
     */

    checkRFID();

    /*
     * Continue checking every second.
     */

    const interval =
      window.setInterval(
        checkRFID,
        1000
      );

    return () => {
      cancelled = true;

      window.clearInterval(
        interval
      );
    };
  }, [personnelMode]);

  /*
   * ============================================================
   * BMI CALCULATION
   * ============================================================
   */

  const bmi = useMemo(() => {
    const heightValue =
      Number(height);

    const weightValue =
      Number(weight);

    if (
      !heightValue ||
      !weightValue ||
      heightValue <= 0 ||
      weightValue <= 0
    ) {
      return null;
    }

    const heightMeters =
      heightValue / 100;

    return (
      weightValue /
      (heightMeters *
        heightMeters)
    );
  }, [height, weight]);

  const classification =
    bmi !== null
      ? getClassification(bmi)
      : null;

  const pnpClassification =
    bmi !== null
      ? getPNPClassification(bmi)
      : null;

  /*
   * ============================================================
   * IDEAL BODY WEIGHT
   *
   * IBW = 22 × height²
   * ============================================================
   */

  const ibw = useMemo(() => {
    if (!height) {
      return null;
    }

    const heightValue =
      Number(height);

    if (
      !heightValue ||
      heightValue <= 0
    ) {
      return null;
    }

    const heightMeters =
      heightValue / 100;

    return (
      22 *
      heightMeters *
      heightMeters
    );
  }, [height]);

  /*
   * ============================================================
   * WEIGHT TO LOSE
   * ============================================================
   */

  const weightToLose =
    useMemo(() => {
      if (!weight || !ibw) {
        return 0;
      }

      const currentWeight =
        Number(weight);

      return currentWeight > ibw
        ? currentWeight - ibw
        : 0;
    }, [weight, ibw]);

  /*
   * ============================================================
   * MANUAL PERSONNEL SELECTION
   * ============================================================
   */

  const handleManualPersonnelChange =
    (personnelId: number) => {
      const personnel =
        personnelList.find(
          (item) =>
            item.personnel_id ===
            personnelId
        );

      setSelectedPersonnel(
        personnel ?? null
      );
    };

  /*
   * ============================================================
   * CHANGE PERSONNEL MODE
   * ============================================================
   */

  const handlePersonnelModeChange =
    (mode: PersonnelMode) => {
      if (sessionStarted) {
        return;
      }

      setPersonnelMode(mode);

      setSelectedPersonnel(null);

      setRfidUid("");

      setRfidError("");

      setRfidStatus(
        mode === "automatic"
          ? "Scanning"
          : "Waiting"
      );
    };

  /*
   * ============================================================
   * START SESSION
   * ============================================================
   */

  const startSession = () => {
    if (!selectedPersonnel) {
      alert(
        "Please identify personnel first."
      );

      return;
    }

    if (
      personnelMode ===
        "automatic" &&
      rfidStatus !== "Found"
    ) {
      alert(
        "Please scan a registered RFID card first."
      );

      return;
    }

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

    setRfidUid("");

    setRfidError("");

    setRfidStatus(
      personnelMode === "automatic"
        ? "Scanning"
        : "Waiting"
    );

    setSavedAssessmentId(null);
  };

  /*
   * ============================================================
   * REVIEW
   * ============================================================
   */

  const handleReview = () => {
    if (!selectedPersonnel) {
      alert(
        "Please identify personnel first."
      );

      return;
    }

    if (!height || !weight) {
      alert(
        "Height and weight are required."
      );

      return;
    }

    setSessionStatus("Review");
  };

  /*
   * ============================================================
   * SAVE ASSESSMENT
   * ============================================================
   */

  const handleSave = async () => {
    if (!selectedPersonnel) {
      alert(
        "Please select or identify personnel."
      );

      return;
    }

    if (bmi === null) {
      alert(
        "Height and weight are required."
      );

      return;
    }

    const assessment = {
      personnel_id:
        selectedPersonnel.personnel_id,

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

      bmi: Number(
        bmi.toFixed(2)
      ),

      ibw: ibw
        ? Number(
            ibw.toFixed(2)
          )
        : null,

      weight_to_lose:
        Number(
          weightToLose.toFixed(2)
        ),

      pnp_classification:
        pnpClassification,

      who_classification:
        classification,

      assessment_date:
        new Date()
          .toISOString()
          .split("T")[0],

      unit_representative:
        null,

      health_service_representative:
        null,

      encoder: null,
    };

    console.log(
      "Saving assessment:",
      assessment
    );

    try {
      const response =
        await fetch(
          `${API_BASE_URL}/bmi-assessments`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify(
              assessment
            ),
          }
        );

      const savedAssessment =
        await response.json();

      console.log(
        "STATUS:",
        response.status
      );

      console.log(
        "SAVED ASSESSMENT:",
        savedAssessment
      );

      if (!response.ok) {
        throw new Error(
          `HTTP ${response.status}: ${JSON.stringify(
            savedAssessment
          )}`
        );
      }

      const assessmentId =
        Number(
          savedAssessment.assessment_id
        );

      if (!assessmentId) {
        throw new Error(
          "Assessment was saved, but no assessment_id was returned."
        );
      }

      setSavedAssessmentId(
        assessmentId
      );

      alert(
        `BMI assessment #${assessmentId} saved successfully.`
      );

      setSessionStarted(false);

      setSessionStatus("Ready");
    } catch (error) {
      console.error(
        "SAVE BMI ERROR:",
        error
      );

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

  /*
   * ============================================================
   * PDF PREVIEW
   * ============================================================
   */

  const handlePreview = () => {
    if (!savedAssessmentId) {
      alert(
        "Please save the BMI assessment first."
      );

      return;
    }

    window.open(
      `${API_BASE_URL}/health-reports/bmi/${savedAssessmentId}/pdf`,
      "_blank"
    );
  };

  /*
   * ============================================================
   * RFID STATUS TEXT
   * ============================================================
   */

  const getRFIDStatusText = () => {
    switch (rfidStatus) {
      case "Scanning":
        return "Waiting for RFID card...";

      case "Found":
        return "Personnel identified successfully.";

      case "Error":
        return (
          rfidError ||
          "Unable to identify RFID card."
        );

      default:
        return "RFID scanner ready.";
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

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
            Conduct and record the current
            BMI assessment session.
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
              Identify personnel
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
                    Select personnel manually
                    or identify them using RFID.
                  </p>

                </div>

              </div>

            </div>

            {/* ==================================================
                PERSONNEL MODE
            =================================================== */}

            <div className="personnel-mode">

              <label>
                Identification Mode
              </label>

              <div className="mode-buttons">

                <button
                  type="button"
                  className={
                    personnelMode ===
                    "manual"
                      ? "mode-button active"
                      : "mode-button"
                  }
                  disabled={
                    sessionStarted
                  }
                  onClick={() =>
                    handlePersonnelModeChange(
                      "manual"
                    )
                  }
                >

                  <span>
                    👤
                  </span>

                  Manual

                </button>

                <button
                  type="button"
                  className={
                    personnelMode ===
                    "automatic"
                      ? "mode-button active"
                      : "mode-button"
                  }
                  disabled={
                    sessionStarted
                  }
                  onClick={() =>
                    handlePersonnelModeChange(
                      "automatic"
                    )
                  }
                >

                  <span>
                    📡
                  </span>

                  RFID Automatic

                </button>

              </div>

            </div>

            {/* ==================================================
                MANUAL PERSONNEL SELECTION
            =================================================== */}

            {personnelMode ===
              "manual" && (

              <div className="personnel-selector">

                <label>
                  Personnel
                </label>

                <select
                  value={
                    selectedPersonnel
                      ?.personnel_id ??
                    ""
                  }
                  onChange={(event) => {

                    const id =
                      Number(
                        event.target.value
                      );

                    handleManualPersonnelChange(
                      id
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
                        {getFullName(
                          person
                        )}

                      </option>

                    )
                  )}

                </select>

                {personnelError && (

                  <small
                    style={{
                      color:
                        "#dc2626",
                      display:
                        "block",
                      marginTop:
                        "6px",
                    }}
                  >
                    {personnelError}
                  </small>

                )}

              </div>

            )}

            {/* ==================================================
                AUTOMATIC RFID MODE
            =================================================== */}

            {personnelMode ===
              "automatic" && (

              <div className="rfid-scanner">

                <div className="rfid-scanner-icon">
                  RFID
                </div>

                <h3>

                  {rfidStatus ===
                  "Found"
                    ? "Personnel Identified"
                    : "Scan RFID Card"}

                </h3>

                <p>
                  {getRFIDStatusText()}
                </p>

                {rfidUid && (

                  <div className="rfid-uid">

                    <span>
                      RFID UID
                    </span>

                    <strong>
                      {rfidUid}
                    </strong>

                  </div>

                )}

                <div
                  className={`rfid-status ${rfidStatus.toLowerCase()}`}
                >

                  <span className="rfid-status-dot" />

                  {rfidStatus}

                </div>

                {rfidStatus ===
                  "Error" &&
                  rfidError && (

                  <div className="rfid-error">
                    {rfidError}
                  </div>

                )}

              </div>

            )}

            {/* ==================================================
                SELECTED PERSONNEL
            =================================================== */}

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
                      ).padStart(
                        4,
                        "0"
                      )}
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

            {/* ==================================================
                START SESSION
            =================================================== */}

            {!sessionStarted && (

              <button
                className="start-button"
                disabled={
                  !selectedPersonnel
                }
                onClick={
                  startSession
                }
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

              {sessionStarted && (

                <span className="live-badge">
                  ● LIVE SESSION
                </span>

              )}

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
                    min="0"
                    step="0.1"
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
                    min="0"
                    step="0.1"
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
                    min="0"
                    step="0.1"
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
                    min="0"
                    step="0.1"
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
                    min="0"
                    step="0.1"
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
                onClick={
                  resetSession
                }
              >
                Cancel Session
              </button>

              {sessionStatus !==
                "Review" && (

                <button
                  className="review-button"
                  disabled={
                    !isComplete
                  }
                  onClick={
                    handleReview
                  }
                >
                  Review Results →
                </button>

              )}

              {sessionStatus ===
                "Review" && (

                <button
                  className="save-button"
                  disabled={
                    !isComplete
                  }
                  onClick={
                    handleSave
                  }
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

                <h3>
                  BMI Form
                </h3>

                <p>
                  PNP Health Service Form
                </p>

              </div>

            </div>

            {savedAssessmentId ? (

              <div className="pdf-preview-container">

                <iframe
                  src={`${API_BASE_URL}/health-reports/bmi/${savedAssessmentId}/pdf`}
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
              disabled={
                !savedAssessmentId
              }
              onClick={
                handlePreview
              }
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

            {bmi !== null ? (

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
                  className={`result-classification ${
                    getClassificationClass(
                      classification!
                    )
                  }`}
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
                  ? `${ibw.toFixed(
                      1
                    )} kg`
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
                  ? `${weightToLose.toFixed(
                      1
                    )} kg`
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
                Personnel mode
              </span>

              <strong>
                {personnelMode ===
                "automatic"
                  ? "RFID Automatic"
                  : "Manual"}
              </strong>

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
                Personnel
              </span>

              <strong>

                {selectedPersonnel
                  ? getFullName(
                      selectedPersonnel
                    )
                  : "Not selected"}

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
                  ].filter(Boolean)
                    .length
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

        </aside>

      </div>

    </div>
  );
}