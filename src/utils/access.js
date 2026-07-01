/**
 * Sistem akses berbasis role bot (bukan Discord role)
 * Role: administrator > operator > user
 *
 * Data disimpan di config.json per guild:
 * {
 *   "access": {
 *     "USER_ID": {
 *       "role": "administrator" | "operator" | "user",
 *       "commands": ["all"] | ["rules", "biodata", ...]
 *     }
 *   }
 * }
 */

const { getGuildConfig, setGuildConfig } = require('./storage');

const ROLES      = ['administrator', 'operator', 'user'];
const ROLE_LEVEL = { administrator: 3, operator: 2, user: 1 };

// Command yang bisa diakses tiap role (selain /help yang bebas)
const ROLE_COMMANDS = {
  administrator: ['all'],
  operator:      ['rules', 'biodata', 'sendimage', 'setwelcome', 'testwelcome', 'addaccess', 'settings', 'ticket'],
  user:          ['biodata'],
};

// Command yang tidak perlu cek akses
const PUBLIC_COMMANDS = ['help', 'ticket'];

/**
 * Ambil data akses semua user di guild
 */
function getAccess(guildId) {
  const cfg = getGuildConfig(guildId);
  return cfg.access ?? {};
}

/**
 * Ambil role bot seorang user di guild
 * @returns {'administrator'|'operator'|'user'|null}
 */
function getUserRole(guildId, userId) {
  const access = getAccess(guildId);
  return access[userId]?.role ?? null;
}

/**
 * Cek apakah user punya akses ke command tertentu
 */
function hasAccess(guildId, userId, commandName) {
  // Command publik bebas diakses siapa saja
  if (PUBLIC_COMMANDS.includes(commandName)) return true;

  const access = getAccess(guildId);
  const entry  = access[userId];
  if (!entry) return false;

  const { role, commands } = entry;
  if (role === 'administrator') return true; // admin bisa semua
  if (!commands) return false;
  return commands.includes('all') || commands.includes(commandName);
}

/**
 * Tambah atau update akses user
 */
function setUserAccess(guildId, userId, role, commands) {
  const cfg    = getGuildConfig(guildId);
  const access = cfg.access ?? {};
  access[userId] = { role, commands };
  setGuildConfig(guildId, { access });
}

/**
 * Hapus akses user
 */
function removeUserAccess(guildId, userId) {
  const cfg    = getGuildConfig(guildId);
  const access = cfg.access ?? {};
  delete access[userId];
  setGuildConfig(guildId, { access });
}

/**
 * Tandai user sebagai administrator (untuk yang invite bot)
 * Hanya set jika belum punya akses
 */
function ensureAdminAccess(guildId, userId) {
  const access = getAccess(guildId);
  if (!access[userId]) {
    setUserAccess(guildId, userId, 'administrator', ['all']);
  }
}

/**
 * Cek apakah user bisa memberi role tertentu ke orang lain
 * Administrator bisa beri administrator/operator/user
 * Operator hanya bisa beri user
 */
function canAssignRole(assignerRole, targetRole) {
  if (assignerRole === 'administrator') return true;
  if (assignerRole === 'operator' && targetRole === 'user') return true;
  return false;
}

module.exports = {
  ROLES,
  ROLE_LEVEL,
  ROLE_COMMANDS,
  PUBLIC_COMMANDS,
  getAccess,
  getUserRole,
  hasAccess,
  setUserAccess,
  removeUserAccess,
  ensureAdminAccess,
  canAssignRole,
};
