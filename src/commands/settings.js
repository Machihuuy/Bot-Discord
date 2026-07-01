const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../utils/storage');

const CMD_ID = 'settings';

module.exports = {
  buttonId: CMD_ID,

  data: new SlashCommandBuilder()
    .setName('settings')
    .setDescription('Pengaturan bot untuk server ini'),

  async execute(interaction) {
    const cfg = getGuildConfig(interaction.guild.id);
    await interaction.reply({
      embeds: [settingsEmbed(cfg)],
      components: [settingsRow(cfg)],
      flags: MessageFlags.Ephemeral,
    });
  },

  async buttonHandle(interaction) {
    const [, action] = interaction.customId.split(':');
    const cfg = getGuildConfig(interaction.guild.id);

    if (action === 'toggle_dm_access') {
      const current = cfg.dmAccess !== false; // default true
      setGuildConfig(interaction.guild.id, { dmAccess: !current });
      const updated = getGuildConfig(interaction.guild.id);
      return interaction.update({
        embeds: [settingsEmbed(updated)],
        components: [settingsRow(updated)],
      });
    }
  },
};

function settingsEmbed(cfg) {
  const dmAccess = cfg.dmAccess !== false;

  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Pengaturan Bot')
    .addFields(
      {
        name: 'DM Notifikasi Akses',
        value: `Kirim DM ke user saat akses ditambahkan atau dicabut.\nStatus: **${dmAccess ? 'Aktif' : 'Nonaktif'}**`,
      },
    );
}

function settingsRow(cfg) {
  const dmAccess = cfg.dmAccess !== false;

  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${CMD_ID}:toggle_dm_access`)
      .setLabel(dmAccess ? 'Nonaktifkan DM Akses' : 'Aktifkan DM Akses')
      .setStyle(dmAccess ? ButtonStyle.Danger : ButtonStyle.Success),
  );
}
