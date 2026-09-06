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

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const totalPages = Math.ceil(records.length / itemsPerPage) || 1;

  const paginatedRecords = records.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const downloadPdf = (assessmentId: number) => {
    /*
     * Navigate directly to the file (Content-Disposition:
     * attachment) instead of a blob + <a download> trick — the
     * download attribute is unreliable on iOS Safari, but a
     * plain navigation to an "attachment" response is handled
     * correctly by both iOS Safari (Share/Save to Files) and
     * Android Chrome (saves to Downloads).
     */
    const token = localStorage.getItem("authToken") ?? "";
    window.open(
      `${API_BASE_URL}/health-reports/bmi/${assessmentId}/pdf?download=true&token=${encodeURIComponent(token)}`,
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
              {paginatedRecords.map((record) => (
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

      {!loading && !error && records.length > itemsPerPage && (
        <div className="pagination-container">
          <div className="pagination-info">
            Showing{" "}
            <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to{" "}
            <strong>
              {Math.min(currentPage * itemsPerPage, records.length)}
            </strong>{" "}
            of <strong>{records.length}</strong> entries
          </div>

          <div className="pagination-controls">
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

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(
                (page) =>
                  page === 1 ||
                  page === totalPages ||
                  Math.abs(page - currentPage) <= 1
              )
              .reduce<(number | string)[]>((acc, page, idx, src) => {
                if (idx > 0 && page - (src[idx - 1] as number) > 1) {
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
              src={`${API_BASE_URL}/health-reports/bmi/${previewId}/pdf?token=${encodeURIComponent(localStorage.getItem("authToken") ?? "")}`}
              title="BMI Assessment Form"
              className="my-records-preview-frame"
            />
          </div>
        </div>
      )}
    </div>
  );
}
