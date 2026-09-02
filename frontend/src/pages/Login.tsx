import { useEffect, useState, type SyntheticEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  KeyRound,
  ArrowRight,
  CheckCircle2,
  UserPlus,
  XCircle,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import "./Login.css";

// Dynamically resolves to 'localhost' or your LAN IP (e.g. 192.168.x.x)
const API_BASE_URL = `http://${window.location.hostname}:3000`;

type LoginMode = "admin" | "personnel";

type PersonnelMethod = "scan" | "badge";

type RfidStatus = "Scanning" | "Found" | "Unclaimed" | "Error";

type ScannedPersonnel = {
  personnel_id: number;
  rfid_uid: string;
  is_claimed: boolean;
  rank: string;
  surname: string;
  first_name: string;
};

type RfidLatestResponse = {
  rfid_uid: string | null;
  personnel: ScannedPersonnel | null;
};

type Rank = {
  rank_id: number;
  rank_name: string;
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
   * PERSONNEL LOGIN (RFID scan OR badge ID + PIN)
   *
   * Two ways in: scan mode mirrors the automatic RFID mode
   * already used on the Measurement page (poll
   * /personnel/rfid/latest until a card is identified), or the
   * badge ID is typed in manually when a scanner isn't handy.
   * Both submit to the same /auth/personnel-login endpoint — the
   * first PIN entered for a badge becomes that badge's PIN.
   * ============================================================
   */

  const [personnelMethod, setPersonnelMethod] =
    useState<PersonnelMethod>("scan");

  const [rfidStatus, setRfidStatus] = useState<RfidStatus>("Scanning");
  const [scannedPersonnel, setScannedPersonnel] =
    useState<ScannedPersonnel | null>(null);

  const [pin, setPin] = useState("");
  const [badgeId, setBadgeId] = useState("");
  const [badgePassword, setBadgePassword] = useState("");
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState("");

  /*
   * ============================================================
   * PERSONNEL SELF-REGISTRATION (claim a provisioned card)
   *
   * An admin provisions a bare rfid_uid ahead of time (Personnel
   * page -> Provision RFID Card). Scanning/typing that UID here
   * shows this form instead of the PIN prompt, since the card
   * has no profile yet.
   * ============================================================
   */

  const [registering, setRegistering] = useState(false);
  const [registerRfidUid, setRegisterRfidUid] = useState("");

  const [availableRanks, setAvailableRanks] = useState<Rank[]>([]);

  const [regRank, setRegRank] = useState("");
  const [regSurname, setRegSurname] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regMiddleInitial, setRegMiddleInitial] = useState("");
  const [regSex, setRegSex] = useState("");
  const [regAge, setRegAge] = useState("");
  const [regOffice, setRegOffice] = useState("");
  const [regPin, setRegPin] = useState("");

  /*
   * ============================================================
   * SIMULATE RFID TAP (TEST — no reader hardware required)
   *
   * Posts to the same public endpoint the real ESP32 RFID
   * reader uses, so the "Scan RFID Card" tab's own poll picks it
   * up within ~1s exactly as if a real card had been tapped.
   * ============================================================
   */

  const [simulateUid, setSimulateUid] = useState("");

  const simulateRfidTap = () => {
    const uid = simulateUid.trim();
    if (!uid) return;

    fetch(`${API_BASE_URL}/personnel/rfid/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rfid_uid: uid }),
    }).catch(() => {});
  };

  const isRegistrationMode =
    (personnelMethod === "scan" && rfidStatus === "Unclaimed") ||
    (personnelMethod === "badge" && registering);

  useEffect(() => {
    if (mode !== "personnel" || availableRanks.length > 0) {
      return;
    }

    fetch(`${API_BASE_URL}/ranks`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: Rank[]) => setAvailableRanks(data))
      .catch(() => {});
  }, [mode, availableRanks.length]);

  useEffect(() => {
    if (mode !== "personnel" || personnelMethod !== "scan") {
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
        setPersonnelError("");

        setRfidStatus(
          data.personnel.is_claimed ? "Found" : "Unclaimed"
        );
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
  }, [mode, personnelMethod]);

  const handlePersonnelSubmit = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setPersonnelError("");

    const rfidUid =
      personnelMethod === "scan"
        ? scannedPersonnel?.rfid_uid
        : badgeId.trim();

    const credential =
      personnelMethod === "scan" ? pin : badgePassword;

    if (personnelMethod === "scan" && !scannedPersonnel) {
      setPersonnelError("Please scan your RFID card first.");
      return;
    }

    if (personnelMethod === "badge" && !badgeId.trim()) {
      setPersonnelError("Please enter your Badge ID.");
      return;
    }

    if (!credential.trim()) {
      setPersonnelError(
        personnelMethod === "scan"
          ? "Please enter your PIN."
          : "Please enter your password."
      );
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
            rfid_uid: rfidUid,
            pin: credential,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const message = errorData?.message || "Invalid PIN.";

        // Provisioned but not yet claimed — switch to registration
        // instead of showing this as a plain login failure.
        if (
          personnelMethod === "badge" &&
          message.includes("has not been registered yet")
        ) {
          setRegisterRfidUid(rfidUid ?? "");
          setRegistering(true);
          setPersonnelError("");
          return;
        }

        throw new Error(message);
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

  const handlePersonnelRegisterSubmit = async (
    e: SyntheticEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setPersonnelError("");

    const rfidUid =
      personnelMethod === "scan"
        ? scannedPersonnel?.rfid_uid
        : registerRfidUid.trim();

    if (!rfidUid) {
      setPersonnelError("Missing RFID UID — please scan or enter it again.");
      return;
    }

    if (!regRank || !regSurname.trim() || !regFirstName.trim()) {
      setPersonnelError(
        "Please fill in your rank, surname, and first name."
      );
      return;
    }

    if (!regPin.trim()) {
      setPersonnelError("Please set a PIN.");
      return;
    }

    try {
      setPersonnelLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/auth/personnel-register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rfid_uid: rfidUid,
            pin: regPin,
            rank: regRank,
            surname: regSurname.trim(),
            first_name: regFirstName.trim(),
            middle_initial: regMiddleInitial.trim() || undefined,
            sex: regSex || undefined,
            age: regAge ? Number(regAge) : undefined,
            office: regOffice.trim() || undefined,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.message || "Unable to complete registration."
        );
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
      console.error("PERSONNEL REGISTER ERROR:", err);
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
                  <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
                  {error}
                </div>
              )}

              <form onSubmit={handleAdminSubmit} className="login-form">
                <div className="form-group">
                  <label htmlFor="username">Username</label>
                  <div className="input-with-icon">
                    <span className="input-icon"><User size={15} strokeWidth={2} /></span>
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
                    <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
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
                    <>Sign In <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="personnel-method-toggle">
                <button
                  type="button"
                  className={
                    personnelMethod === "scan"
                      ? "personnel-method-link active"
                      : "personnel-method-link"
                  }
                  onClick={() => {
                    setPersonnelMethod("scan");
                    setPersonnelError("");
                    setBadgeId("");
                    setBadgePassword("");
                    setRegistering(false);
                    setRegisterRfidUid("");
                  }}
                >
                  Scan RFID Card
                </button>

                <span className="personnel-method-divider">•</span>

                <button
                  type="button"
                  className={
                    personnelMethod === "badge"
                      ? "personnel-method-link active"
                      : "personnel-method-link"
                  }
                  onClick={() => {
                    setPersonnelMethod("badge");
                    setPersonnelError("");
                    setPin("");
                    setRegistering(false);
                    setRegisterRfidUid("");
                  }}
                >
                  Use Badge ID
                </button>
              </div>

              {personnelError && (
                <div className="login-error">
                  <span className="login-error-icon"><AlertTriangle size={14} strokeWidth={2} /></span>
                  {personnelError}
                </div>
              )}

              {personnelMethod === "scan" && (
                <div className={`rfid-scan-panel ${rfidStatus.toLowerCase()}`}>

                  <div className="rfid-scan-visual">
                    <span className="rfid-scan-ring ring-1" />
                    <span className="rfid-scan-ring ring-2" />
                    <span className="rfid-scan-ring ring-3" />

                    <div className="rfid-scan-core">
                      {rfidStatus === "Found" ? (
                        <span className="rfid-scan-check">
                          <CheckCircle2 size={22} strokeWidth={2} />
                        </span>
                      ) : rfidStatus === "Unclaimed" ? (
                        <span className="rfid-scan-card-icon">
                          <UserPlus size={22} strokeWidth={2} />
                        </span>
                      ) : rfidStatus === "Error" ? (
                        <span className="rfid-scan-cross">
                          <XCircle size={22} strokeWidth={2} />
                        </span>
                      ) : (
                        <span className="rfid-scan-card-icon">
                          <CreditCard size={22} strokeWidth={2} />
                        </span>
                      )}
                    </div>
                  </div>

                  <strong>
                    {scannedPersonnel && rfidStatus === "Found"
                      ? `${scannedPersonnel.rank} ${scannedPersonnel.first_name} ${scannedPersonnel.surname}`
                      : rfidStatus === "Unclaimed"
                      ? "New Card Detected"
                      : rfidStatus === "Error"
                      ? "Card Not Recognized"
                      : "Scan Your RFID Card"}
                  </strong>

                  <small>
                    {rfidStatus === "Found"
                      ? "Identity confirmed — enter your PIN below."
                      : rfidStatus === "Unclaimed"
                      ? "This card isn't registered yet — complete your profile below."
                      : rfidStatus === "Error"
                      ? "This card is not registered in the system."
                      : "Hold your card near the scanner..."}
                  </small>
                </div>
              )}

              {personnelMethod === "scan" && !isRegistrationMode && (
                <div className="rfid-simulate-panel">
                  <input
                    type="text"
                    className="rfid-simulate-input"
                    placeholder="No reader handy? Type a Badge ID to simulate a tap"
                    value={simulateUid}
                    onChange={(e) => setSimulateUid(e.target.value)}
                  />
                  <button
                    type="button"
                    className="rfid-simulate-button"
                    onClick={simulateRfidTap}
                    disabled={!simulateUid.trim()}
                  >
                    Simulate Card Tap (Test)
                  </button>
                </div>
              )}

              {isRegistrationMode ? (
                <form
                  onSubmit={handlePersonnelRegisterSubmit}
                  className="login-form"
                >
                  {personnelMethod === "badge" && (
                    <div className="form-group">
                      <label htmlFor="registerRfidUid">Badge ID</label>
                      <div className="input-with-icon">
                        <span className="input-icon"><CreditCard size={15} strokeWidth={2} /></span>
                        <input
                          id="registerRfidUid"
                          type="text"
                          placeholder="Enter the Badge ID printed on your card"
                          value={registerRfidUid}
                          onChange={(e) => setRegisterRfidUid(e.target.value)}
                          disabled={personnelLoading}
                        />
                      </div>
                      <small className="login-hint">
                        This must match a Badge ID your administrator has
                        already provisioned.
                      </small>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="regRank">Rank</label>
                    <select
                      id="regRank"
                      value={regRank}
                      onChange={(e) => setRegRank(e.target.value)}
                      disabled={personnelLoading}
                    >
                      <option value="">Select rank...</option>
                      {availableRanks.map((rank) => (
                        <option key={rank.rank_id} value={rank.rank_name}>
                          {rank.rank_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="reg-field-row">
                    <div className="form-group">
                      <label htmlFor="regSurname">Surname</label>
                      <input
                        id="regSurname"
                        type="text"
                        className="plain-field"
                        placeholder="Surname"
                        value={regSurname}
                        onChange={(e) => setRegSurname(e.target.value)}
                        disabled={personnelLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="regFirstName">First Name</label>
                      <input
                        id="regFirstName"
                        type="text"
                        className="plain-field"
                        placeholder="First name"
                        value={regFirstName}
                        onChange={(e) => setRegFirstName(e.target.value)}
                        disabled={personnelLoading}
                      />
                    </div>
                  </div>

                  <div className="reg-field-row">
                    <div className="form-group">
                      <label htmlFor="regMiddleInitial">M.I.</label>
                      <input
                        id="regMiddleInitial"
                        type="text"
                        className="plain-field"
                        placeholder="M."
                        maxLength={2}
                        value={regMiddleInitial}
                        onChange={(e) => setRegMiddleInitial(e.target.value)}
                        disabled={personnelLoading}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="regSex">Sex</label>
                      <select
                        id="regSex"
                        value={regSex}
                        onChange={(e) => setRegSex(e.target.value)}
                        disabled={personnelLoading}
                      >
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="regAge">Age</label>
                      <input
                        id="regAge"
                        type="number"
                        className="plain-field"
                        min="1"
                        max="120"
                        placeholder="Age"
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value)}
                        disabled={personnelLoading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="regOffice">Office (optional)</label>
                    <input
                      id="regOffice"
                      type="text"
                      className="plain-field"
                      placeholder="Enter office"
                      value={regOffice}
                      onChange={(e) => setRegOffice(e.target.value)}
                      disabled={personnelLoading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="regPin">Set PIN</label>
                    <div className="input-with-icon">
                      <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                      <input
                        id="regPin"
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="Choose a PIN"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value)}
                        disabled={personnelLoading}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={personnelLoading}
                  >
                    {personnelLoading ? (
                      <div className="spinner" />
                    ) : (
                      <>Register & Sign In <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
                    )}
                  </button>

                  {personnelMethod === "badge" && (
                    <button
                      type="button"
                      className="registration-cancel-link"
                      onClick={() => {
                        setRegistering(false);
                        setRegisterRfidUid("");
                        setPersonnelError("");
                      }}
                    >
                      Already registered? Sign in instead
                    </button>
                  )}
                </form>
              ) : (
                <form
                  onSubmit={handlePersonnelSubmit}
                  className="login-form"
                >
                  {personnelMethod === "badge" && (
                    <div className="form-group">
                      <label htmlFor="badgeId">Badge ID</label>
                      <div className="input-with-icon">
                        <span className="input-icon"><CreditCard size={15} strokeWidth={2} /></span>
                        <input
                          id="badgeId"
                          type="text"
                          placeholder="Enter your Badge ID"
                          value={badgeId}
                          onChange={(e) => setBadgeId(e.target.value)}
                          disabled={personnelLoading}
                          autoComplete="username"
                        />
                      </div>
                    </div>
                  )}

                  <div className="form-group">
                    <label htmlFor="personnel-credential">
                      {personnelMethod === "scan" ? "PIN" : "Password"}
                    </label>
                    <div className="input-with-icon">
                      <span className="input-icon"><KeyRound size={15} strokeWidth={2} /></span>
                      {personnelMethod === "scan" ? (
                        <input
                          id="personnel-credential"
                          type="password"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="Enter your PIN"
                          value={pin}
                          onChange={(e) => setPin(e.target.value)}
                          disabled={
                            personnelLoading ||
                            !scannedPersonnel ||
                            rfidStatus !== "Found"
                          }
                        />
                      ) : (
                        <input
                          id="personnel-credential"
                          type="password"
                          placeholder="Enter your password"
                          value={badgePassword}
                          onChange={(e) => setBadgePassword(e.target.value)}
                          disabled={personnelLoading}
                          autoComplete="current-password"
                        />
                      )}
                    </div>
                    <small className="login-hint">
                      {personnelMethod === "scan"
                        ? "First time using this card? The PIN you enter now becomes your PIN."
                        : "New here? Enter your Badge ID above and we'll walk you through registration."}
                    </small>
                  </div>

                  <button
                    type="submit"
                    className="login-button"
                    disabled={
                      personnelLoading ||
                      (personnelMethod === "scan" &&
                        (!scannedPersonnel || rfidStatus !== "Found"))
                    }
                  >
                    {personnelLoading ? (
                      <div className="spinner" />
                    ) : (
                      <>Sign In <span className="login-button-arrow"><ArrowRight size={16} strokeWidth={2} /></span></>
                    )}
                  </button>

                  {personnelMethod === "badge" && (
                    <button
                      type="button"
                      className="registration-cancel-link"
                      onClick={() => {
                        setRegisterRfidUid(badgeId.trim());
                        setRegistering(true);
                        setPersonnelError("");
                      }}
                    >
                      New here? Register with a Badge ID →
                    </button>
                  )}
                </form>
              )}
            </>
          )}

          <div className="login-security-note">
            <span className="login-security-icon"><ShieldCheck size={14} strokeWidth={2} /></span>
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
