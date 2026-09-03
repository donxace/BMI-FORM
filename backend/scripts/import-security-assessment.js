// Imports a FOREN-style hardware/network security assessment CSV export
// into the itms_inventech `security_assessments` (one summary row per
// run) and `security_assessment_findings` (every raw row from the CSV,
// so nothing is lost even where the summary can't represent it) tables.
//
// The CSV bundles 3 logically different "tables" under one header
// (Section, Table, Category, Component, Property, Value, Status,
// Finding):
//   Table 1 — per-host key/value facts (hardware, OS, security posture,
//             risk score) — this is what fills security_assessments.
//   Table 2 — one row per network-connection finding, Category/
//             Component/Property/Value blank, only Finding filled.
//   Table 3 — a pass/fail component checklist (Category/Component +
//             Status/Finding, Property/Value blank).
// Every row from all three lands in security_assessment_findings.
//
// Usage: node backend/scripts/import-security-assessment.js <path-to-csv> [--server http://localhost:3000]
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
// "" as an escaped quote inside a quoted field. Good enough for a small,
// well-formed export like this one — not meant as a general CSV library.
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
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toUpperCase();
  if (['YES', 'TRUE', 'ENABLED'].includes(normalized)) return 1;
  if (['NO', 'FALSE', 'DISABLED'].includes(normalized)) return 0;
  return null;
}

function toMysqlDatetime(value) {
  // Already "YYYY-MM-DD HH:MM:SS" in the sample export — pass through if
  // it looks right, otherwise let MySQL reject it rather than guess.
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value) ? value : null;
}

function buildSummary(table1Rows) {
  const get = (category, component, property) => {
    const match = table1Rows.find(
      (r) => r.Category === category && r.Component === component && r.Property === property,
    );
    return match ? match.Value : undefined;
  };

  const duration = get('ASSESSMENT', 'Foren', 'Assessment Duration');
  const riskScore = get('ASSESSMENT', 'Security Risk', 'Risk Score');

  return {
    foren_version: get('ASSESSMENT', 'Foren', 'Version') || null,
    ran_as_admin: get('ASSESSMENT', 'Foren', 'Administrator') ? 1 : 0,
    assessed_at: toMysqlDatetime(get('ASSESSMENT', 'Foren', 'Assessment Start') || ''),
    duration_seconds: duration ? parseFloat(duration) : null,
    motherboard_manufacturer: get('MOTHERBOARD', 'Baseboard', 'Manufacturer') || null,
    motherboard_product: get('MOTHERBOARD', 'Baseboard', 'Product') || null,
    motherboard_serial: get('MOTHERBOARD', 'Baseboard', 'Serial Number') || null,
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
    risk_score: riskScore ? parseInt(riskScore, 10) : null,
    risk_level: get('ASSESSMENT', 'Security Risk', 'Risk Level') || null,
  };
}

async function main() {
  const { csvPath } = parseArgs();

  const raw = fs.readFileSync(csvPath, 'utf8').replace(/^﻿/, '');
  const rows = parseCsv(raw);
  const header = rows[0];
  const records = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])));

  const table1 = records.filter((r) => r.Table === '1');
  const otherTables = records.filter((r) => r.Table !== '1');

  if (table1.length === 0) {
    throw new Error('No "Table 1" rows found — is this a FOREN-format export?');
  }

  const summary = buildSummary(table1);
  summary.serial_no = summary.motherboard_serial;

  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
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

    const columns = ['device_type', 'device_id', ...Object.keys(summary)];
    const values = [deviceType, deviceId, ...Object.values(summary)];
    const placeholders = columns.map(() => '?').join(', ');

    const [result] = await conn.execute(
      `INSERT INTO security_assessments (${columns.join(', ')}) VALUES (${placeholders})`,
      values,
    );
    const assessmentId = result.insertId;

    const findingRows = [...table1, ...otherTables].map((r) => [
      assessmentId,
      parseInt(r.Table, 10) || null,
      r.Section || null,
      r.Category || null,
      r.Component || null,
      r.Property || null,
      r.Value || null,
      r.Status || null,
      r.Finding || null,
    ]);

    if (findingRows.length > 0) {
      await conn.query(
        'INSERT INTO security_assessment_findings (assessment_id, table_no, section, category, component, property, value, status, finding) VALUES ?',
        [findingRows],
      );
    }

    console.log(
      `Imported assessment #${assessmentId}${deviceId ? ` — matched to ${deviceType} #${deviceId}` : ' — no matching device (serial not registered)'}, ${findingRows.length} finding rows.`,
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
