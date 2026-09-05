// Self-service account management for the RBAC login system — add,
// update, remove, or list accounts in the `users` table without needing
// to hand-write bcrypt hashes or SQL.
//
// Valid roles today:
//   admin                                    (legacy super-role, unrestricted everywhere)
//   bmi_admin          bmi_editor          bmi_viewer
//   inventory_admin    inventory_editor    inventory_viewer
//   pcinfo_admin       pcinfo_editor       pcinfo_viewer
//   intrusion_admin    intrusion_editor    intrusion_viewer
//   environment_admin  environment_editor  environment_viewer
//
// Usage:
//   node scripts/manage-user.js list
//   node scripts/manage-user.js create <username> <password> <role>
//   node scripts/manage-user.js set-password <username> <newPassword>
//   node scripts/manage-user.js set-role <username> <newRole>
//   node scripts/manage-user.js delete <username>
//
// Examples:
//   node scripts/manage-user.js create jdelacruz Secret@2026 inventory_editor
//   node scripts/manage-user.js set-password bmi_viewer NewPass@2026
//   node scripts/manage-user.js set-role jdelacruz inventory_admin
//   node scripts/manage-user.js delete jdelacruz
//
// Reads DB connection the same way app.module.ts does — DB_HOST /
// DB_PORT / DB_USERNAME / DB_PASSWORD env vars, falling back to the
// local XAMPP defaults (localhost / root / no password).
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const VALID_ROLES = [
  'admin',
  'bmi_admin', 'bmi_editor', 'bmi_viewer',
  'inventory_admin', 'inventory_editor', 'inventory_viewer',
  'pcinfo_admin', 'pcinfo_editor', 'pcinfo_viewer',
  'intrusion_admin', 'intrusion_editor', 'intrusion_viewer',
  'environment_admin', 'environment_editor', 'environment_viewer',
];

async function getConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || '',
    database: 'bmi_monitoring',
  });
}

function requireRole(role) {
  if (!VALID_ROLES.includes(role)) {
    throw new Error(
      `Unknown role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`,
    );
  }
}

async function list(conn) {
  const [rows] = await conn.query(
    'SELECT id, username, role FROM users ORDER BY id',
  );
  console.table(rows);
}

async function create(conn, username, password, role) {
  requireRole(role);
  const hash = await bcrypt.hash(password, 10);
  await conn.query(
    'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
    [username, hash, role],
  );
  console.log(`Created "${username}" with role "${role}".`);
}

async function setPassword(conn, username, password) {
  const hash = await bcrypt.hash(password, 10);
  const [result] = await conn.query(
    'UPDATE users SET password_hash = ? WHERE username = ?',
    [hash, username],
  );
  if (result.affectedRows === 0) {
    throw new Error(`No user named "${username}" found.`);
  }
  console.log(`Updated password for "${username}".`);
}

async function setRole(conn, username, role) {
  requireRole(role);
  const [result] = await conn.query(
    'UPDATE users SET role = ? WHERE username = ?',
    [role, username],
  );
  if (result.affectedRows === 0) {
    throw new Error(`No user named "${username}" found.`);
  }
  console.log(`Updated "${username}" to role "${role}".`);
}

async function remove(conn, username) {
  const [result] = await conn.query('DELETE FROM users WHERE username = ?', [
    username,
  ]);
  if (result.affectedRows === 0) {
    throw new Error(`No user named "${username}" found.`);
  }
  console.log(`Deleted "${username}".`);
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const conn = await getConnection();

  try {
    switch (command) {
      case 'list':
        await list(conn);
        break;
      case 'create':
        await create(conn, args[0], args[1], args[2]);
        break;
      case 'set-password':
        await setPassword(conn, args[0], args[1]);
        break;
      case 'set-role':
        await setRole(conn, args[0], args[1]);
        break;
      case 'delete':
        await remove(conn, args[0]);
        break;
      default:
        console.log(
          'Usage: node scripts/manage-user.js <list|create|set-password|set-role|delete> [args...]',
        );
        process.exitCode = 1;
    }
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exitCode = 1;
});
