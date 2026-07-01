const { EmbedBuilder } = require('discord.js');
const { getGuildConfig } = require('../utils/storage');

const WARNA_MAP = {
  merah: 0xe74c3c, oranye: 0xe67e22, kuning: 0xf1c40f,
  hijau: 0x2ecc71, tosca: 0x1abc9c, biru: 0x3498db,
  ungu: 0x9b59b6, pink: 0xe91e8c, putih: 0xffffff,
  hitam: 0x23272a, abu: 0x95a5a6, emas: 0xf0b429,
  silver: 0xbdc3c7, navy: 0x2c3e50,
  red: 0xe74c3c, orange: 0xe67e22, yellow: 0xf1c40f,
  green: 0x2ecc71, blue: 0x3498db, purple: 0x9b59b6,
  white: 0xffffff, black: 0x23272a, gray: 0x95a5a6,
  grey: 0x95a5a6, gold: 0xf0b429,
};
function parseColor(input, def = 0x5865f2) {
  if (!input) return def;
  const c = input.trim().toLowerCase();
  if (WARNA_MAP[c] !== undefined) return WARNA_MAP[c];
  const h = c.startsWith('#') ? c.slice(1) : c;
  if (/^[0-9a-f]{6}$/i.test(h)) return parseInt(h, 16);
  return def;
}

module.exports = {
  name: 'guildMemberAdd',
  once: false,

  async execute(member, client) {
    const cfg = getGuildConfig(member.guild.id);

    // Prioritas channel: dari /setwelcome → fallback ke .env
    const channelId = cfg.welcomeChannel || process.env.WELCOME_CHANNEL_ID;
    if (!channelId) return;

    const channel = member.guild.channels.cache.get(channelId);
    if (!channel) return;

    // Teks welcome dengan placeholder
    const rawText = cfg.welcomeText ||
      `Hi {user}! Welcome to **{server}** 🎉\nFeel free to look around!`;

    const welcomeText = rawText
      .replace(/{user}/g, member.toString())
      .replace(/{server}/g, member.guild.name);

    const color = parseColor(cfg.welcomeColor);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(welcomeText);

    if (cfg.welcomeImage)  embed.setImage(cfg.welcomeImage);
    if (cfg.welcomeFooter) embed.setFooter({ text: cfg.welcomeFooter });

    await channel.send({ embeds: [embed] });
  },
};
