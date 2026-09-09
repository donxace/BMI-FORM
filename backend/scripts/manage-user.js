// Self-service account management for the RBAC login system — add,
// update, remove, or list accounts without needing to hand-write bcrypt
// hashes or SQL.
//
// One account (one username/email/password) can hold a role in more
// than one domain at once — 'admin' stays on users.role (domain-less,
// unrestricted everywhere); every other role lives in user_roles, one
// row per (account, system).
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
//   node scripts/manage-user.js create <username> <password> <role> [email]
//   node scripts/manage-user.js set-password <username> <newPassword>
//   node scripts/manage-user.js set-role <username> <newRole>
//   node scripts/manage-user.js remove-role <username> <system>
//   node scripts/manage-user.js set-email <username> <email>
//   node scripts/manage-user.js delete <username>
//
// Examples:
//   node scripts/manage-user.js create jdelacruz Secret@2026 inventory_editor jdelacruz@example.com
//   node scripts/manage-user.js set-password bmi_viewer NewPass@2026
//   node scripts/manage-user.js set-role jdelacruz inventory_admin
//   node scripts/manage-user.js set-role jdelacruz pcinfo_viewer   <- adds a SECOND domain, doesn't replace the first
//   node scripts/manage-user.js remove-role jdelacruz pcinfo
//   node scripts/manage-user.js set-email jdelacruz jdelacruz@example.com
//   node scripts/manage-user.js delete jdelacruz
//
// An account needs `email` set for it to be able to use "Forgot password?"
// on the login page — /auth/forgot-password looks a user up by email.
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

// Every role so far is "<system>_<tier>" with no underscore in the
// system name itself, so the part before the first "_" is always the
// system — matches the backfill logic in the multi-domain migration.
function systemOf(role) {
  return role.split('_')[0];
}

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

async function getUserIdByUsername(conn, username) {
  const [rows] = await conn.query('SELECT id FROM users WHERE username = ?', [username]);
  if (rows.length === 0) {
    throw new Error(`No user named "${username}" found.`);
  }
  return rows[0].id;
}

async function list(conn) {
  const [rows] = await conn.query(
    `SELECT u.id, u.username, u.email, u.role AS admin_role,
            GROUP_CONCAT(ur.role ORDER BY ur.system SEPARATOR ', ') AS domain_roles
     FROM users u
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     GROUP BY u.id
     ORDER BY u.id`,
  );
  console.table(
    rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      roles: r.admin_role === 'admin' ? 'admin (all systems)' : r.domain_roles || '(none)',
    })),
  );
}

async function create(conn, username, password, role, email) {
  requireRole(role);
  const hash = await bcrypt.hash(password, 10);

  const [result] = await conn.query(
    'INSERT INTO users (username, password_hash, role, email) VALUES (?, ?, ?, ?)',
    [username, hash, role === 'admin' ? 'admin' : null, email || null],
  );

  if (role !== 'admin') {
    await conn.query(
      'INSERT INTO user_roles (user_id, system, role) VALUES (?, ?, ?)',
      [result.insertId, systemOf(role), role],
    );
  }

  console.log(
    `Created "${username}" with role "${role}"${email ? ` and email "${email}"` : ''}.`,
  );
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

async function setEmail(conn, username, email) {
  const [result] = await conn.query(
    'UPDATE users SET email = ? WHERE username = ?',
    [email, username],
  );
  if (result.affectedRows === 0) {
    throw new Error(`No user named "${username}" found.`);
  }
  console.log(`Updated email for "${username}" to "${email}".`);
}

// Adds (or changes the tier of) a role for one domain — never touches
// any OTHER domain's role on this same account, so this is how an
// account ends up with access to more than one system.
async function setRole(conn, username, role) {
  requireRole(role);
  const userId = await getUserIdByUsername(conn, username);

  if (role === 'admin') {
    await conn.query('UPDATE users SET role = ? WHERE id = ?', ['admin', userId]);
    console.log(`Updated "${username}" to role "admin" (unrestricted everywhere).`);
    return;
  }

  await conn.query(
    `INSERT INTO user_roles (user_id, system, role) VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE role = VALUES(role)`,
    [userId, systemOf(role), role],
  );
  console.log(`Updated "${username}" to role "${role}" for the ${systemOf(role)} system.`);
}

async function removeRole(conn, username, system) {
  const userId = await getUserIdByUsername(conn, username);
  const [result] = await conn.query(
    'DELETE FROM user_roles WHERE user_id = ? AND system = ?',
    [userId, system],
  );
  if (result.affectedRows === 0) {
    throw new Error(`"${username}" has no role for system "${system}".`);
  }
  console.log(`Removed "${username}"'s access to ${system}.`);
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
        await create(conn, args[0], args[1], args[2], args[3]);
        break;
      case 'set-password':
        await setPassword(conn, args[0], args[1]);
        break;
      case 'set-role':
        await setRole(conn, args[0], args[1]);
        break;
      case 'remove-role':
        await removeRole(conn, args[0], args[1]);
        break;
      case 'set-email':
        await setEmail(conn, args[0], args[1]);
        break;
      case 'delete':
        await remove(conn, args[0]);
        break;
      default:
        console.log(
          'Usage: node scripts/manage-user.js <list|create|set-password|set-role|remove-role|set-email|delete> [args...]',
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
