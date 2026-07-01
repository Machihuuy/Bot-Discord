const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, MessageFlags } = require('discord.js');
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
  data: new SlashCommandBuilder()
    .setName('testwelcome')
    .setDescription('Preview welcome message sesuai konfigurasi saat ini')
    .addUserOption(option =>
      option
        .setName('target')
        .setDescription('User yang disimulasikan (default: dirimu sendiri)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const member = interaction.options.getMember('target') ?? interaction.member;
    const cfg    = getGuildConfig(interaction.guild.id);

    const rawText = cfg.welcomeText ||
      `Hi {user}! Welcome to **{server}** 🎉\nFeel free to look around!`;

    const welcomeText = rawText
      .replace(/{user}/g, member.toString())
      .replace(/{server}/g, interaction.guild.name);

    const color = parseColor(cfg.welcomeColor);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(welcomeText)
      .setFooter({ text: 'Ini adalah preview — bukan pesan asli' })
      .setTimestamp();

    if (cfg.welcomeImage)  embed.setImage(cfg.welcomeImage);
    if (cfg.welcomeFooter) embed.setFooter({ text: `${cfg.welcomeFooter}  •  Preview` });

    const channelInfo = cfg.welcomeChannel
      ? `\nWelcome channel: <#${cfg.welcomeChannel}>`
      : '\nChannel belum diset — gunakan `/setwelcome channel:#channel`';

    await interaction.reply({
      content: `**Preview welcome message:**${channelInfo}`,
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};

