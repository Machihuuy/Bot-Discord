const { ActivityType } = require('discord.js');
const { ensureAdminAccess } = require('../utils/access');

module.exports = {
  name: 'ready',
  once: true,

  async execute(client) {
    console.log(`\nOnline as: ${client.user.tag}`);
    console.log(`Connected to ${client.guilds.cache.size} server(s)\n`);

    // Set activity — tampilkan nama server pertama
    const guildName = client.guilds.cache.first()?.name ?? 'server';
    client.user.setPresence({
      activities: [
        {
          name: guildName,
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // Pastikan owner tiap server punya role administrator
    for (const guild of client.guilds.cache.values()) {
      try {
        const owner = await guild.fetchOwner();
        ensureAdminAccess(guild.id, owner.id);
      } catch { /* skip */ }
    }
  },
};
