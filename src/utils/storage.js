/**
 * Storage sederhana berbasis JSON file untuk menyimpan konfigurasi per guild.
 * Data disimpan di src/data/config.json sehingga tidak hilang saat bot restart.
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR  = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'config.json');

// Pastikan folder & file ada
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '{}', 'utf8');

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeAll(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Ambil config untuk satu guild
 * @param {string} guildId
 */
function getGuildConfig(guildId) {
  const all = readAll();
  return all[guildId] ?? {};
}

/**
 * Set (merge) config untuk satu guild
 * @param {string} guildId
 * @param {object} updates
 */
function setGuildConfig(guildId, updates) {
  const all = readAll();
  all[guildId] = { ...(all[guildId] ?? {}), ...updates };
  writeAll(all);
}

module.exports = { getGuildConfig, setGuildConfig };
