const {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  MessageFlags,
} = require('discord.js');

const MODAL_ID = 'biodata_modal';

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

function parseColor(input, defaultColor = 0x5865f2) {
  if (!input) return defaultColor;
  const clean = input.trim().toLowerCase();
  if (WARNA_MAP[clean] !== undefined) return WARNA_MAP[clean];
  const hex = clean.startsWith('#') ? clean.slice(1) : clean;
  if (/^[0-9a-f]{6}$/i.test(hex)) return parseInt(hex, 16);
  return defaultColor;
}

module.exports = {
  modalId: MODAL_ID,

  data: new SlashCommandBuilder()
    .setName('biodata')
    .setDescription('Isi biodata dan kirim ke channel profil')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel tujuan pengiriman biodata')
        .setRequired(true)
    ),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');

    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_ID}:${channel.id}`)
      .setTitle('Form Biodata');

    const deskripsiInput = new TextInputBuilder()
      .setCustomId('deskripsi')
      .setLabel('Deskripsi')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Ceritakan tentang dirimu...')
      .setMinLength(5)
      .setMaxLength(4000)
      .setRequired(true);

    const warnaInput = new TextInputBuilder()
      .setCustomId('warna')
      .setLabel('Warna Embed (opsional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('#ff5733  —  atau: merah, biru, hijau, ungu, emas...')
      .setMaxLength(30)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(deskripsiInput),
      new ActionRowBuilder().addComponents(warnaInput),
    );

    await interaction.showModal(modal);
  },

  async modalSubmit(interaction) {
    const channelId = interaction.customId.split(':')[1];

    const targetChannel = interaction.guild.channels.cache.get(channelId);
    if (!targetChannel) {
      return interaction.reply({
        content: '❌ Channel tujuan tidak ditemukan.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const deskripsi = interaction.fields.getTextInputValue('deskripsi').trim();
    const warnaRaw  = interaction.fields.getTextInputValue('warna').trim();
    const warna     = parseColor(warnaRaw);

    const embed = new EmbedBuilder()
      .setColor(warna)
      .setTitle('𝓐𝓫𝓸𝓾𝓽 𝓶𝓮')
      .setDescription(deskripsi)
      .setThumbnail('https://cdn.discordapp.com/attachments/1521833663002579016/1522943976225636465/Bust_up_cropped_by_Runarize.png');

    await targetChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Biodata berhasil dikirim ke ${targetChannel}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};

