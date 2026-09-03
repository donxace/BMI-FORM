// Seeds the itms_inventech database (Hardware Inventory domain) with a
// realistic demo dataset: the original lookup tables (divisions, ranks,
// roles, device_types, endpoint_security) restored to their canonical
// values, ~40 sample personnel, and a spread of devices across all 12
// device-type tables so every category in the Inventory UI has data to
// show, not just desktops.
//
// Safe to re-run: it truncates every table it touches before inserting.
// Usage: node backend/scripts/seed-itms-inventech.js
const mysql = require('mysql2/promise');

const DIVISIONS = [
  [1, 'ITSD'], [2, 'SMD'], [3, 'ISSD'], [4, 'ITPMD'], [5, 'PTD'], [6, 'DMD'],
  [7, 'ARMD'], [8, 'PTDLAB'], [9, 'CI'], [10, 'PCR'], [11, 'LS'], [12, 'IHSS'],
  [13, 'BFS'], [14, 'SAO'], [15, 'SF'], [16, 'PCC-SF'], [17, 'TECHSUPP'], [18, 'PSMU'],
];

const RANKS = [
  [1, 'NUP', 14], [2, 'PAT', 13], [3, 'PCPL', 12], [4, 'PSSG', 11], [5, 'PMSG', 10],
  [6, 'PSMS', 9], [7, 'PCMS', 8], [8, 'PEMS', 7], [9, 'PLT', 6], [10, 'PCPT', 5],
  [11, 'PMAJ', 4], [12, 'PLTCOL', 3], [13, 'PCOL', 2], [14, 'PBGEN', 1],
];

const ROLES = [[1, 'superadmin'], [2, 'admin'], [3, 'encoder']];

const DEVICE_TYPES = [
  [1, 'Desktop'], [2, 'Laptop'], [3, 'Printer'], [4, 'Switch'], [5, 'Router'], [6, 'Firewall'],
];

const ENDPOINT_SECURITY = [
  [1, 'Trendmicro'], [2, 'Sophos'], [3, 'Cybereason'], [4, 'Bitdefender'], [5, 'UTMStack'],
  [6, 'Qualys'], [7, 'Avast'], [8, 'Windows Defender'], [9, 'eScan'], [10, 'Cynet'], [11, 'Others'],
];

const FIRST_NAMES = [
  'Juan', 'Maria', 'Jose', 'Ana', 'Pedro', 'Carmen', 'Antonio', 'Rosa', 'Manuel', 'Elena',
  'Ricardo', 'Teresa', 'Eduardo', 'Luz', 'Fernando', 'Corazon', 'Roberto', 'Angelica', 'Arnel', 'Josefina',
  'Carlo', 'Ma. Victoria', 'Dennis', 'Grace', 'Michael', 'Jasmine', 'Ronald', 'Kristine', 'Alvin', 'Charmaine',
  'Bryan', 'Aiza', 'Christian', 'Lorna', 'Noel', 'Divina', 'Randy', 'Precious', 'Gerald', 'Marites',
];

