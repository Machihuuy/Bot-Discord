const {
  SlashCommandBuilder,
  EmbedBuilder,
  MessageFlags,
  ChannelType,
} = require('discord.js');
const { getGuildConfig, setGuildConfig } = require('../utils/storage');

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
    .setName('sendimage')
    .setDescription('Send an image to a channel in an embed')
    .addAttachmentOption(option =>
      option
        .setName('gambar')
        .setDescription('Gambar yang akan dikirim')
        .setRequired(true)
    )
    .addChannelOption(option =>
      option
        .setName('channel')
        .setDescription('Channel tujuan (default: channel saat ini)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addStringOption(option =>
      option
        .setName('warna')
        .setDescription('Warna embed: hex (#ff5733) atau nama (merah, biru, pink, ungu...)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const attachment    = interaction.options.getAttachment('gambar');
    const targetChannel = interaction.options.getChannel('channel') ?? interaction.channel;
    const warnaRaw      = interaction.options.getString('warna') ?? '';

    // Validasi file
    if (!attachment.contentType?.startsWith('image/')) {
      return interaction.reply({
        content: '❌ File harus berupa gambar (jpg, png, gif, webp).',
        flags: MessageFlags.Ephemeral,
      });
    }

    const warna = parseColor(warnaRaw);

    // Embed hanya berisi gambar — tidak ada teks lain
    const embed = new EmbedBuilder()
      .setColor(warna)
      .setImage(attachment.url);

    await targetChannel.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Gambar berhasil dikirim ke ${targetChannel}!`,
      flags: MessageFlags.Ephemeral,
    });
  },
};
