import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Hash, CheckCircle2, XCircle, Users } from "lucide-react";
import { findAuthLogsSession, getPageSystems } from "../utils/adminSession";
import "./AuthLogs.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;

const SYSTEM_LABELS: Record<string, string> = {
  bmi: "BMI System",
  inventory: "Hardware Inventory",
  pcinfo: "PC Information",
  intrusion: "Intrusion Detection",
  environment: "Environment Monitoring",
};

function describeSystems(systems: string[]): string {
  const labels = systems.map((s) => SYSTEM_LABELS[s] ?? s);
  if (labels.length === 1) return labels[0];
  return labels.join(" and ");
}

type AuthLog = {
  id: number;
  user_id: number | null;
  username: string | null;
  system: string | null;
  event: string;
  result: string | null;
  computer_name: string | null;
  windows_user: string | null;
  granted_role: string | null;
  ip_address: string | null;
  created_at: string;
};

function isSuccessEvent(event: string): boolean {
  return event.endsWith("_success");
}

// "admin_account_locked" -> "Account Locked", "admin_login_success" -> "Login".
// The leading admin_/personnel_ prefix is redundant with the Type pill
// this replaced, and the trailing _success/_failed is redundant with the
// Status badge, so both are dropped here to keep the column scannable.
function formatEvent(event: string): string {
  return event
    .replace(/^(admin|personnel)_/, "")
    .replace(/_(success|failed)$/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type StatusFilter = "all" | "success" | "failure";

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

/*
 * Reachable by that domain's own "_admin" role, or by the literal
 * 'admin' account (which has no fixed domain of its own) — see
 * SuperAdminRoute in App.tsx. Whoever's viewing, the page only ever
 * shows the domain(s) matching its own path (getPageSystems); the
 * backend enforces that scope server-side, so this is strictly a
 * single-domain (or, for Security & Environment, two-domain) view —
 * never a mixed, cross-domain one.
 */
export default function AuthLogs() {
  const location = useLocation();
  const pageSystems = getPageSystems(location.pathname);

  const [logs, setLogs] = useState<AuthLog[] | null>(null);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const load = async () => {
    setError("");
    try {
      // Prefer this page's own domain session — a lingering login to a
      // different domain must never hijack which token gets used here.
      const session = findAuthLogsSession(pageSystems);
      if (!session) {
        throw new Error(
          "Your session can't view auth logs — sign in with an admin account."
        );
      }

      const systemParam = encodeURIComponent(pageSystems.join(","));
      const response = await fetch(
        `${API_BASE_URL}/auth/logs?limit=200&system=${systemParam}`,
        { headers: { Authorization: `Bearer ${session.token}` } }
      );

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session can't view auth logs — sign in with an admin account."
            : `Failed to load logs (HTTP ${response.status}).`
        );
      }

      const data: AuthLog[] = await response.json();
      setLogs(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load auth logs."
      );
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Only the Security & Environment page spans more than one system —
  // that's the only case where a per-row System column adds anything.
  const showSystemColumn = pageSystems.length > 1;

  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const filteredLogs =
    logs === null
      ? null
      : logs.filter((log) => {
          if (statusFilter === "success") return isSuccessEvent(log.event);
          if (statusFilter === "failure") return !isSuccessEvent(log.event);
          return true;
        });

  const totalCount = logs?.length ?? 0;
  const successCount = logs?.filter((l) => isSuccessEvent(l.event)).length ?? 0;
  const failureCount = totalCount - successCount;
  const uniqueIdentifiers = logs
    ? new Set(logs.map((l) => l.username ?? "(empty)")).size
    : 0;

  return (
    <div className="auth-logs-page">

      {/* ======================================================
          HEADER
      ======================================================= */}

      <div className="auth-logs-header">

        <div>

          <div className="breadcrumb">
            Main Menu / Auth Logs
          </div>

          <h1>
            Authentication Logs
          </h1>

          <p>
            Login attempts for {describeSystems(pageSystems)} — success and
            failure alike.
          </p>

        </div>

        <div className="auth-logs-date">

          <span>
            TODAY
          </span>

          <strong>
            {currentDate}
          </strong>

        </div>

      </div>

      {/* ======================================================
          STATISTICS
      ======================================================= */}

      <section className="auth-logs-summary">

        <button
          type="button"
          className={`auth-logs-stat ${statusFilter === "all" ? "active" : ""}`}
          onClick={() => setStatusFilter("all")}
        >

          <div className="stat-top">
            <span>Total Attempts</span>
            <div className="stat-icon blue">
              <Hash size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>{totalCount}</h2>

          <div className="stat-change neutral">Recorded attempts</div>

        </button>

        <button
          type="button"
          className={`auth-logs-stat ${statusFilter === "success" ? "active" : ""}`}
          onClick={() => setStatusFilter("success")}
        >

          <div className="stat-top">
            <span>Successful</span>
            <div className="stat-icon green">
              <CheckCircle2 size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>{successCount}</h2>

          <div className="stat-change positive">
            {totalCount > 0 ? `${((successCount / totalCount) * 100).toFixed(1)}%` : "0%"}{" "}
            <span>of attempts</span>
          </div>

        </button>

        <button
          type="button"
          className={`auth-logs-stat ${statusFilter === "failure" ? "active" : ""}`}
          onClick={() => setStatusFilter("failure")}
        >

          <div className="stat-top">
            <span>Failed</span>
            <div className="stat-icon red">
              <XCircle size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>{failureCount}</h2>

          <div className="stat-change negative">
            {totalCount > 0 ? `${((failureCount / totalCount) * 100).toFixed(1)}%` : "0%"}{" "}
            <span>of attempts</span>
          </div>

        </button>

        <button
          type="button"
          className="auth-logs-stat"
          onClick={() => setStatusFilter("all")}
        >

          <div className="stat-top">
            <span>Distinct Accounts</span>
            <div className="stat-icon purple">
              <Users size={18} strokeWidth={2} />
            </div>
          </div>

          <h2>{uniqueIdentifiers}</h2>

          <div className="stat-change neutral">Unique identifiers</div>

        </button>

      </section>

      {/* ======================================================
          LOGIN ATTEMPTS
      ======================================================= */}

      <section className="auth-logs-card">

        <div className="section-header">

          <div>
            <span className="section-number">01</span>

            <div>
              <h2>Login Attempts</h2>
              <p>Every recorded sign-in for {describeSystems(pageSystems)}.</p>
            </div>
          </div>

          <span className="record-count">{totalCount} records</span>

        </div>

        <div className="auth-logs-toolbar">
          <button
            className={statusFilter === "all" ? "active" : ""}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          <button
            className={statusFilter === "success" ? "active" : ""}
            onClick={() => setStatusFilter("success")}
          >
            Successful
          </button>
          <button
            className={statusFilter === "failure" ? "active" : ""}
            onClick={() => setStatusFilter("failure")}
          >
            Failed
          </button>
          <button className="refresh-button" onClick={load}>
            Refresh
          </button>
        </div>

        {error ? (
          <div className="auth-logs-error">{error}</div>
        ) : filteredLogs === null ? (
          <div className="auth-logs-loading">
            <div className="loading-spinner" />
            <p>Loading logs…</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="auth-logs-empty">No matching login attempts.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  {showSystemColumn && <th>System</th>}
                  <th>Event</th>
                  <th>Username</th>
                  <th>Computer Name</th>
                  <th>Windows User</th>
                  <th>Role Granted</th>
                  <th>Status</th>
                  <th>Result</th>
                  <th>IP Address</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="auth-logs-mono">
                      {formatDateTime(log.created_at)}
                    </td>
                    {showSystemColumn && (
                      <td>
                        {log.system ? SYSTEM_LABELS[log.system] ?? log.system : "—"}
                      </td>
                    )}
                    <td>
                      <span className="auth-type-pill">{formatEvent(log.event)}</span>
                    </td>
                    <td>{log.username ?? "—"}</td>
                    <td>{log.computer_name ?? "—"}</td>
                    <td>{log.windows_user ?? "—"}</td>
                    <td>{log.granted_role ?? "—"}</td>
                    <td>
                      <span
                        className={`classification-badge ${
                          isSuccessEvent(log.event) ? "success" : "failure"
                        }`}
                      >
                        <span className="classification-dot" />
                        {isSuccessEvent(log.event) ? "Success" : "Failed"}
                      </span>
                    </td>
                    <td className="auth-logs-reason">
                      {log.result ?? "—"}
                    </td>
                    <td className="auth-logs-mono">
                      {log.ip_address ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
