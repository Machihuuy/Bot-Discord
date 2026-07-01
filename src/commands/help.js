const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Tampilkan semua command yang tersedia'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle('Command List')
      .addFields(
        {
          name: 'Welcome',
          value: '`/setwelcome` — atur pesan, gambar, warna, footer, dan channel welcome\n`/testwelcome` — preview welcome message sebelum aktif',
        },
        {
          name: 'Server',
          value: '`/rules` — kirim embed rules ke channel\n`/biodata` — kirim biodata ke channel\n`/sendimage` — kirim gambar dalam embed ke channel',
        },
        {
          name: 'Tiket',
          value: '`/ticket setup` — setup panel tiket member dan admin',
        },
        {
          name: 'Akses & Pengaturan',
          value: '`/addaccess` — kelola akses command bot per user\n`/settings` — pengaturan bot\n`/help` — tampilkan halaman ini',
        },
        {
          name: 'Role Akses',
          value: '`Administrator` — semua command, kelola akses\n`Operator` — bisa dipilih command apa saja saat setup akses\n`User` — biodata',
        },
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
