import { useState, type SyntheticEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { KeyRound, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import "./Login.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

// Landed on from the link in the reset email: /reset-password?token=...
export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "This reset link is invalid or has expired."
        );
      }

      setDone(true);
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
          <h1>Set a new password</h1>
          <p>Choose a new password for your account.</p>
        </div>

        {done ? (
          <div className="login-error" style={{ background: "#ecfdf5", borderColor: "#a7f3d0", color: "#065f46" }}>
            <span className="login-error-icon"><CheckCircle2 size={14} strokeWidth={2} /></span>
            Your password has been reset.{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              style={{ background: "none", border: "none", padding: 0, color: "#065f46", textDecoration: "underline", cursor: "pointer", font: "inherit" }}
            >
              Sign in now
            </button>
          </div>
        ) : (
          <>
            {!token && (
              <div className="login-error">
                <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
                This link is missing its reset token — open it directly from
                the email, or request a new link.
              </div>
            )}

            {error && (
              <div className="login-error">
                <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="new-password">New Password</label>
                <div className="input-with-icon">
                  <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                  <input
                    id="new-password"
                    type="password"
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="input-with-icon">
                  <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                  <input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? (
                  <div className="spinner" />
                ) : (
                  <>Reset Password <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
