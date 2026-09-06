// Reads this machine's identity from the local ITMS Machine Identity
// Helper (backend/scripts/Get-MachineIdentityHelper.ps1) — a persistent
// local HTTP listener installed once per machine via
// Install-MachineIdentityHelperTask.ps1. Its computer_name/windows_user
// are sent on every admin login purely to enrich authentication_audit_logs
// (see AuthService.validateAndLogin) — this is NOT used to gate or lock
// login to a particular machine, just to record which one was used.
const HELPER_URL = "http://127.0.0.1:47850/identity";

export type HardwareIdentity = {
  // False whenever the helper isn't installed, isn't running, or didn't
  // respond in time. Login proceeds normally either way — this only ever
  // affects what (if anything) shows up in the audit log.
  reachable: boolean;
  hardware_id: string | null;
  computer_name: string | null;
  windows_user: string | null;
};

const UNREACHABLE: HardwareIdentity = {
  reachable: false,
  hardware_id: null,
  computer_name: null,
  windows_user: null,
};

export async function getHardwareIdentity(timeoutMs = 800): Promise<HardwareIdentity> {
  try {
    const response = await fetch(HELPER_URL, {
      method: "GET",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!response.ok) {
      return UNREACHABLE;
    }

    const data = await response.json();

    return {
      reachable: true,
      hardware_id: data.hardware_id ?? null,
      computer_name: data.computer_name ?? null,
      windows_user: data.windows_user ?? null,
    };
  } catch {
    // Helper not installed, not running, blocked, or too slow — login
    // still proceeds either way; this just means computer_name/windows_user
    // stay blank on this attempt's audit log row.
    return UNREACHABLE;
  }
}
