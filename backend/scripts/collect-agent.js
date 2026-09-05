// Reads hardware/OS/antivirus info from the machine it's run on and
// reports it to POST /inventory/devices/agent-report, which patches the
// matching desktops/laptops row in itms_inventech — matched by serial
// number, so the device must already be registered through the
// Inventory Personnel UI (its "Serial No." field must equal this
// machine's system serial) before this can update it.
//
// Usage:
//   node backend/scripts/collect-agent.js
//   node backend/scripts/collect-agent.js --server http://192.168.1.15:3000
//
// Requires: npm install (adds the systeminformation dependency used here).
const si = require('systeminformation');
const { execFile } = require('child_process');
const { promisify } = require('util');

const execFileAsync = promisify(execFile);

// systeminformation has no antivirus API — on Windows, the Security
// Center's WMI class is the same source Belarc/most AV-detection tools
// read from. Best-effort: any failure (non-Windows, WMI unavailable,
// PowerShell restricted) just omits the field instead of failing the run.
async function countAntivirusProducts() {
  if (process.platform !== 'win32') {
    return undefined;
  }

  try {
    const { stdout } = await execFileAsync(
      'powershell.exe',
      [
        '-NoProfile',
        '-NonInteractive',
        '-Command',
        '(Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction Stop | Measure-Object).Count',
      ],
      { timeout: 8000 },
    );

    const count = parseInt(stdout.trim(), 10);
    return Number.isFinite(count) ? count : undefined;
  } catch {
    return undefined;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { server: 'http://localhost:3000' };

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--server' && args[i + 1]) {
      opts.server = args[i + 1].replace(/\/+$/, '');
      i++;
    }
  }

  return opts;
}

// System/BIOS serials on unprovisioned or virtualized hardware often come
// back as one of these placeholder strings instead of a real value.
const PLACEHOLDER_SERIAL = /^(default|to be filled|o\.e\.m|none|not specified|system serial)/i;

async function collect() {
  const [system, chassis, osInfo, cpu, mem, nics, antivirusCount] = await Promise.all([
    si.system(),
    si.chassis(),
    si.osInfo(),
    si.cpu(),
    si.mem(),
    si.networkInterfaces(),
    countAntivirusProducts(),
  ]);

  const serialNo = (system.serial || '').trim();
  if (!serialNo || PLACEHOLDER_SERIAL.test(serialNo)) {
    throw new Error(
      `Could not read a usable system serial number (got "${system.serial || ''}"). ` +
        'This machine\'s "Serial No." in Inventory must match its real system serial for matching to work.',
    );
  }

  const primaryNic = (Array.isArray(nics) ? nics : [nics]).find(
    (nic) =>
      nic &&
      !nic.internal &&
      !nic.virtual &&
      nic.mac &&
      nic.mac !== '00:00:00:00:00:00' &&
      nic.operstate === 'up' &&
      nic.ip4 &&
      !nic.ip4.startsWith('169.254.'),
  );

  const isLaptop = /notebook|laptop|portable/i.test(chassis.type || '');

  const payload = {
    serial_no: serialNo,
    device_type: isLaptop ? 'laptops' : 'desktops',
    os: [osInfo.distro, osInfo.release, osInfo.arch ? `(${osInfo.arch})` : ''].filter(Boolean).join(' '),
    cpu_brand:
      cpu.brand && cpu.manufacturer && cpu.brand.toLowerCase().includes(cpu.manufacturer.toLowerCase())
        ? cpu.brand
        : [cpu.manufacturer, cpu.brand].filter(Boolean).join(' '),
    cpu_cores: cpu.physicalCores || cpu.cores || undefined,
    gb_ram: mem.total ? Math.round(mem.total / 1024 ** 3) : undefined,
    mac_address: primaryNic ? primaryNic.mac : undefined,
    ip_address: primaryNic ? primaryNic.ip4 : undefined,
    no_of_installed_anti_virus: antivirusCount,
  };

  // Drop undefined fields rather than send them — the backend DTO only
  // patches the fields actually present in the request body.
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ''));
}

async function report(server, payload) {
  const res = await fetch(`${server}/inventory/devices/agent-report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const message = body && body.message ? body.message : res.statusText;
    throw new Error(`Server rejected the report (HTTP ${res.status}): ${Array.isArray(message) ? message.join('; ') : message}`);
  }

  return body;
}

async function main() {
  const { server } = parseArgs();

  console.log('Collecting system info...');
  const payload = await collect();
  console.log(payload);

  console.log(`Reporting to ${server}/inventory/devices/agent-report ...`);
  const updated = await report(server, payload);

  console.log(`Updated "${updated.label}" (${updated.deviceType}, serial ${payload.serial_no}).`);
}

main().catch((err) => {
  console.error('Agent failed:', err.message);
  process.exitCode = 1;
});
