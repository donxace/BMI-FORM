// Imports a FOREN hardware/network/functional-testing security assessment
// CSV export into the itms_inventech `security_assessments` (one summary
// row per run) and `security_assessment_findings` (every raw row from the
// CSV, so nothing is lost even where the summary can't represent it)
// tables.
//
// Mirrors backend/src/pc-info/foren-csv.util.ts (used by the in-app
// "Import CSV" button, POST /pc-info/import) — keep the two in sync. See
// that file's header comment for the full section-by-section format
// breakdown; short version:
//
//   Header: SECTION,CATEGORY,COMPONENT,PROPERTY,VALUE,STATUS,FINDING,
//           SPECIFICATIONS,FUNCTIONAL_TEST,ACTUAL_RESULT
//
//   Rows are grouped by a SECTION label. Sections carry a decorative
//   in-band "sub-header" row (Category column literally = "Category")
//   right after the section's title row — skipped, no real data in it.
//
//   "SECURITY ASSESSMENT"                                  -> table_no 1
//   "NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION"    -> table_no 2
//   "FUNCTIONAL TESTING"                                    -> table_no 3
//   everything else (host identity, report info, summaries) -> table_no null,
//     still recorded as findings for completeness.
//
// Usage: node backend/scripts/import-security-assessment.js <path-to-csv>
const fs = require('fs');
const mysql = require('mysql2/promise');

function parseArgs() {
  const args = process.argv.slice(2);
  const positional = args.filter((a) => !a.startsWith('--'));
  if (positional.length === 0) {
    throw new Error('Usage: node import-security-assessment.js <path-to-csv>');
  }
  return { csvPath: positional[0] };
}

// Minimal RFC4180 CSV parser: handles quoted fields, embedded commas, and
// "" as an escaped quote inside a quoted field. Good enough for this
// export — not meant as a general CSV library.
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.length > 1 || r[0] !== '');
}

function toBool(value) {
  if (value === undefined || value === null || value === '') return null;
  const normalized = String(value).trim().toUpperCase();
  if (['YES', 'TRUE', 'ENABLED'].includes(normalized)) return 1;
  if (['NO', 'FALSE', 'DISABLED'].includes(normalized)) return 0;
  return null;
}

// "9/2/16 17:14" -> Date, or "9/2/2016 17:14:05"
function parseForenDate(value) {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [, m, d, y, h, min, s] = match;
  const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
  const date = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(min, 10), s ? parseInt(s, 10) : 0);
  if (isNaN(date.getTime())) return null;
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

