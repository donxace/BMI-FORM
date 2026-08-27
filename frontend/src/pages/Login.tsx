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
        <div className="login-header">
          <div className="login-badge">PNP BMI SYSTEM</div>
          <h1>Welcome Back</h1>
          <p>Sign in to access assessments and reports</p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={mode === "admin" ? "login-tab active" : "login-tab"}
            onClick={() => setMode("admin")}
          >
            Admin
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
                <span>⚠️ {error}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="username">USERNAME / BADGE ID</label>
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

              <div className="form-group">
                <label htmlFor="password">PASSWORD</label>
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

              <button type="submit" className="login-button" disabled={loading}>
                {loading ? <div className="spinner" /> : "Sign In →"}
              </button>
            </form>
          </>
        ) : (
          <>
            {personnelError && (
              <div className="login-error">
                <span>⚠️ {personnelError}</span>
              </div>
            )}

            <div className="rfid-login-scanner">
              <div className="rfid-login-icon">RFID</div>

              <strong>
                {scannedPersonnel
                  ? `${scannedPersonnel.rank} ${scannedPersonnel.first_name} ${scannedPersonnel.surname}`
                  : "Scan your RFID card"}
              </strong>

              <small>
                {scannedPersonnel
                  ? "Card identified — enter your PIN below."
                  : rfidStatus === "Error"
                  ? "Card not recognized."
                  : "Waiting for a card to be scanned..."}
              </small>
            </div>

            <form
              onSubmit={handlePersonnelSubmit}
              className="login-form"
            >
              <div className="form-group">
                <label htmlFor="pin">PIN</label>
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
                <small className="login-hint">
                  First time using this card? The PIN you enter now
                  becomes your PIN.
                </small>
              </div>

              <button
                type="submit"
                className="login-button"
                disabled={personnelLoading || !scannedPersonnel}
              >
                {personnelLoading ? <div className="spinner" /> : "Sign In →"}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <small>Restricted System • Authorized Personnel Only</small>
        </div>
      </div>
    </div>
  );
}
