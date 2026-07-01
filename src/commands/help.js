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
          value: '`/setwelcome` — atur pesan, gambar, warna, dan channel welcome\n`/testwelcome` — preview welcome message sebelum live',
        },
        {
          name: 'Server',
          value: '`/rules` — kirim embed rules ke channel\n`/biodata` — kirim biodata ke channel\n`/sendimage` — kirim gambar dalam embed ke channel',
        },
        {
          name: 'Akses & Pengaturan',
          value: '`/addaccess` — tambah, hapus, atau lihat daftar akses user\n`/settings` — pengaturan bot untuk server ini\n`/ticket setup` — setup sistem tiket',
        },
        {
          name: 'Role',
          value: '`Administrator` — akses semua command, bisa kelola akses\n`Operator` — akses rules, biodata, sendimage, setwelcome, testwelcome\n`User` — akses biodata',
        },
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
  },
};
