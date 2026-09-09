import { useEffect, useState } from "react";
import { KeyRound, Copy, Ban, RefreshCw, Check, X, Mail } from "lucide-react";
import "./AuthLogs.css";

const API_BASE_URL = `http://${window.location.hostname}:3000`;
const SYSTEM = "pcinfo";

type PcInfoUser = {
  id: number;
  username: string;
  email: string | null;
  role: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  pcinfo_admin: "Admin",
  pcinfo_editor: "Editor",
  pcinfo_viewer: "Viewer",
};

type RegistrationKey = {
  id: number;
  code: string;
  system: string;
  created_by: string | null;
  used_by: string | null;
  used_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

type RegistrationKeyRequest = {
  id: number;
  system: string;
  username: string;
  email: string;
  status: "pending" | "fulfilled" | "rejected";
  created_at: string;
};

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem("pcInfoAuthToken")}` };
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusOf(key: RegistrationKey): { label: string; className: string } {
  if (key.used_at) return { label: "Used", className: "auth-type-pill" };
  if (key.revoked_at) return { label: "Revoked", className: "auth-type-pill" };
  return { label: "Available", className: "auth-type-pill" };
}

/*
 * PC Info admin-only page (see App.tsx's RoleProtectedRoute for this
 * route — pcinfo_admin, or the literal 'admin', only). Generates and
 * tracks the one-time serial keys /register requires for the PC
 * Information System, so an admin can hand one out per approved
 * registrant instead of leaving signup fully open.
 */
export default function PcInfoRegistrationKeys() {
  const [keys, setKeys] = useState<RegistrationKey[] | null>(null);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [justGenerated, setJustGenerated] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [requests, setRequests] = useState<RegistrationKeyRequest[] | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);

  const [users, setUsers] = useState<PcInfoUser[] | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<number | null>(null);

  const loadUsers = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/users?system=${SYSTEM}`,
        { headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to load accounts (HTTP ${response.status}).`);
      }

      setUsers(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registered accounts."
      );
    }
  };

  const load = async () => {
    setError("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/registration-keys?system=${SYSTEM}`,
        { headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to load keys (HTTP ${response.status}).`);
      }

      setKeys(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registration keys."
      );
    }
  };

  const loadRequests = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/auth/registration-keys/requests?system=${SYSTEM}&status=pending`,
        { headers: authHeaders() }
      );

      if (!response.ok) {
        throw new Error(`Failed to load requests (HTTP ${response.status}).`);
      }

      setRequests(await response.json());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load registration key requests."
      );
    }
  };

  useEffect(() => {
    load();
    loadRequests();
    loadUsers();
  }, []);

  const handleApprove = async (id: number) => {
    setError("");
    try {
      setResolvingId(id);

      const response = await fetch(
        `${API_BASE_URL}/auth/registration-keys/requests/${id}/approve`,
        { method: "POST", headers: authHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to approve this request.");
      }

      const data = await response.json();
      setJustGenerated(data.key?.code ?? null);
      setCopied(false);
      await Promise.all([load(), loadRequests()]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to approve this request."
      );
    } finally {
      setResolvingId(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm("Reject this request? The person will not receive a key.")) {
      return;
    }

    setError("");
    try {
      setResolvingId(id);

      const response = await fetch(
        `${API_BASE_URL}/auth/registration-keys/requests/${id}/reject`,
        { method: "POST", headers: authHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to reject this request.");
      }

      await loadRequests();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to reject this request."
      );
    } finally {
      setResolvingId(null);
    }
  };

  const handleDeleteUser = async (user: PcInfoUser) => {
    if (
      !window.confirm(
        `Delete "${user.username}"? This removes their access to the PC Information System and cannot be undone.`
      )
    ) {
      return;
    }

    setError("");
    try {
      setDeletingUserId(user.id);

      const response = await fetch(
        `${API_BASE_URL}/auth/users/${user.id}?system=${SYSTEM}`,
        { method: "DELETE", headers: authHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to delete this account.");
      }

      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete this account."
      );
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleGenerate = async () => {
    setError("");
    setJustGenerated(null);
    setCopied(false);

    try {
      setGenerating(true);

      const response = await fetch(`${API_BASE_URL}/auth/registration-keys`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ system: SYSTEM }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to generate a key.");
      }

      const data: RegistrationKey = await response.json();
      setJustGenerated(data.code);
      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate a key."
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleRevoke = async (id: number) => {
    if (!window.confirm("Revoke this key? It can no longer be used to register.")) {
      return;
    }

    setError("");
    try {
      setRevokingId(id);

      const response = await fetch(
        `${API_BASE_URL}/auth/registration-keys/${id}/revoke`,
        { method: "POST", headers: authHeaders() }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || "Failed to revoke this key.");
      }

      await load();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to revoke this key."
      );
    } finally {
      setRevokingId(null);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  const availableCount = keys?.filter((k) => !k.used_at && !k.revoked_at).length ?? 0;

  return (
    <div className="auth-logs-page">
      <div className="auth-logs-header">
        <div>
          <div className="breadcrumb">Main Menu / Registration Keys</div>
          <h1>PC Info Registration Keys</h1>
          <p>
            Generate a one-time serial key for each person you approve to
            self-register for the PC Information System.
          </p>
        </div>
      </div>

      {justGenerated && (
        <section className="auth-logs-card">
          <div className="section-header">
            <div>
              <h2>New key generated</h2>
              <p>Give this code to the person registering — it won't be shown again after you leave this page.</p>
            </div>
          </div>
          <div className="auth-logs-toolbar">
            <span className="auth-logs-mono" style={{ fontSize: "16px", fontWeight: 700 }}>
              {justGenerated}
            </span>
            <button type="button" onClick={() => copyCode(justGenerated)}>
              <Copy size={13} strokeWidth={2} style={{ marginRight: 6 }} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </section>
      )}

      {error && <div className="auth-logs-error">{error}</div>}

      <section className="auth-logs-card">
        <div className="section-header">
          <div>
            <div>
              <h2>Pending Requests</h2>
              <p>People who asked for a serial key from the registration page.</p>
            </div>
          </div>
          <span className="record-count">{requests?.length ?? 0} pending</span>
        </div>

        {requests === null ? (
          <div className="auth-logs-loading">Loading…</div>
        ) : requests.length === 0 ? (
          <div className="auth-logs-empty">No pending requests.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Requested</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td>{req.username}</td>
                    <td>{req.email}</td>
                    <td>{formatDateTime(req.created_at)}</td>
                    <td style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => handleApprove(req.id)}
                        disabled={resolvingId === req.id}
                        style={{
                          border: "1px solid #a7f3d0",
                          background: "#ecfdf5",
                          color: "#065f46",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <Check size={12} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                        {resolvingId === req.id ? "…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(req.id)}
                        disabled={resolvingId === req.id}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        <X size={12} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="auth-logs-card">
        <div className="section-header">
          <div>
            <span className="section-number"><KeyRound size={17} strokeWidth={2} /></span>
            <div>
              <h2>Issued Keys</h2>
              <p>{availableCount} available, {keys?.length ?? 0} total.</p>
            </div>
          </div>
          <span className="record-count">{keys?.length ?? 0} keys</span>
        </div>

        <div className="auth-logs-toolbar">
          <button type="button" onClick={handleGenerate} disabled={generating}>
            {generating ? "Generating…" : "+ Generate New Key"}
          </button>
          <button type="button" className="refresh-button" onClick={load}>
            <RefreshCw size={13} strokeWidth={2} style={{ marginRight: 6 }} />
            Refresh
          </button>
        </div>

        {keys === null ? (
          <div className="auth-logs-loading">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="auth-logs-empty">No registration keys yet — generate one above.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Used By</th>
                  <th>Created</th>
                  <th>Used</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => {
                  const status = statusOf(key);
                  const canRevoke = !key.used_at && !key.revoked_at;
                  return (
                    <tr key={key.id}>
                      <td className="auth-logs-mono">{key.code}</td>
                      <td><span className={status.className}>{status.label}</span></td>
                      <td>{key.created_by ?? "—"}</td>
                      <td>{key.used_by ?? "—"}</td>
                      <td>{formatDateTime(key.created_at)}</td>
                      <td>{formatDateTime(key.used_at)}</td>
                      <td>
                        {canRevoke && (
                          <button
                            type="button"
                            onClick={() => handleRevoke(key.id)}
                            disabled={revokingId === key.id}
                            style={{
                              border: "1px solid #fecaca",
                              background: "#fef2f2",
                              color: "#b91c1c",
                              borderRadius: "6px",
                              padding: "5px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            <Ban size={12} strokeWidth={2} style={{ marginRight: 4, verticalAlign: "-2px" }} />
                            {revokingId === key.id ? "…" : "Revoke"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="auth-logs-card">
        <div className="section-header">
          <div>
            <span className="section-number"><Mail size={17} strokeWidth={2} /></span>
            <div>
              <h2>Registered Accounts</h2>
              <p>Every PC Information System account and the email it registered with.</p>
            </div>
          </div>
          <span className="record-count">{users?.length ?? 0} accounts</span>
        </div>

        <div className="auth-logs-toolbar">
          <button type="button" className="refresh-button" onClick={loadUsers}>
            <RefreshCw size={13} strokeWidth={2} style={{ marginRight: 6 }} />
            Refresh
          </button>
        </div>

        {users === null ? (
          <div className="auth-logs-loading">Loading…</div>
        ) : users.length === 0 ? (
          <div className="auth-logs-empty">No accounts yet.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Last Login</th>
                  <th>Registered</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.username}</td>
                    <td className={user.email ? "auth-logs-mono" : undefined}>
                      {user.email ?? "— (no email on file)"}
                    </td>
                    <td>{ROLE_LABELS[user.role] ?? user.role}</td>
                    <td>
                      <span className="auth-type-pill">{user.is_active ? "Active" : "Disabled"}</span>
                    </td>
                    <td>{formatDateTime(user.last_login_at)}</td>
                    <td>{formatDateTime(user.created_at)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(user)}
                        disabled={deletingUserId === user.id}
                        style={{
                          border: "1px solid #fecaca",
                          background: "#fef2f2",
                          color: "#b91c1c",
                          borderRadius: "6px",
                          padding: "5px 10px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: deletingUserId === user.id ? "not-allowed" : "pointer",
                          opacity: deletingUserId === user.id ? 0.6 : 1,
                        }}
                      >
                        {deletingUserId === user.id ? "…" : "Delete"}
                      </button>
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
