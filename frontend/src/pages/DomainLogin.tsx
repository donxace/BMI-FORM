import { useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  KeyRound,
  ArrowLeft,
  ArrowRight,
  AlertTriangle,
} from "lucide-react";
import "./Login.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

type DomainLoginProps = {
  /** Badge line above the heading, e.g. "HARDWARE INVENTORY SYSTEM". */
  badgeText: string;
  /** Main heading, e.g. "Inventory sign-in". */
  heading: string;
  /** Subtitle under the heading. */
  subtitle: string;
  /** localStorage key to store the JWT under. */
  tokenKey: string;
  /** localStorage key to store the returned role under. */
  roleKey: string;
  /** Route to send the user to after a successful login. */
  redirectPath: string;
  /** Role(s) this domain expects back from the server, e.g.
   *  "inventory_admin", or ["inventory_admin", "inventory_viewer"] for a
   *  domain with both a full-access and a read-only role. Login still
   *  succeeds and stores the token for any role — RoleProtectedRoute is
   *  what actually enforces the match — but a mismatch shows a clearer
   *  error right away instead of silently bouncing at the next protected
   *  route. */
  expectedRole: string | string[];
  /** Which domain this login belongs to (e.g. "inventory") — tagged onto
   *  every auth-log row from this form, so each system's logs stay
   *  attributable even for a failed attempt with no resolved role yet. */
  system: string;
};

/*
 * One login form, reused for all 5 landing-page domains (BMI, Intrusion
 * Detection, Environment Monitoring, Hardware Inventory, PC Information
 * System). Each instance posts to the same /auth/login endpoint but
 * stores the result under its own domain-specific keys, so the 5
 * sessions never overlap — see RoleProtectedRoute.
 */
export default function DomainLogin({
  badgeText,
  heading,
  subtitle,
  tokenKey,
  roleKey,
  redirectPath,
  expectedRole,
  system,
}: DomainLoginProps) {
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
        body: JSON.stringify({ username, password, system }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Invalid credentials. Please try again."
        );
      }

      const data = await response.json();
      const role = data.user?.role;
      const acceptedRoles = Array.isArray(expectedRole) ? expectedRole : [expectedRole];

      if (role !== "admin" && !acceptedRoles.includes(role)) {
        throw new Error(
          "This account does not have access to this system."
        );
      }

      if (data.token) {
        localStorage.setItem(tokenKey, data.token);
        localStorage.setItem(roleKey, role);
      }

      navigate(redirectPath);
    } catch (err) {
      console.error("DOMAIN LOGIN ERROR:", err);
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
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={15} strokeWidth={1.75} />
          Back to landing page
        </button>

        <div className="login-brand-header">
          <img
            src="/PNP-ITMS-LOGO.png"
            alt="PNP ITMS"
            className="login-logo"
          />

          <div className="login-badge">{badgeText}</div>
        </div>

        <div className="login-header">
          <h1>{heading}</h1>
          <p>{subtitle}</p>
        </div>

        {error && (
          <div className="login-error">
            <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="domain-username">Username</label>
            <div className="input-with-icon">
              <span className="input-icon"><User size={15} strokeWidth={2} /></span>
              <input
                id="domain-username"
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
            <label htmlFor="domain-password">Password</label>
            <div className="input-with-icon">
              <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
              <input
                id="domain-password"
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
