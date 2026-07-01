const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { generateWelcomeCard } = require('../utils/welcomeCard');

module.exports = {
  name: 'guildMemberRemove',
  once: false,

  async execute(member, client) {
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
