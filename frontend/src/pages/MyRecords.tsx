import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import "./MyRecords.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type AssessmentRecord = {
  assessment_id: number;
  height: string | number;
  weight: string | number;
  bmi: string | number | null;
  pnp_classification: string | null;
  who_classification: string | null;
  assessment_date: string;
  encoder: string | null;
};

export default function MyRecords() {
  const navigate = useNavigate();

  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);

  useEffect(() => {
    const fetchRecords = async () => {
      const token = localStorage.getItem("personnelAuthToken");

      try {
        const response = await fetch(
          `${API_BASE_URL}/bmi-assessments/me`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("personnelAuthToken");
          localStorage.removeItem("personnelUserRole");
          localStorage.removeItem("personnelName");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          throw new Error("Unable to load your records.");
        }

        const data: AssessmentRecord[] = await response.json();
        setRecords(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your records."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecords();
  }, [navigate]);

  const downloadPdf = (assessmentId: number) => {
    /*
     * Navigate directly to the file (Content-Disposition:
     * attachment) instead of a blob + <a download> trick — the
     * download attribute is unreliable on iOS Safari, but a
     * plain navigation to an "attachment" response is handled
     * correctly by both iOS Safari (Share/Save to Files) and
     * Android Chrome (saves to Downloads).
     */
    window.open(
      `${API_BASE_URL}/health-reports/bmi/${assessmentId}/pdf?download=true`,
      "_blank"
    );
  };

  return (
    <div className="my-records-page">
      <div className="my-records-header">
        <h1>My BMI Records</h1>
        <p>Your assessment history recorded by this system.</p>
      </div>

      {loading && <p className="my-records-empty">Loading your records...</p>}

      {error && <p className="my-records-error">{error}</p>}

      {!loading && !error && records.length === 0 && (
        <p className="my-records-empty">
          No assessments recorded yet. Head over to "My Measurement" to
          record your first one.
        </p>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="my-records-table-wrapper">
          <table className="my-records-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Height (cm)</th>
                <th>Weight (kg)</th>
                <th>BMI</th>
                <th>WHO Classification</th>
                <th>PNP Classification</th>
                <th>Recorded By</th>
                <th>PDF</th>
              </tr>
            </thead>

            <tbody>
              {records.map((record) => (
                <tr key={record.assessment_id}>
                  <td>
                    {new Date(record.assessment_date).toLocaleDateString()}
                  </td>
                  <td>{record.height}</td>
                  <td>{record.weight}</td>
                  <td>{record.bmi ?? "—"}</td>
                  <td>{record.who_classification ?? "—"}</td>
                  <td>{record.pnp_classification ?? "—"}</td>
                  <td>{record.encoder ?? "Admin"}</td>
                  <td>
                    <div className="my-records-pdf-actions">
                      <button
                        type="button"
                        className="my-records-preview-button"
                        onClick={() => setPreviewId(record.assessment_id)}
                      >
                        Preview
                      </button>

                      <button
                        type="button"
                        className="my-records-download-button"
                        onClick={() => downloadPdf(record.assessment_id)}
                      >
                        Download
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {previewId && (
        <div
          className="my-records-preview-overlay"
          onClick={() => setPreviewId(null)}
        >
          <div
            className="my-records-preview-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="my-records-preview-header">
              <strong>BMI Assessment Form</strong>

              <button
                type="button"
                className="my-records-preview-close"
                onClick={() => setPreviewId(null)}
              >
                <X size={16} strokeWidth={2} />
              </button>
            </div>

            <iframe
              src={`${API_BASE_URL}/health-reports/bmi/${previewId}/pdf`}
              title="BMI Assessment Form"
              className="my-records-preview-frame"
            />
          </div>
        </div>
      )}
    </div>
  );
}
