import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import "./MyMeasurement.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type Classification = "Underweight" | "Normal" | "Overweight" | "Obese";

function getClassification(bmi: number): Classification {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

type LiveReadingResponse = {
  height: number | null;
  weight: number | null;
  received_at: string | null;
};

type ReadingStatus = "Waiting" | "Receiving";

export default function MyMeasurement() {
  const navigate = useNavigate();

  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [wrist, setWrist] = useState("");

  const [readingStatus, setReadingStatus] =
    useState<ReadingStatus>("Waiting");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [savedResult, setSavedResult] = useState<{
    bmi: number;
    classification: Classification;
  } | null>(null);
  const [savedAssessmentId, setSavedAssessmentId] =
    useState<number | null>(null);

  /*
   * ============================================================
   * AUTOMATED HEIGHT/WEIGHT FROM THE MICROCONTROLLER
   *
   * Starts a measurement session as soon as this page opens, so
   * the ESP32 (polling /bmi-assessments/session/status) begins
   * prompting for/sending height and weight right away. Mirrors
   * the admin Measurement page's live-reading pipeline.
   * ============================================================
   */

  const lastAppliedReadingAt = useRef<string | null>(null);

  useEffect(() => {
    lastAppliedReadingAt.current = null;
    setReadingStatus("Waiting");

    fetch(`${API_BASE_URL}/bmi-assessments/session/start`, {
      method: "POST",
    }).catch((err) => {
      console.error("SESSION START ERROR:", err);
    });

    let cancelled = false;

    const checkReading = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/bmi-assessments/reading/latest`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          return;
        }

        const data: LiveReadingResponse = await response.json();

        if (cancelled || !data.received_at) {
          return;
        }

        if (data.received_at === lastAppliedReadingAt.current) {
          return;
        }

        lastAppliedReadingAt.current = data.received_at;
        setReadingStatus("Receiving");

        if (data.height != null) {
          setHeight(String(data.height));
        }

        if (data.weight != null) {
          setWeight(String(data.weight));
        }
      } catch (err) {
        console.error("LIVE READING POLL ERROR:", err);
      }
    };

    checkReading();

    const interval = window.setInterval(checkReading, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);

      fetch(`${API_BASE_URL}/bmi-assessments/session/end`, {
        method: "POST",
      }).catch((err) => {
        console.error("SESSION END ERROR:", err);
      });
    };
  }, []);

  const previewBmi = useMemo(() => {
    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!heightValue || !weightValue || heightValue <= 0 || weightValue <= 0) {
      return null;
    }

    const heightMeters = heightValue / 100;
    return weightValue / (heightMeters * heightMeters);
  }, [height, weight]);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSavedResult(null);
    setSavedAssessmentId(null);

    const heightValue = Number(height);
    const weightValue = Number(weight);

    if (!heightValue || !weightValue || heightValue <= 0 || weightValue <= 0) {
      setError("Please enter a valid height and weight.");
      return;
    }

    const token = localStorage.getItem("authToken");

    try {
      setSubmitting(true);

      const response = await fetch(`${API_BASE_URL}/bmi-assessments/me`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          height: heightValue,
          weight: weightValue,
          waist: waist ? Number(waist) : null,
          hip: hip ? Number(hip) : null,
          wrist: wrist ? Number(wrist) : null,
        }),
      });

      if (response.status === 401) {
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
        localStorage.removeItem("personnelName");
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Unable to save measurement.");
      }

      const data = await response.json();

      setSavedResult({
        bmi: Number(data.bmi),
        classification: getClassification(Number(data.bmi)),
      });
      setSavedAssessmentId(Number(data.assessment_id));

      setHeight("");
      setWeight("");
      setWaist("");
      setHip("");
      setWrist("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to save measurement."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="my-measurement-page">
      <div className="my-measurement-header">
        <h1>My Measurement</h1>
        <p>
          Step on the device to record your height and weight
          automatically, or enter them manually below.
        </p>
      </div>

      <div className="my-measurement-layout">

      <div className="my-measurement-main">

      <div
        className={`my-measurement-status ${readingStatus.toLowerCase()}`}
      >
        <span className="my-measurement-status-dot" />
        {readingStatus === "Receiving"
          ? "Receiving height and weight data from the device..."
          : "Waiting for height and weight data from the device..."}
      </div>

      <form className="my-measurement-form" onSubmit={handleSubmit}>
        <div className="my-measurement-grid">
          <div className="my-measurement-field">
            <label>Height (cm)*</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="my-measurement-field">
            <label>Weight (kg)*</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="my-measurement-field">
            <label>Waist (cm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Optional"
              value={waist}
              onChange={(e) => setWaist(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="my-measurement-field">
            <label>Hip (cm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Optional"
              value={hip}
              onChange={(e) => setHip(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="my-measurement-field">
            <label>Wrist (cm)</label>
            <input
              type="number"
              min="0"
              step="0.1"
              placeholder="Optional"
              value={wrist}
              onChange={(e) => setWrist(e.target.value)}
              disabled={submitting}
            />
          </div>
        </div>

        {previewBmi != null && (
          <div className="my-measurement-preview">
            Estimated BMI: <strong>{previewBmi.toFixed(2)}</strong> (
            {getClassification(previewBmi)})
          </div>
        )}

        {error && <p className="my-measurement-error">{error}</p>}

        <button
          type="submit"
          className="my-measurement-submit"
          disabled={submitting}
        >
          {submitting ? "Saving..." : "Save Measurement"}
        </button>
      </form>

      {savedResult && (
        <div className="my-measurement-result">
          <strong>Measurement saved!</strong>
          <p>
            Your BMI is <strong>{savedResult.bmi.toFixed(2)}</strong> (
            {savedResult.classification}).
          </p>
        </div>
      )}

      </div>

      <div className="my-measurement-sidebar">

        <div className="my-measurement-pdf-card">
          <div className="my-measurement-pdf-header">
            <strong>BMI Assessment Form</strong>

            {savedAssessmentId && (
              <button
                type="button"
                className="my-measurement-pdf-open"
                onClick={() =>
                  window.open(
                    `${API_BASE_URL}/health-reports/bmi/${savedAssessmentId}/pdf`,
                    "_blank"
                  )
                }
              >
                Open in New Tab
              </button>
            )}
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
            <div className="my-measurement-pdf-placeholder">
              Save a measurement to preview its PDF form here.
            </div>
          )}
        </div>

      </div>

      </div>
    </div>
  );
}
