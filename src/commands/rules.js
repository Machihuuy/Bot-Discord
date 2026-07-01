const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

const MODAL_ID = 'rules_modal';

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
  modalId: MODAL_ID,

  data: new SlashCommandBuilder()
    .setName('rules')
    .setDescription('Kirim embed peraturan server ke sebuah channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel tujuan pengiriman rules')
        .setRequired(true)
    ),

  // ── Langkah 1: Tampilkan modal ──────────────────────────────────────────
  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const customId = `${MODAL_ID}§${channel.id}`;

    const modal = new ModalBuilder()
      .setCustomId(customId)
      .setTitle('Form Rules Server');

    const judulInput = new TextInputBuilder()
      .setCustomId('judul')
      .setLabel('Judul')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Contoh: RULES SERVER')
      .setMaxLength(100)
      .setRequired(true);

    const deskripsiInput = new TextInputBuilder()
      .setCustomId('deskripsi')
      .setLabel('Deskripsi / Isi Rules')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Tulis semua peraturan di sini...')
      .setMinLength(5)
      .setMaxLength(4000)
      .setRequired(true);

    const warnaInput = new TextInputBuilder()
      .setCustomId('warna')
      .setLabel('Warna Embed (opsional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('#ff5733  —  atau: merah, biru, hijau, pink, ungu...')
      .setMaxLength(30)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(judulInput),
      new ActionRowBuilder().addComponents(deskripsiInput),
      new ActionRowBuilder().addComponents(warnaInput),
    );

    await interaction.showModal(modal);
  },

  // ── Langkah 2: Kirim embed ke channel ────────────────────────────────────
  async modalSubmit(interaction) {
    const parts     = interaction.customId.split('§');
    const channelId = parts[1];

    const targetChannel = interaction.guild.channels.cache.get(channelId);
    if (!targetChannel) {
      return interaction.reply({
        content: '❌ Channel tujuan tidak ditemukan.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const judul     = interaction.fields.getTextInputValue('judul').trim();
    const deskripsi = interaction.fields.getTextInputValue('deskripsi').trim();
    const warnaRaw  = interaction.fields.getTextInputValue('warna').trim();
    const warna     = parseColor(warnaRaw);

    const embed = new EmbedBuilder()
      .setColor(warna)
      .setTitle(judul)
      .setDescription(deskripsi);

    await targetChannel.send({ embeds: [embed] });
    await interaction.reply({
      content: `✅ Rules berhasil dikirim ke ${targetChannel}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