// "54.08 seconds" -> 54.08
function parseDurationSeconds(value) {
  if (!value) return null;
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

// "45 / 100" -> 45
function parseRiskScore(value) {
  if (!value) return null;
  const match = value.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

const SECTION_TABLE_NO = {
  'SECURITY ASSESSMENT': 1,
  'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION': 2,
  'FUNCTIONAL TESTING': 3,
};

function isSubHeaderRow(row) {
  return (row.CATEGORY || '').trim() === 'Category';
}

function buildHostIdentity(hostInfoRows) {
  const get = (component, property) => {
    const match = hostInfoRows.find((r) => r.COMPONENT === component && r.PROPERTY === property);
    return match ? match.VALUE || null : null;
  };
  return {
    hostname: get('System', 'Hostname'),
    computer_name: get('System', 'Computer Name'),
    ip_address: get('TCP/IP', 'IP Address'),
    mac_address: get('Adapter', 'MAC Address'),
    username: get('Windows', 'User'),
    domain_workgroup: get('Windows', 'Domain / Workgroup'),
  };
}

function buildSummary(assessmentRows) {
  const get = (category, component, property) => {
    const match = assessmentRows.find(
      (r) => r.CATEGORY === category && r.COMPONENT === component && r.PROPERTY === property,
    );
    return match ? match.VALUE || undefined : undefined;
  };

  const motherboardSerial = get('MOTHERBOARD', 'Baseboard', 'Serial Number') || null;

  return {
    serial_no: motherboardSerial,
    foren_version: get('ASSESSMENT', 'Foren', 'Version') || null,
    ran_as_admin: get('ASSESSMENT', 'Foren', 'Administrator') ? 1 : 0,
    assessed_at: parseForenDate(get('ASSESSMENT', 'Foren', 'Assessment Start')),
    duration_seconds: parseDurationSeconds(get('ASSESSMENT', 'Foren', 'Assessment Duration')),
    motherboard_manufacturer: get('MOTHERBOARD', 'Baseboard', 'Manufacturer') || null,
    motherboard_product: get('MOTHERBOARD', 'Baseboard', 'Product') || null,
    motherboard_serial: motherboardSerial,
    cpu_summary: get('CPU', 'Processor', 'Detection') || null,
    ram_manufacturer: get('RAM', 'Memory Module', 'Manufacturer') || null,
    ram_capacity: get('RAM', 'Memory Module', 'Capacity') || null,
    ram_speed: get('RAM', 'Memory Module', 'Speed') || null,
    gpu_name: get('GPU', 'Graphics Adapter', 'Name') || null,
    gpu_vram: get('GPU', 'Graphics Adapter', 'VRAM') || null,
    os_edition: get('OPERATING SYSTEM', 'Windows', 'Edition') || null,
    os_build: get('OPERATING SYSTEM', 'Windows', 'Build') || null,
    secure_boot_status: get('SECURITY', 'Secure Boot', 'Status') || null,
    tpm_present: toBool(get('SECURITY', 'TPM', 'TPM Present')),
    tpm_ready: toBool(get('SECURITY', 'TPM', 'TPM Ready')),
    tpm_enabled: toBool(get('SECURITY', 'TPM', 'TPM Enabled')),
    defender_enabled: toBool(get('SECURITY', 'Microsoft Defender', 'Antivirus Enabled')),
    defender_realtime: toBool(get('SECURITY', 'Microsoft Defender', 'Real-Time Protection')),
    firewall_domain: toBool(get('SECURITY', 'Windows Firewall', 'Domain Profile')),
    firewall_private: toBool(get('SECURITY', 'Windows Firewall', 'Private Profile')),
    firewall_public: toBool(get('SECURITY', 'Windows Firewall', 'Public Profile')),
    established_tcp_connections: (() => {
      const v = get('NETWORK INTEGRITY', 'Active Connections', 'Established TCP Connections');
      return v ? parseInt(v, 10) : null;
    })(),
    public_remote_connections: (() => {
      const v = get('NETWORK INTEGRITY', 'Internet Connections', 'Public Remote Connections');
      return v ? parseInt(v, 10) : null;
    })(),
    foreign_destinations: (() => {
      const v = get('NETWORK INTEGRITY', 'Geolocation', 'Foreign Destinations');
      return v ? parseInt(v, 10) : null;
    })(),
    risk_score: parseRiskScore(get('ASSESSMENT', 'Security Risk', 'Risk Score')),
    risk_level: get('ASSESSMENT', 'Security Risk', 'Risk Level') || null,
  };
}

async function main() {
  const { csvPath } = parseArgs();

  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
  const parsed = parseCsv(raw);
  if (parsed.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const header = parsed[0].map((h) => h.trim().toUpperCase());
  const requiredColumns = ['SECTION', 'CATEGORY', 'COMPONENT', 'PROPERTY', 'VALUE', 'STATUS', 'FINDING'];
  const missing = requiredColumns.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    throw new Error(`Not a recognized FOREN export — missing column(s): ${missing.join(', ')}.`);
  }

  const allRows = parsed
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));

  const rows = allRows.filter((r) => !isSubHeaderRow(r));
  const hostInfo = rows.filter((r) => r.SECTION === 'COMPUTER / NETWORK INFORMATION');
  const assessmentRows = rows.filter((r) => r.SECTION === 'SECURITY ASSESSMENT');

  if (rows.filter((r) => SECTION_TABLE_NO[r.SECTION] !== undefined).length === 0) {
    throw new Error(
      'No recognized sections found (expected "SECURITY ASSESSMENT", "NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION", or "FUNCTIONAL TESTING") — is this a FOREN-format export?',
    );
  }

  const summary = buildSummary(assessmentRows);
  const identity = buildHostIdentity(hostInfo);

  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'itms_inventech',
  });

  try {
    // Soft-match against desktops/laptops.par_serial_no, same convention
    // as POST /inventory/devices/agent-report — informational only, this
    // import always records the assessment whether or not a device
    // matches yet.
    let deviceType = null;
    let deviceId = null;

    if (summary.serial_no) {
      for (const table of ['desktops', 'laptops']) {
        const [matches] = await conn.execute(`SELECT id FROM ${table} WHERE par_serial_no = ? LIMIT 1`, [
          summary.serial_no,
        ]);
        if (matches.length > 0) {
          deviceType = table;
          deviceId = matches[0].id;
          break;
        }
      }
    }

    const record = { ...summary, ...identity, device_type: deviceType, device_id: deviceId };
    const columns = Object.keys(record);
    const values = Object.values(record);
    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await conn.execute(
      `INSERT INTO security_assessments (${columns.join(', ')}) VALUES (${placeholders})`,
      values,
    );
    const assessmentId = result.insertId;

    const findingRows = rows.map((r) => [
      assessmentId,
      SECTION_TABLE_NO[r.SECTION] ?? null,
      r.SECTION || null,
      r.CATEGORY || null,
      r.COMPONENT || null,
      r.PROPERTY || null,
      r.VALUE || null,
      r.STATUS || null,
      r.FINDING || null,
      r.SPECIFICATIONS || null,
      r.FUNCTIONAL_TEST || null,
      r.ACTUAL_RESULT || null,
    ]);

    if (findingRows.length > 0) {
      await conn.query(
        'INSERT INTO security_assessment_findings (assessment_id, table_no, section, category, component, property, value, status, finding, specifications, functional_test, actual_result) VALUES ?',
        [findingRows],
      );
    }

    console.log(
      `Imported assessment #${assessmentId}${identity.hostname ? ` (${identity.hostname})` : ''}${deviceId ? ` — matched to ${deviceType} #${deviceId}` : ' — no matching device (serial not registered)'}, ${findingRows.length} finding rows.`,
    );
    console.log(`Risk: ${summary.risk_level ?? 'unknown'} (${summary.risk_score ?? '?'} / 100)`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exitCode = 1;
});
