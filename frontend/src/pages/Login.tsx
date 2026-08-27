import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

// Dynamically resolves to 'localhost' or your LAN IP (e.g. 192.168.x.x)
const API_BASE_URL = `http://${window.location.hostname}:3000`;

type LoginMode = "admin" | "personnel";

type RfidStatus = "Scanning" | "Found" | "Error";

type ScannedPersonnel = {
  personnel_id: number;
  rfid_uid: string;
  rank: string;
  surname: string;
  first_name: string;
};

type RfidLatestResponse = {
  rfid_uid: string | null;
  personnel: ScannedPersonnel | null;
};

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = useState<LoginMode>("admin");

  /*
   * ============================================================
   * ADMIN LOGIN (unchanged behavior, now also stores role)
   * ============================================================
   */

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAdminSubmit = async (e: SyntheticEvent<HTMLFormElement>) => {
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
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("userRole", data.user?.role ?? "admin");
      }

      navigate("/");
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * ============================================================
   * PERSONNEL LOGIN (RFID scan + PIN)
   *
   * Mirrors the automatic RFID mode already used on the
   * Measurement page: poll /personnel/rfid/latest until a card
   * is identified, then ask for a PIN. The first PIN entered
   * for a card becomes that card's PIN going forward.
   * ============================================================
   */

  const [rfidStatus, setRfidStatus] = useState<RfidStatus>("Scanning");
  const [scannedPersonnel, setScannedPersonnel] =
    useState<ScannedPersonnel | null>(null);

  const [pin, setPin] = useState("");
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState("");

  useEffect(() => {
    if (mode !== "personnel") {
      return;
    }

    setRfidStatus("Scanning");
    setScannedPersonnel(null);
    setPin("");
    setPersonnelError("");

    let cancelled = false;

    const checkRfid = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/personnel/rfid/latest`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          throw new Error(`RFID service HTTP ${response.status}`);
        }

        const data: RfidLatestResponse = await response.json();

        if (cancelled) {
          return;
        }

        if (!data.rfid_uid) {
          setRfidStatus("Scanning");
          setScannedPersonnel(null);
          return;
        }

        if (!data.personnel) {
          setScannedPersonnel(null);
          setRfidStatus("Error");
          setPersonnelError(
            "RFID card is not registered in the personnel database."
          );
          return;
        }

        setScannedPersonnel(data.personnel);
        setRfidStatus("Found");
        setPersonnelError("");
      } catch (err) {
        if (cancelled) {
          return;
        }

        setRfidStatus("Error");
        setPersonnelError(
          err instanceof Error
            ? err.message
            : "Unable to communicate with the RFID scanner."
        );
      }
    };

    checkRfid();

    const interval = window.setInterval(checkRfid, 1000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [mode]);

  const handlePersonnelSubmit = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setPersonnelError("");

    if (!scannedPersonnel) {
      setPersonnelError("Please scan your RFID card first.");
      return;
    }

    if (!pin.trim()) {
      setPersonnelError("Please enter your PIN.");
      return;
    }

    try {
      setPersonnelLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/personnel-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rfid_uid: scannedPersonnel.rfid_uid,
            pin,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Invalid PIN.");
      }

      const data = await response.json();

      localStorage.setItem("authToken", data.token);
      localStorage.setItem("userRole", "personnel");
      localStorage.setItem(
        "personnelName",
        `${data.user.rank} ${data.user.first_name} ${data.user.surname}`
      );

      navigate("/my/records");
    } catch (err) {
      console.error("PERSONNEL LOGIN ERROR:", err);
      setPersonnelError(
        err instanceof Error ? err.message : "An unexpected error occurred."
      );
    } finally {
      setPersonnelLoading(false);
    }
  };

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="login-container">
      <div className="login-card">

        <div className="login-brand-header">
          <img
            src="/PNP-ITMS-BMI-LOGO.png"
            alt="PNP ITMS BMI System"
            className="login-logo"
          />

          <div className="login-badge">PNP AUTOMATED BMI SYSTEM</div>
        </div>

        <div className="login-header">
          <h1>Welcome back</h1>
          <p>Sign in to continue to your dashboard</p>
        </div>

          <div className="login-tabs">
            <button
              type="button"
              className={mode === "admin" ? "login-tab active" : "login-tab"}
              onClick={() => setMode("admin")}
            >
              Administrator
            </button>

            <button
              type="button"
              className={
                mode === "personnel" ? "login-tab active" : "login-tab"
              }
              onClick={() => setMode("personnel")}
            >
              Personnel
            </button>
          </div>

          {mode === "admin" ? (
            <>
              {error && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  {error}
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-with-icon">
                    <span className="input-icon">◈</span>
                    <input
                      id="username"
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
                  <label htmlFor="password">Password</label>
                  <div className="input-with-icon">
                    <span className="input-icon">⚿</span>
                    <input
                      id="password"
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
                    <>Sign In <span className="login-button-arrow">→</span></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              {personnelError && (
                <div className="login-error">
                  <span className="login-error-icon">!</span>
                  {personnelError}
                </div>
              )}

              <div className={`rfid-scan-panel ${rfidStatus.toLowerCase()}`}>

                <div className="rfid-scan-visual">
                  <span className="rfid-scan-ring ring-1" />
                  <span className="rfid-scan-ring ring-2" />
                  <span className="rfid-scan-ring ring-3" />

                  <div className="rfid-scan-core">
                    {rfidStatus === "Found" ? (
                      <span className="rfid-scan-check">✓</span>
                    ) : rfidStatus === "Error" ? (
                      <span className="rfid-scan-cross">✕</span>
                    ) : (
                      <span className="rfid-scan-card-icon">▭</span>
                    )}
                  </div>
                </div>

                <strong>
                  {scannedPersonnel
                    ? `${scannedPersonnel.rank} ${scannedPersonnel.first_name} ${scannedPersonnel.surname}`
                    : rfidStatus === "Error"
                    ? "Card Not Recognized"
                    : "Scan Your RFID Card"}
                </strong>

                <small>
                  {scannedPersonnel
                    ? "Identity confirmed — enter your PIN below."
                    : rfidStatus === "Error"
                    ? "This card is not registered in the system."
                    : "Hold your card near the scanner..."}
                </small>
              </div>

              <form
                onSubmit={handlePersonnelSubmit}
                className="login-form"
              >
                <div className="form-group">
                  <label htmlFor="pin">PIN</label>
                  <div className="input-with-icon">
                    <span className="input-icon">⚿</span>
                    <input
                      id="pin"
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="Enter your PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      disabled={personnelLoading || !scannedPersonnel}
                    />
                  </div>
                  <small className="login-hint">
                    First time using this card? The PIN you enter
                    now becomes your PIN.
                  </small>
                </div>

                <button
                  type="submit"
                  className="login-button"
                  disabled={personnelLoading || !scannedPersonnel}
                >
                  {personnelLoading ? (
                    <div className="spinner" />
                  ) : (
                    <>Sign In <span className="login-button-arrow">→</span></>
                  )}
                </button>
              </form>
            </>
          )}

          <div className="login-security-note">
            <span className="login-security-icon">⛨</span>
            Your credentials are encrypted and never stored in
            plain text.
          </div>

        <div className="login-footer">
          <small>Restricted System • Authorized Personnel Only</small>
        </div>
      </div>
    </div>
  );
}
