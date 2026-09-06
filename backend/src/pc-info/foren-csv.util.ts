// Parsing logic for a FOREN hardware/network/functional-testing security
// assessment CSV export (as exported by the FOREN tool used for BMI-FORM's
// PC Information System). Mirrors backend/scripts/import-security-assessment.js
// so the CLI script and the in-app "Import CSV" button
// (PcInfoService.importAssessmentCsv) stay behaviorally identical.
//
// Real export shape (confirmed against SAMPLE.xlsx at the repo root — not
// the "Table 1/2/3" shape originally guessed at):
//
//   Header: SECTION,CATEGORY,COMPONENT,PROPERTY,VALUE,STATUS,FINDING,
//           SPECIFICATIONS,FUNCTIONAL_TEST,ACTUAL_RESULT
//
//   Rows are grouped by a human-readable SECTION label instead of a Table
//   number. Every section we care about additionally repeats a decorative
//   "sub-header" row right after its blank section-title row — a data row
//   whose Category column literally contains the string "Category" — which
//   exists purely to relabel what the generic CATEGORY/COMPONENT/PROPERTY/
//   VALUE/STATUS/FINDING columns mean for that section (e.g. NETWORK
//   INTEGRITY relabels them as Category/Process/PID/Local -> Remote/Risk/
//   Finding). These rows carry no real data and are skipped.
//
//   Sections seen, and what they map to:
//     - "COMPUTER / NETWORK INFORMATION" — host identity (Hostname,
//       Computer Name, IP Address, MAC Address, User, Domain / Workgroup).
//     - "REPORT INFORMATION" — report metadata (Report Type, Generated).
//     - "SECURITY SUMMARY" — a single low-value informational row.
//     - "SECURITY ASSESSMENT" — per-host hardware/OS/security key-value
//       facts (ASSESSMENT, MOTHERBOARD, SECURITY, RAM, GPU, STORAGE,
//       OPERATING SYSTEM, ...). This is what fills the SecurityAssessment
//       summary row. Stored as table_no = 1 findings (unchanged from the
//       original Table-1 concept).
//     - "NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION" — one row per
//       network-connection finding. Stored as table_no = 2 (unchanged from
//       the original Table-2 concept).
//     - "FUNCTIONAL TESTING SUMMARY" — aggregate pass/fail/warning counts.
//     - "FUNCTIONAL TESTING" — the pass/fail hardware/software component
//       checklist, now with 3 extra descriptive columns (Specifications,
//       Functional Test, Actual Result) beyond what the old Table-3 concept
//       carried. Stored as table_no = 3.
//
// Everything else (host identity, report info, the two summary sections)
// is preserved too, tagged with table_no = null, so nothing from the
// export is silently dropped even though the current dashboard pages only
// render table_no 1/2/3.

export type ForenCsvRow = Record<string, string>;

export type ForenFindingRow = {
  tableNo: 1 | 2 | 3 | null;
  section: string | null;
  category: string | null;
  component: string | null;
  property: string | null;
  value: string | null;
  status: string | null;
  finding: string | null;
  specifications: string | null;
  functionalTest: string | null;
  actualResult: string | null;
};

const SECTION_TABLE_NO: Record<string, 1 | 2 | 3 | null> = {
  'SECURITY ASSESSMENT': 1,
  'NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION': 2,
  'FUNCTIONAL TESTING': 3,
};

// Minimal RFC4180 CSV parser: handles quoted fields, embedded commas, and
// "" as an escaped quote inside a quoted field. Good enough for this
// export — not meant as a general CSV library.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
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

export function toBool(value: string | undefined | null): boolean | null {
  if (value === undefined || value === null) return null;
  const normalized = String(value).trim().toUpperCase();
  if (['YES', 'TRUE', 'ENABLED'].includes(normalized)) return true;
  if (['NO', 'FALSE', 'DISABLED'].includes(normalized)) return false;
  return null;
}

