const { MessageFlags } = require('discord.js');
const { hasAccess } = require('../utils/access');

module.exports = {
  name: 'interactionCreate',
  once: false,

  async execute(interaction, client) {

    // ── Slash Commands ─────────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);

      if (!command) {
        return interaction.reply({ content: '❌ Command tidak ditemukan.', flags: MessageFlags.Ephemeral });
      }

      // Cek akses — /help selalu bisa diakses
      if (!hasAccess(interaction.guild.id, interaction.user.id, interaction.commandName)) {
        return interaction.reply({
          content: '🔒 Kamu tidak memiliki permission untuk menggunakan command ini.',
          flags: MessageFlags.Ephemeral,
        });
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`❌ Error /${interaction.commandName}:`, error);
        const msg = { content: '❌ Terjadi kesalahan saat menjalankan command ini.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      }
      return;
    }

    // ── Button Interactions ────────────────────────────────────────────────
    if (interaction.isButton()) {
      const [prefix] = interaction.customId.split(':');

      // Route ke command yang punya buttonHandle
      for (const command of client.commands.values()) {
        if (command.buttonId && prefix === command.buttonId) {
          try {
            await command.buttonHandle(interaction);
          } catch (error) {
            console.error(`❌ Button error (${interaction.customId}):`, error);
            const msg = { content: '❌ Terjadi kesalahan.', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(msg);
            } else {
              await interaction.reply(msg);
            }
          }
          return;
        }
      }
      return;
    }

    // ── Select Menu Interactions ───────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      const [prefix] = interaction.customId.split(':');

      for (const command of client.commands.values()) {
        if (command.buttonId && prefix === command.buttonId) {
          try {
            await command.selectHandle(interaction);
          } catch (error) {
            console.error(`❌ Select error (${interaction.customId}):`, error);
            const msg = { content: '❌ Terjadi kesalahan.', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(msg);
            } else {
              await interaction.reply(msg);
            }
          }
          return;
        }
      }
      return;
    }

    // ── Modal Submit ───────────────────────────────────────────────────────
    if (interaction.isModalSubmit()) {
      // Route modal addaccess
      if (interaction.customId.startsWith('addaccess_modal:')) {
        const addaccessCmd = client.commands.get('addaccess');
        if (addaccessCmd) {
          const [, action] = interaction.customId.split(':');
          const rawInput   = interaction.fields.getTextInputValue('userid').trim();

          // Resolve user: coba ID dulu, lalu username via guild members
          let resolvedId = rawInput.replace(/[<@!>]/g, '');

          if (!/^\d{15,20}$/.test(resolvedId)) {
            // Bukan angka — coba cari by username di guild
            try {
              await interaction.guild.members.fetch();
              const member = interaction.guild.members.cache.find(
                m =>
                  m.user.username.toLowerCase() === resolvedId.toLowerCase() ||
                  m.user.tag.toLowerCase() === resolvedId.toLowerCase() ||
                  m.displayName.toLowerCase() === resolvedId.toLowerCase()
              );
              if (member) {
                resolvedId = member.user.id;
              } else {
                return interaction.reply({
                  content: `❌ User \`${rawInput}\` tidak ditemukan. Pastikan username atau ID benar.`,
                  flags: MessageFlags.Ephemeral,
                });
              }
            } catch {
              return interaction.reply({
                content: '❌ Gagal mencari user. Coba gunakan User ID.',
                flags: MessageFlags.Ephemeral,
              });
            }
          }

          if (action === 'add_userid') {
            interaction.customId = `addaccess:add_role:${resolvedId}`;
            try {
              await addaccessCmd.buttonHandle(interaction);
            } catch (err) {
              console.error('Modal addaccess error:', err);
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ User tidak ditemukan.', flags: MessageFlags.Ephemeral });
              }
            }
          } else if (action === 'remove_userid') {
            interaction.customId = `addaccess:remove_confirm:${resolvedId}`;
            try {
              await addaccessCmd.buttonHandle(interaction);
            } catch (err) {
              console.error('Modal addaccess error:', err);
              if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: '❌ User tidak ditemukan.', flags: MessageFlags.Ephemeral });
              }
            }
          }
          return;
        }
      }

      // Route modal command biasa
      for (const command of client.commands.values()) {
        if (
          typeof command.modalSubmit === 'function' &&
          interaction.customId.startsWith(command.modalId ?? '')
        ) {
          try {
            await command.modalSubmit(interaction);
          } catch (error) {
            console.error(`❌ Modal error (${interaction.customId}):`, error);
            const msg = { content: '❌ Terjadi kesalahan saat memproses form.', flags: MessageFlags.Ephemeral };
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp(msg);
            } else {
              await interaction.reply(msg);
            }
          }
          return;
        }
      }
    }
  },
};
