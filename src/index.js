require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Buat client dengan intents yang dibutuhkan
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Collection untuk menyimpan semua commands
client.commands = new Collection();
const commandDefs = []; // untuk deploy ke Discord API

// ── Load Commands ──────────────────────────────────────────────────────────────
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    commandDefs.push(command.data.toJSON());
    console.log(`✅ Command loaded: /${command.data.name}`);
  }
}

// ── Load Events ────────────────────────────────────────────────────────────────
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
  console.log(`✅ Event loaded: ${event.name}`);
}

// ── Auto Deploy Slash Commands saat bot Ready ──────────────────────────────────
client.once('ready', async () => {
  try {
    const rest = new REST().setToken(process.env.BOT_TOKEN);

    // Deploy global dulu sebagai baseline
    console.log('\nDeploy slash commands globally...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commandDefs }
    );
    console.log(`${commandDefs.length} slash commands deployed globally.`);

    // Cek tiap guild — kalau command belum terdeteksi, deploy ke guild itu langsung
    for (const guild of client.guilds.cache.values()) {
      try {
        const existing = await rest.get(
          Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id)
        );

        if (existing.length < commandDefs.length) {
          await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, guild.id),
            { body: commandDefs }
          );
          console.log(`Commands deployed to guild: ${guild.name} (${existing.length} -> ${commandDefs.length})`);
        }
      } catch {
        // Skip jika gagal cek satu guild
      }
    }
  } catch (error) {
    console.error('Failed to deploy commands:', error.message);
  }
});

// Login ke Discord
client.login(process.env.BOT_TOKEN);