// Handles the export's "M/D/YY H:mm" / "M/D/YYYY H:mm" style timestamps
// (e.g. "9/2/16 17:14"), which native `new Date(string)` parsing is
// unreliable for across locales/runtimes.
export function parseForenDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const [, m, d, y, h, min, s] = match;
  const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
  const date = new Date(year, parseInt(m, 10) - 1, parseInt(d, 10), parseInt(h, 10), parseInt(min, 10), s ? parseInt(s, 10) : 0);
  return isNaN(date.getTime()) ? null : date;
}

// "54.08 seconds" -> 54.08
export function parseDurationSeconds(value: string | undefined | null): number | null {
  if (!value) return null;
  const match = value.match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

// "45 / 100" -> 45
export function parseRiskScore(value: string | undefined | null): number | null {
  if (!value) return null;
  const match = value.match(/^\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

// A row is a decorative in-band sub-header (not real data) when its
// Category column is literally the string "Category" — the export reuses
// the generic column names as relabeling values for whichever section the
// row falls under. See file header comment.
function isSubHeaderRow(row: ForenCsvRow): boolean {
  return row.CATEGORY?.trim() === 'Category';
}

export function parseForenCsv(raw: string): { rows: ForenCsvRow[]; hostInfo: ForenCsvRow[] } {
  const withoutBom = raw.replace(/^﻿/, '');
  const parsed = parseCsv(withoutBom);
  if (parsed.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const header = parsed[0].map((h) => h.trim().toUpperCase());
  const requiredColumns = ['SECTION', 'CATEGORY', 'COMPONENT', 'PROPERTY', 'VALUE', 'STATUS', 'FINDING'];
  const missing = requiredColumns.filter((c) => !header.includes(c));
  if (missing.length > 0) {
    throw new Error(`Not a recognized FOREN export — missing column(s): ${missing.join(', ')}.`);
  }

  const allRows: ForenCsvRow[] = parsed
    .slice(1)
    .filter((r) => r.some((cell) => cell.trim() !== ''))
    .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));

  const dataRows = allRows.filter((r) => !isSubHeaderRow(r));

  const hostInfo = dataRows.filter((r) => r.SECTION === 'COMPUTER / NETWORK INFORMATION');
  if (dataRows.filter((r) => SECTION_TABLE_NO[r.SECTION] !== undefined).length === 0) {
    throw new Error(
      'No recognized sections found (expected "SECURITY ASSESSMENT", "NETWORK INTEGRITY / MALICIOUS CONNECTION DETECTION", or "FUNCTIONAL TESTING") — is this a FOREN-format export?',
    );
  }

  return { rows: dataRows, hostInfo };
}

export function toFindingRows(rows: ForenCsvRow[]): ForenFindingRow[] {
  return rows.map((r) => ({
    tableNo: SECTION_TABLE_NO[r.SECTION] ?? null,
    section: r.SECTION || null,
    category: r.CATEGORY || null,
    component: r.COMPONENT || null,
    property: r.PROPERTY || null,
    value: r.VALUE || null,
    status: r.STATUS || null,
    finding: r.FINDING || null,
    specifications: r.SPECIFICATIONS || null,
    functionalTest: r.FUNCTIONAL_TEST || null,
    actualResult: r.ACTUAL_RESULT || null,
  }));
}

export function buildHostIdentity(hostInfoRows: ForenCsvRow[]) {
  const get = (component: string, property: string) => {
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

export function buildAssessmentSummary(assessmentRows: ForenCsvRow[]) {
  const get = (category: string, component: string, property: string) => {
    const match = assessmentRows.find(
      (r) => r.CATEGORY === category && r.COMPONENT === component && r.PROPERTY === property,
    );
    return match ? match.VALUE || undefined : undefined;
  };

  const motherboardSerial = get('MOTHERBOARD', 'Baseboard', 'Serial Number') || null;

  return {
    serial_no: motherboardSerial,
    foren_version: get('ASSESSMENT', 'Foren', 'Version') || null,
    ran_as_admin: !!get('ASSESSMENT', 'Foren', 'Administrator'),
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
