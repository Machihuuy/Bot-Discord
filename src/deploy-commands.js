require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`deploy ${commands.length} slash command(s)...`);

    // Deploy ke guild tertentu (lebih cepat untuk testing)
    // Ganti dengan Routes.applicationCommands(clientId) untuk deploy global
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Semua slash command berhasil dideploy!');
  } catch (error) {
    console.error('❌ Gagal deploy commands:', error);
  }
})();
