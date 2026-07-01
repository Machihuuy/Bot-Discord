const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateWelcomeCard } = require('../utils/welcomeCard');
const { getUserRole, removeUserAccess } = require('../utils/access');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(member, client) {
    // Hapus akses bot jika user punya akses terdaftar
    const role = getUserRole(member.guild.id, member.user.id);
    if (role) {
      removeUserAccess(member.guild.id, member.user.id);
      console.log(`Akses dihapus: ${member.user.tag} keluar dari ${member.guild.name}`);
    }

    const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
    if (!welcomeChannelId) return;

    const channel = member.guild.channels.cache.get(welcomeChannelId);
    if (!channel) return;

    // Generate goodbye card
    let attachment = null;
    try {
      const buffer = await generateWelcomeCard(member, 'goodbye');
      attachment = new AttachmentBuilder(buffer, { name: 'goodbye.png' });
    } catch (err) {
      console.error('Gagal generate goodbye card:', err.message);
    }

    const embed = new EmbedBuilder()
      .setColor(0xed4245)
      .setDescription(
        `### ${member.user.tag} telah meninggalkan server.\n` +
        `Sisa member: **${member.guild.memberCount}**`
      );

    if (attachment) {
      embed.setImage('attachment://goodbye.png');
    }

    await channel.send({
      embeds: [embed],
      files: attachment ? [attachment] : [],
    });
  },
};