const LAST_NAMES = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Flores', 'Ramos',
  'Villanueva', 'De Guzman', 'Aquino', 'Pascual', 'Gonzales', 'Fernandez', 'Del Rosario', 'Salazar', 'Castillo', 'Navarro',
  'Domingo', 'Marquez', 'Rivera', 'Aguilar', 'Bernardo', 'Mercado', 'Roque', 'Tolentino', 'Valdez', 'Ignacio',
];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'itms_inventech',
    multipleStatements: true,
  });

  console.log('Connected to itms_inventech.');

  // --- Lookup tables: restore to canonical values ---
  await conn.query('SET FOREIGN_KEY_CHECKS=0');

  for (const table of ['divisions', 'ranks', 'roles', 'device_types', 'endpoint_security', 'personnels',
    'cameras', 'desktops', 'laptops', 'printers', 'routers', 'switches', 'switchers', 'splitters', 'ups', 'firewalls', 'headsets', 'others']) {
    await conn.query(`TRUNCATE TABLE \`${table}\``);
  }

  console.log('Truncated all seedable tables.');

  await conn.query('INSERT INTO divisions (id, division) VALUES ?', [DIVISIONS]);
  await conn.query('INSERT INTO ranks (id, rank, sort_order) VALUES ?', [RANKS]);
  await conn.query('INSERT INTO roles (id, role_name) VALUES ?', [ROLES]);
  await conn.query('INSERT INTO device_types (id, type) VALUES ?', [DEVICE_TYPES]);
  await conn.query('INSERT INTO endpoint_security (id, antivirus) VALUES ?', [ENDPOINT_SECURITY]);
  console.log('Seeded lookup tables (divisions, ranks, roles, device_types, endpoint_security).');

  // --- Personnel: ~40 realistic sample records spread across divisions/ranks ---
  const PERSONNEL_COUNT = 40;
  const personnelRows = [];
  for (let i = 0; i < PERSONNEL_COUNT; i++) {
    const divisionId = DIVISIONS[i % DIVISIONS.length][0];
    const rankId = RANKS[(i * 3) % RANKS.length][0];
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i * 7);
    personnelRows.push([i + 1, divisionId, rankId, firstName, null, lastName, 1, 1]);
  }
  await conn.query(
    'INSERT INTO personnels (id, division_id, rank_id, first_name, middle_name, last_name, created_by, is_active) VALUES ?',
    [personnelRows]
  );
  console.log(`Seeded ${personnelRows.length} personnel.`);

  // --- Devices: a spread across all 12 device-type tables ---
  const personnelIds = personnelRows.map((r) => r[0]);
  const divisionIds = DIVISIONS.map((d) => d[0]);
  const today = () => {
    const d = new Date(Date.now() - Math.floor(Math.random() * 300) * 86400000);
    return d.toISOString().slice(0, 10);
  };
  const owner = (i) => pick(personnelIds, i);
  const division = (i) => pick(divisionIds, i);

  // desktops (rich fields)
  const CPU_BRANDS = ['Intel', 'AMD'];
  const OS_LIST = ['Windows 11 Pro', 'Windows 10 Pro', 'Windows 11 Home Single Language'];
  const MONITOR_BRANDS = ['Acer KA242Y', 'HP W2072a', 'Lenovo LI2054A', 'Acer V196HQL'];
  const desktopRows = [];
  for (let i = 0; i < 15; i++) {
    desktopRows.push([
      i + 1, owner(i), 0, `ITMS-ITSD-${String(100 + i).padStart(4, '0')}`, division(i),
      null, pick(OS_LIST, i), 1, null, 1, null, pick([1, 2, 3, 4], i), null, null, null,
      pick(CPU_BRANDS, i), 12, 6, pick([8, 16, 32], i), pick(MONITOR_BRANDS, i), 24, pick([2, 3, 4], i),
      null, null, null, 'Microsoft Office LTSC Professional Plus 2021', 1, null, null,
      today(), null, `PAR-${1000 + i}`, 1, today(),
    ]);
  }
  await conn.query(
    `INSERT INTO desktops (id, personnel_id, device_id, device_name, division_id, ip_address, os, is_os_licensed,
      os_license_key, is_remote_acc, endpoint_security_id, no_of_installed_anti_virus, date_installed, guid, mac_address,
      cpu_brand, cpu_generation, cpu_cores, gb_ram, monitor_brand, monitor_size_inches, no_of_user_accounts,
      user_account_type, authorized_software, unauthorized_software, office_application, is_office_licensed,
      office_license_key, previous_owners_id, created_date, last_updated_at, par_serial_no, is_active, acquisition_date)
      VALUES ?`,
    [desktopRows]
  );
  console.log(`Seeded ${desktopRows.length} desktops.`);

  // laptops (same shape as desktops)
  const laptopRows = [];
  for (let i = 0; i < 10; i++) {
    laptopRows.push([
      i + 1, owner(i + 5), 0, `ITMS-LT-${String(200 + i).padStart(4, '0')}`, division(i + 2),
      null, pick(OS_LIST, i + 1), 1, null, 1, null, pick([1, 2, 3], i), null, null, null,
      pick(CPU_BRANDS, i + 1), 11, 4, pick([8, 16], i), null, null, pick([1, 2], i),
      null, null, null, 'Microsoft 365 Apps for Business', 1, null, null,
      today(), null, `PAR-${2000 + i}`, 1, today(),
    ]);
  }
  await conn.query(
    `INSERT INTO laptops (id, personnel_id, device_id, device_name, division_id, ip_address, os, is_os_licensed,
      os_license_key, is_remote_acc, endpoint_security_id, no_of_installed_anti_virus, date_installed, guid, mac_address,
      cpu_brand, cpu_generation, cpu_cores, gb_ram, monitor_brand, monitor_size_inches, no_of_user_accounts,
      user_account_type, authorized_software, unauthorized_software, office_application, is_office_licensed,
      office_license_key, previous_owners_id, created_date, last_updated_at, par_serial_no, is_active, acquisition_date)
      VALUES ?`,
    [laptopRows]
  );
  console.log(`Seeded ${laptopRows.length} laptops.`);

  // printers
  const PRINTER_BRANDS = [['Canon', 'G2010'], ['Epson', 'L3110'], ['HP', 'LaserJet Pro M15w'], ['Brother', 'HL-L2350DW']];
  const printerRows = [];
  for (let i = 0; i < 8; i++) {
    const [brand, model] = pick(PRINTER_BRANDS, i);
    printerRows.push([i + 1, owner(i + 2), 0, division(i + 1), today(), 'Purchased via public bidding', brand, model, null, today(), null, `SN-PR-${3000 + i}`, 1]);
  }
  await conn.query(
    `INSERT INTO printers (id, personnel_id, device_id, division_id, acquisition_date, acquisition_details, brand, model,
      previous_owners_id, created_date, last_update_at, serial_no, is_active) VALUES ?`,
    [printerRows]
  );
  console.log(`Seeded ${printerRows.length} printers.`);

  // routers
  const NET_BRANDS = ['Cisco', 'TP-Link', 'MikroTik', 'Ubiquiti'];
  const routerRows = [];
  for (let i = 0; i < 6; i++) {
    routerRows.push([
      i + 1, owner(i + 8), 0, pick(NET_BRANDS, i), `Model-${1000 + i}`, `SN-RT-${4000 + i}`,
      8, 4, '192.168.1.0/24', 'v1.2.3', 'Server Room', 1, 1, 'SSH via VPN', null,
      'Network Admin', '09171234567', today(), 'Purchase', null, today(), null, division(i + 3),
    ]);
  }
  await conn.query(
    `INSERT INTO routers (id, personnel_id, device_id, manufacturer, model, serial_no, no_of_ports, no_of_active_ports,
      active_port_ip_address_range, firmware_version, location, is_active, is_remotely_accessible,
      remote_connection_details, remarks, pnp_focal_person, contact_details, acquisition_date, acquisition_type,
      previous_owners_id, created_date, last_update_at, division_id) VALUES ?`,
    [routerRows]
  );
  console.log(`Seeded ${routerRows.length} routers.`);

  // switches (all NOT NULL)
  const switchRows = [];
  for (let i = 0; i < 5; i++) {
    switchRows.push([
      i + 1, owner(i + 12), division(i + 4), 0, pick(NET_BRANDS, i + 1), `SW-${2000 + i}`, `SN-SW-${5000 + i}`,
      24, 20, 24, 0, 'v2.0.1', 1, 'Server Room', 1, 1, 0, '', 'No issues reported', 'Network Admin', '09171234567',
      today(), 'Purchase', 'Purchased via public bidding', null, today(), null,
    ]);
  }
  await conn.query(
    `INSERT INTO switches (id, personnel_id, division_id, device_id, manufacturer, model, serial_no, no_of_ports,
      no_of_active_ports, no_of_managed, no_of_unmanaged, firmware_version, is_vlan_supported, location, is_status,
      is_active, is_remote_access, remote_connection_details, remarks, pnp_focal_person, contact_details,
      acquisition_date, acquisition_type, acquisition_details, previous_owners_id, created_date, last_update_at)
      VALUES ?`,
    [switchRows]
  );
  console.log(`Seeded ${switchRows.length} switches.`);

  // firewalls
  const firewallRows = [];
  for (let i = 0; i < 3; i++) {
    firewallRows.push([
      i + 1, owner(i + 15), division(i + 5), 0, pick(['Fortinet', 'Sophos', 'pfSense'], i), `FW-${3000 + i}`,
      `SN-FW-${6000 + i}`, 8, 6, 'v6.4.2', 'Web GUI', 'Server Room', 1, 1, 'SSH via VPN', null,
      'Network Admin', '09171234567', today(), 'Purchase', 'Purchased via public bidding', null, today(), null,
    ]);
  }
  await conn.query(
    `INSERT INTO firewalls (id, personnel_id, division_id, device_id, manufacturer, model, serial_no, no_of_ports,
      no_of_active_ports, firmware_version, management_interface_type, location, is_active, is_remotely_accessible,
      remote_connection_details, remarks, pnp_focal_person, contact_details, acquisition_date, acquisition_type,
      acquisition_details, previous_owners_id, created_date, last_updated_at) VALUES ?`,
    [firewallRows]
  );
  console.log(`Seeded ${firewallRows.length} firewalls.`);

  // cameras
  const cameraRows = [];
  for (let i = 0; i < 6; i++) {
    cameraRows.push([i + 1, `CAM-${4000 + i}`, owner(i + 3), 0, division(i + 6), today(), 'CCTV unit for office monitoring', pick(['Hikvision', 'Dahua'], i), `DS-${2000 + i}`, `SN-CAM-${7000 + i}`, null, today(), null, 1]);
  }
  await conn.query(
    `INSERT INTO cameras (id, device_code, personnel_id, device_id, division_id, acquisition_date, acquisition_details,
      brand, model, serial_no, previous_owners_id, created_date, last_update_at, is_active) VALUES ?`,
    [cameraRows]
  );
  console.log(`Seeded ${cameraRows.length} cameras.`);

  // headsets
  const headsetRows = [];
  for (let i = 0; i < 5; i++) {
    headsetRows.push([i + 1, `HS-${5000 + i}`, owner(i + 9), 0, division(i + 7), today(), 'For video conferencing', pick(['Logitech', 'Jabra'], i), `H-${100 + i}`, `SN-HS-${8000 + i}`, null, today(), null, 1]);
  }
  await conn.query(
    `INSERT INTO headsets (id, device_code, personnel_id, device_id, division_id, acquisition_date, acquisition_details,
      brand, model, serial_no, previous_owners_id, created_date, last_update_at, is_active) VALUES ?`,
    [headsetRows]
  );
  console.log(`Seeded ${headsetRows.length} headsets.`);

  // splitters
  const splitterRows = [];
  for (let i = 0; i < 3; i++) {
    splitterRows.push([i + 1, owner(i + 20), division(i + 8), pick(['Ugreen', 'Orico'], i), `SPL-${100 + i}`, `SN-SPL-${9000 + i}`, 1, 2, 2, 'For dual-monitor setup', today(), null, 1, today(), null]);
  }
  await conn.query(
    `INSERT INTO splitters (id, personnel_id, division_id, brand, model, serial_no, hdmi_in, hdmi_out, no_of_ports,
      acquisition_details, acquisition_date, previous_owners_id, is_active, created_date, last_update_at) VALUES ?`,
    [splitterRows]
  );
  console.log(`Seeded ${splitterRows.length} splitters.`);

  // switchers
  const switcherRows = [];
  for (let i = 0; i < 3; i++) {
    switcherRows.push([i + 1, owner(i + 22), division(i + 9), pick(['Ugreen', 'Orico'], i + 1), `SWH-${100 + i}`, `SN-SWH-${10000 + i}`, 2, 1, 2, 'For shared monitor between two PCs', today(), null, 1, today(), null]);
  }
  await conn.query(
    `INSERT INTO switchers (id, personnel_id, division_id, brand, model, serial_no, hdmi_in, hdmi_out, no_of_ports,
      acquisition_details, acquisition_date, previous_owners_id, is_active, created_date, last_update_at) VALUES ?`,
    [switcherRows]
  );
  console.log(`Seeded ${switcherRows.length} switchers.`);

  // ups
  const upsRows = [];
  for (let i = 0; i < 4; i++) {
    upsRows.push([i + 1, owner(i + 25), division(i + 10), pick(['APC', 'CyberPower'], i), `UPS-${1000 + i}`, `SN-UPS-${11000 + i}`, 650, 390, 'Lead-acid', 15, 220, 220, 'For server room backup power', today(), null, 1, today(), null]);
  }
  await conn.query(
    `INSERT INTO ups (id, personnel_id, division_id, brand, model, serial_no, capacity_va, capacity_watts,
      battery_type, backup_time, input_voltage, output_voltage, acquisition_details, acquisition_date,
      previous_owners_id, is_active, created_date, last_update_at) VALUES ?`,
    [upsRows]
  );
  console.log(`Seeded ${upsRows.length} UPS units.`);

  // others
  const otherRows = [];
  for (let i = 0; i < 3; i++) {
    otherRows.push([i + 1, owner(i + 28), division(i + 11), pick(['Generic', 'Local Brand'], i), `MISC-${100 + i}`, `SN-OT-${12000 + i}`, 'Miscellaneous office equipment', today(), null, 1, today(), null, `Label Printer ${i + 1}`]);
  }
  await conn.query(
    `INSERT INTO others (id, personnel_id, division_id, brand, model, serial_no, acquisition_details, acquisition_date,
      previous_owners_id, is_active, created_date, last_update_at, device_name) VALUES ?`,
    [otherRows]
  );
  console.log(`Seeded ${otherRows.length} other-equipment records.`);

  await conn.query('SET FOREIGN_KEY_CHECKS=1');

  const [rows] = await conn.query(
    `SELECT TABLE_NAME, TABLE_ROWS FROM information_schema.TABLES WHERE TABLE_SCHEMA='itms_inventech' ORDER BY TABLE_NAME`
  );
  console.log('\nFinal row counts:');
  console.table(rows);

  await conn.end();
}

main().catch((err) => {
  console.error('SEED FAILED:', err);
  process.exit(1);
});
