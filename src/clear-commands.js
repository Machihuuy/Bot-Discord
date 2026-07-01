require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs   = require('fs');
const path = require('path');

const rest = new REST().setToken(process.env.BOT_TOKEN);

// Kumpulkan command yang aktif
const commandDefs = [];
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const cmd = require(path.join(commandsPath, file));
  if (cmd.data) commandDefs.push(cmd.data.toJSON());
}

(async () => {
  try {
    console.log('🧹 Menghapus semua global commands lama...');
    // PUT dengan array kosong = hapus semua
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: [] });
    console.log('✅ Semua global commands berhasil dihapus.\n');

    console.log(`deploy ${commandDefs.length} command baru secara global...`);
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commandDefs });
    console.log('✅ Deploy selesai! Command aktif:');
    commandDefs.forEach(c => console.log(`   /${c.name}`));
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
