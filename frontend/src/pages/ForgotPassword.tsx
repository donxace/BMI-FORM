import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import "./Login.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * Reachable from every login form's "Forgot password?" link — the
 * `users` table isn't domain-scoped, so one shared page covers all 5.
 * Always shows the same generic success message regardless of whether
 * the identifier actually matched an account (the backend does the
 * same) — this page must never reveal which usernames/emails exist.
 */
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim()) {
      setError("Please enter your username or email.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim() }),
      });

      // Even a non-2xx here just means "something's wrong with the
      // request itself" (e.g. throttled) — it never means "not found",
      // since the backend responds 200 either way.
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Unable to process this request right now."
        );
      }

      setSubmitted(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <button
          type="button"
          className="login-back-button"
          onClick={() => navigate("/login")}
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Back to sign in
        </button>

        <div className="login-brand-header">
          <img
            src="/PNP-ITMS-LOGO.png"
            alt="PNP ITMS"
            className="login-logo"
          />
          <div className="login-badge">PASSWORD RESET</div>
        </div>

        <div className="login-header">
          <h1>Forgot your password?</h1>
          <p>Enter your username or email and we'll send you a reset link.</p>
        </div>

        {submitted ? (
          <div className="login-error" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
            <span className="login-error-icon"><CheckCircle2 size={14} strokeWidth={2} /></span>
            If an account matches that username or email, a reset link has
            been sent to its registered email address. It expires in 30
            minutes.
          </div>
        ) : (
          <>
            {error && (
              <div className="login-error">
                <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="identifier">Username or Email</label>
                <div className="input-with-icon">
                  <span className="input-icon"><Mail size={15} strokeWidth={2} /></span>
                  <input
                    id="identifier"
                    type="text"
                    placeholder="Enter your username or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>Send Reset Link <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
