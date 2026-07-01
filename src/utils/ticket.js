/**
 * Utility untuk manajemen tiket
 * Data disimpan di config.json per guild:
 * {
 *   ticket: {
 *     memberChannel: "channel_id",   // channel panel member (tombol buat tiket)
 *     adminChannel: "channel_id",    // channel panel admin (notif + claim)
 *     tickets: {
 *       "thread_id": {
 *         userId: "...",
 *         username: "...",
 *         status: "open" | "claimed" | "paused" | "closed",
 *         claimedBy: "user_id" | null,
 *         createdAt: timestamp,
 *         adminMessageId: "...",  // pesan notif di admin channel
 *       }
 *     }
 *   }
 * }
 */

const { getGuildConfig, setGuildConfig } = require('./storage');

function getTicketConfig(guildId) {
  const cfg = getGuildConfig(guildId);
  return cfg.ticket ?? {};
}

function setTicketConfig(guildId, updates) {
  const cfg = getGuildConfig(guildId);
  cfg.ticket = { ...(cfg.ticket ?? {}), ...updates };
  setGuildConfig(guildId, { ticket: cfg.ticket });
}

function getTickets(guildId) {
  return getTicketConfig(guildId).tickets ?? {};
}

function getTicket(guildId, threadId) {
  return getTickets(guildId)[threadId] ?? null;
}

function saveTicket(guildId, threadId, data) {
  const cfg = getTicketConfig(guildId);
  const tickets = cfg.tickets ?? {};
  tickets[threadId] = { ...(tickets[threadId] ?? {}), ...data };
  setTicketConfig(guildId, { tickets });
}

function removeTicket(guildId, threadId) {
  const cfg = getTicketConfig(guildId);
  const tickets = cfg.tickets ?? {};
  delete tickets[threadId];
  setTicketConfig(guildId, { tickets });
}

// Cek apakah user sudah punya tiket open/paused
function getUserActiveTicket(guildId, userId) {
  const tickets = getTickets(guildId);
  return Object.entries(tickets).find(
    ([, t]) => t.userId === userId && ['open', 'claimed', 'paused'].includes(t.status)
  ) ?? null;
}

module.exports = {
  getTicketConfig,
  setTicketConfig,
  getTickets,
  getTicket,
  saveTicket,
  removeTicket,
  getUserActiveTicket,
};
