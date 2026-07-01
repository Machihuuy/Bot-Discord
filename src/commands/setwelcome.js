const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  EmbedBuilder,
  ChannelType,
  MessageFlags,
} = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../utils/storage');

const MODAL_ID = 'setwelcome_modal';

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
    .setName('setwelcome')
    .setDescription('Konfigurasi pesan welcome channel')
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel untuk mengirim pesan welcome')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addAttachmentOption(option =>
      option
        .setName('gambar')
        .setDescription('Gambar banner di welcome message (opsional)')
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  // ── Langkah 1: Simpan gambar & channel ke storage, lalu tampilkan modal ────
  async execute(interaction) {
    const attachment    = interaction.options.getAttachment('gambar');
    const channelOption = interaction.options.getChannel('channel');

    if (attachment && !attachment.contentType?.startsWith('image/')) {
      return interaction.reply({
        content: '❌ File harus berupa gambar (jpg, png, gif, webp).',
        flags: MessageFlags.Ephemeral,
      });
    }

    // Simpan ke storage SEBELUM modal — agar URL gambar tidak corrupt di customId
    const updates = {};
    if (attachment)    updates.welcomeImage   = attachment.url;
    if (channelOption) updates.welcomeChannel = channelOption.id;
    if (Object.keys(updates).length > 0) setGuildConfig(interaction.guild.id, updates);

    const cfg = getGuildConfig(interaction.guild.id);

    const modal = new ModalBuilder()
      .setCustomId(MODAL_ID)
      .setTitle('Konfigurasi Welcome');

    // Label max 45 karakter — diperpendek
    const pesanInput = new TextInputBuilder()
      .setCustomId('pesan')
      .setLabel('Teks Welcome ({user} dan {server})')   // 38 karakter ✓
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Hi {user}! Welcome to {server} 🎉\nFeel free to look around!')
      .setValue(cfg.welcomeText ?? '')
      .setMaxLength(500)
      .setRequired(true);

    const warnaInput = new TextInputBuilder()
      .setCustomId('warna')
      .setLabel('Warna Embed (opsional)')               // 22 karakter ✓
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('#ff5733  —  atau: merah, biru, hijau, pink...')
      .setValue(cfg.welcomeColor ?? '')
      .setMaxLength(30)
      .setRequired(false);

    const hapusGambarInput = new TextInputBuilder()
      .setCustomId('hapus_gambar')
      .setLabel('Hapus gambar? (ketik "ya" untuk hapus)') // 42 karakter ✓
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Kosongkan untuk mempertahankan gambar')
      .setMaxLength(2)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId('footer')
      .setLabel('Footer Embed (opsional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Contoh: Selamat datang di server kami!')
      .setValue(cfg.welcomeFooter ?? '')
      .setMaxLength(100)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(pesanInput),
      new ActionRowBuilder().addComponents(warnaInput),
      new ActionRowBuilder().addComponents(hapusGambarInput),
      new ActionRowBuilder().addComponents(footerInput),
    );

    await interaction.showModal(modal);
  },

  // ── Langkah 2: Simpan teks & warna, kirim preview ─────────────────────────
  async modalSubmit(interaction) {
    const pesan       = interaction.fields.getTextInputValue('pesan').trim();
    const warna       = interaction.fields.getTextInputValue('warna').trim();
    const hapusGambar = interaction.fields.getTextInputValue('hapus_gambar').trim().toLowerCase();
    const footer      = interaction.fields.getTextInputValue('footer').trim();

    const updates = { welcomeText: pesan, welcomeColor: warna, welcomeFooter: footer };
    if (hapusGambar === 'ya') updates.welcomeImage = '';
    setGuildConfig(interaction.guild.id, updates);

    const cfg        = getGuildConfig(interaction.guild.id);
    const finalColor = parseColor(warna);

    const previewText = pesan
      .replace(/{user}/g, interaction.user.toString())
      .replace(/{server}/g, interaction.guild.name);

    const embed = new EmbedBuilder()
      .setColor(finalColor)
      .setDescription(previewText)
      .setTimestamp();

    if (cfg.welcomeImage) embed.setImage(cfg.welcomeImage);
    if (footer) embed.setFooter({ text: footer });

    const channelInfo = cfg.welcomeChannel
      ? `\nWelcome channel: <#${cfg.welcomeChannel}>`
      : '\nChannel belum diset — tambahkan opsi `channel` di `/setwelcome`.';

    await interaction.reply({
      content: `✅ Konfigurasi welcome berhasil disimpan!${channelInfo}\n\n**Preview:**`,
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
};
