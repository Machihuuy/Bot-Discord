const { ensureAdminAccess } = require('../utils/access');

module.exports = {
  name: 'guildCreate',
  once: false,

  async execute(guild, client) {
    console.log(`✅ Bot bergabung ke server: ${guild.name} (${guild.id})`);

    // Ambil owner server dan beri role administrator otomatis
    try {
      const owner = await guild.fetchOwner();
      ensureAdminAccess(guild.id, owner.id);
      console.log(`👑 Administrator otomatis: ${owner.user.tag} di ${guild.name}`);
    } catch (err) {
      console.error('Gagal set admin owner:', err.message);
    }
  },
};
