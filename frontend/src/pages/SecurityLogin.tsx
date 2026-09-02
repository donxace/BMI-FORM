import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  KeyRound,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import "./Login.css";

// Dynamically resolves to 'localhost' or your LAN IP (e.g. 192.168.x.x)
const API_BASE_URL = `http://${window.location.hostname}:3000`;

/*
 * Standalone login for the Security & Environment domain
 * (Intrusion Detection, Smoke & Temperature). Same backend endpoint
 * and account table as the BMI admin login, but its own page and
 * its own session — see SecurityProtectedRoute for the token key
 * this writes.
 */
export default function SecurityLogin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Invalid credentials. Please try again."
        );
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("securityAuthToken", data.token);
        localStorage.setItem("securityUserRole", data.user?.role ?? "admin");
      }

      navigate("/security");
    } catch (err) {
      console.error("SECURITY LOGIN ERROR:", err);
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

        <div className="login-brand-header">
          <img
            src="/PNP-ITMS-BMI-LOGO.png"
            alt="PNP ITMS Security System"
            className="login-logo"
          />

          <div className="login-badge">FACILITY SECURITY &amp; ENVIRONMENT</div>
        </div>

        <div className="login-header">
          <h1>Security sign-in</h1>
          <p>Sign in to access Intrusion Detection and Smoke &amp; Temperature</p>
        </div>

        {error && (
          <div className="login-error">
            <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="security-username">Username</label>
            <div className="input-with-icon">
              <span className="input-icon"><User size={15} strokeWidth={2} /></span>
              <input
                id="security-username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                autoComplete="username"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="security-password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
              <input
                id="security-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                autoComplete="current-password"
              />
            </div>
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              <div className="spinner" />
            ) : (
              <>Sign In <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
            )}
          </button>
        </form>

      </div>
    </div>
  );
}
