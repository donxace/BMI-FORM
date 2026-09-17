import { useState, type SyntheticEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { User, Mail, KeyRound, ShieldCheck, ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import "./Login.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:3000`;

// Mirrors App.tsx's 5 domain logins — self-registration always grants
// that domain's viewer (read-only) role; see AuthService.register on
// the backend for why full access can't be self-granted this way.
// Mirrors backend's REGISTRATION_KEY_REQUIRED_SYSTEMS (register.dto.ts) —
// which domains require an admin-issued serial key before signup.
const REGISTRATION_KEY_REQUIRED_SYSTEMS = ["pcinfo"];

const SYSTEMS: Array<{
  value: string;
  label: string;
  tokenKey: string;
  roleKey: string;
  redirectPath: string;
}> = [
  { value: "bmi", label: "BMI System", tokenKey: "authToken", roleKey: "userRole", redirectPath: "/dashboard" },
  { value: "inventory", label: "Hardware Inventory", tokenKey: "inventoryAuthToken", roleKey: "inventoryUserRole", redirectPath: "/inventory" },
  { value: "pcinfo", label: "PC Information System", tokenKey: "pcInfoAuthToken", roleKey: "pcInfoUserRole", redirectPath: "/pc-info" },
  { value: "intrusion", label: "Intrusion Detection", tokenKey: "intrusionAuthToken", roleKey: "intrusionUserRole", redirectPath: "/security/intrusion-detection" },
  { value: "environment", label: "Environment Monitoring", tokenKey: "environmentAuthToken", roleKey: "environmentUserRole", redirectPath: "/security/environment-monitoring" },
];

/*
 * Public self-service signup, shared across all 5 domains (one page,
 * a "System" dropdown picks which). Every account created here gets
 * that domain's viewer role only — an existing admin has to promote it
 * (manage-user.js set-role) for editor/admin access.
 */
export default function Register() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselected = searchParams.get("system");
  // ?step=key&username=... lets another page (DomainLogin, when login
  // fails with "This account does not have access to this system" for a
  // keyed system) send someone straight to activation instead of back
  // through account creation. That's a fresh mount of this component, so
  // nothing from a hypothetical "just finished step 1" state carries
  // over — this reads everything it needs from the URL instead.
  const startOnKeyStep = searchParams.get("step") === "key";
  const prefillUsername = searchParams.get("username") ?? "";

  const [system, setSystem] = useState(
    SYSTEMS.some((s) => s.value === preselected) ? preselected! : SYSTEMS[0].value
  );
  const [username, setUsername] = useState(prefillUsername);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [serialKey, setSerialKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [requestingKey, setRequestingKey] = useState(false);
  const [keyRequestSent, setKeyRequestSent] = useState(false);

  // "account": the normal one-step form (or step 1 for a keyed system).
  // "key": step 2 for a keyed system — reached either right after step 1
  // (POST /auth/register came back with requiresKey — see AuthService.
  // register) or via a direct link/redirect (?step=key) for an account
  // that already exists but never activated. Either way this step is
  // self-sufficient — it asks for username/password itself rather than
  // assuming they're already sitting in state — since only
  // POST /auth/registration-keys/activate can actually grant access.
  const [step, setStep] = useState<"account" | "key">(startOnKeyStep ? "key" : "account");
  const [accountCreatedMessage, setAccountCreatedMessage] = useState(
    startOnKeyStep ? "This account exists but doesn't have access to this system yet. Enter your serial key to activate it." : ""
  );

  const requiresSerialKey = REGISTRATION_KEY_REQUIRED_SYSTEMS.includes(system);

  const handleRequestKey = async () => {
    setError("");

    if (!username.trim()) {
      setError("Enter your username above before requesting a key.");
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
      setError("Enter a valid Gmail address above before requesting a key.");
      return;
    }

    try {
      setRequestingKey(true);

      const response = await fetch(`${API_BASE_URL}/auth/registration-keys/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system,
          username: username.trim(),
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message;
        throw new Error(
          Array.isArray(message) ? message.join(" ") : message || "Unable to submit your request."
        );
      }

      setKeyRequestSent(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to submit your request."
      );
    } finally {
      setRequestingKey(false);
    }
  };

  // Step 1: create (or match) the account. For a keyed system, the
  // backend deliberately grants no access here — see AuthService.
  // register — so this never sends a serialKey; there's no field for
  // one anymore. A successful response either logs the user straight in
  // (non-keyed systems) or hands back requiresKey, in which case step 2
  // takes over.
  const handleSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("Please fill in every field.");
      return;
    }

    if (!/^[^\s@]+@gmail\.com$/i.test(email.trim())) {
      setError("Please use a Gmail address (name@gmail.com).");
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

    const selected = SYSTEMS.find((s) => s.value === system)!;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          email: email.trim(),
          password,
          system,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message;
        throw new Error(
          Array.isArray(message)
            ? message.join(" ")
            : message || "Unable to create this account."
        );
      }

      const data = await response.json();

      if (data.requiresKey) {
        setAccountCreatedMessage(data.message ?? "Account created. Enter your serial key to activate access.");
        setStep("key");
        return;
      }

      if (data.token) {
        localStorage.setItem(selected.tokenKey, data.token);
        localStorage.setItem(selected.roleKey, data.user?.role ?? "");
      }

      navigate(selected.redirectPath);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2 (keyed systems only): the account from step 1 already exists
  // with no access — this is the only call that can actually grant it,
  // and it's the only one where a serial key is mandatory (see
  // ActivateRegistrationKeyDto). Re-sends username/password to prove
  // it's the same account, not just anyone who knows a valid key.
  const handleActivateKey = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("Please enter your username and password.");
      return;
    }

    if (!serialKey.trim()) {
      setError("Please enter the serial key provided by your administrator.");
      return;
    }

    const selected = SYSTEMS.find((s) => s.value === system)!;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/registration-keys/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          system,
          serialKey: serialKey.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message;
        throw new Error(
          Array.isArray(message)
            ? message.join(" ")
            : message || "Unable to activate access with that key."
        );
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem(selected.tokenKey, data.token);
        localStorage.setItem(selected.roleKey, data.user?.role ?? "");
      }

      navigate(selected.redirectPath);
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
          <div className="login-badge">CREATE ACCOUNT</div>
        </div>

        <div className="login-header">
          <h1>{step === "key" ? "Activate Access" : "Register"}</h1>
          <p>
            {step === "key"
              ? "Your account has been created. Enter the serial key from your administrator to activate it."
              : "Sign up with your Gmail address to get read-only access to a system."}
          </p>
        </div>

        {error && (
          <div className="login-error">
            <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
            {error}
          </div>
        )}

        {step === "account" ? (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="reg-system">System</label>
              <select
                id="reg-system"
                value={system}
                onChange={(e) => setSystem(e.target.value)}
                disabled={loading}
              >
                {SYSTEMS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {requiresSerialKey && (
                <small className="login-hint">
                  This system needs a serial key from your administrator —
                  you'll be asked for it right after your account is
                  created below.
                </small>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="reg-username">Username</label>
              <div className="input-with-icon">
                <span className="input-icon"><User size={15} strokeWidth={2} /></span>
                <input
                  id="reg-username"
                  type="text"
                  placeholder="Choose a username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-email">Gmail Address</label>
              <div className="input-with-icon">
                <span className="input-icon"><Mail size={15} strokeWidth={2} /></span>
                <input
                  id="reg-email"
                  type="email"
                  placeholder="name@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-password">Password</label>
              <div className="input-with-icon">
                <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                <input
                  id="reg-password"
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
              <label htmlFor="reg-confirm-password">Confirm Password</label>
              <div className="input-with-icon">
                <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                <input
                  id="reg-confirm-password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <small className="login-hint">
              New accounts get read-only (viewer) access. An administrator can
              grant more access afterward.
            </small>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <div className="spinner" />
              ) : (
                <>Create Account <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleActivateKey} className="login-form">
            {accountCreatedMessage && (
              <small className="login-hint">{accountCreatedMessage}</small>
            )}

            <div className="form-group">
              <label htmlFor="reg-key-username">Username</label>
              <div className="input-with-icon">
                <span className="input-icon"><User size={15} strokeWidth={2} /></span>
                <input
                  id="reg-key-username"
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  autoComplete="username"
                  autoFocus={!prefillUsername}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-key-password">Password</label>
              <div className="input-with-icon">
                <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                <input
                  id="reg-key-password"
                  type="password"
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  autoComplete="current-password"
                  autoFocus={!!prefillUsername}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="reg-serial-key">Serial Key</label>
              <div className="input-with-icon">
                <span className="input-icon"><ShieldCheck size={15} strokeWidth={2} /></span>
                <input
                  id="reg-serial-key"
                  type="text"
                  placeholder="e.g. 7F3K-9QXZ-M2LP"
                  value={serialKey}
                  onChange={(e) => setSerialKey(e.target.value)}
                  disabled={loading}
                />
              </div>

              {keyRequestSent ? (
                <small className="login-hint">
                  Request sent — an administrator will email a serial key to
                  the Gmail address you provide below once approved.
                </small>
              ) : (
                <>
                  <small className="login-hint">
                    Don't have a key yet? Enter the Gmail address you
                    registered with and request one.
                  </small>
                  <div className="input-with-icon" style={{ marginTop: 6 }}>
                    <span className="input-icon"><Mail size={15} strokeWidth={2} /></span>
                    <input
                      type="email"
                      placeholder="name@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={requestingKey}
                      autoComplete="email"
                    />
                  </div>
                  <button
                    type="button"
                    className="forgot-password-link"
                    style={{ alignSelf: "flex-start", marginTop: 4 }}
                    onClick={handleRequestKey}
                    disabled={requestingKey}
                  >
                    {requestingKey ? "Requesting…" : "Request Serial Key"}
                  </button>
                </>
              )}
            </div>

            <button type="submit" className="login-button" disabled={loading}>
              {loading ? (
                <div className="spinner" />
              ) : (
                <>Activate Access <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
              )}
            </button>

            <button
              type="button"
              className="forgot-password-link"
              style={{ alignSelf: "center" }}
              onClick={() => {
                setStep("account");
                setError("");
                setSerialKey("");
              }}
              disabled={loading}
            >
              ← Back to account details
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
