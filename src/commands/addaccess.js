const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  MessageFlags,
} = require('discord.js');
const {
  getAccess,
  getUserRole,
  setUserAccess,
  removeUserAccess,
  canAssignRole,
  ROLE_COMMANDS,
} = require('../utils/access');

const CMD_ID = 'addaccess';

const COMMAND_LABELS = {
  rules:       '/rules',
  biodata:     '/biodata',
  sendimage:   '/sendimage',
  setwelcome:  '/setwelcome',
  testwelcome: '/testwelcome',
};

module.exports = {
  buttonId: CMD_ID,

  data: new SlashCommandBuilder()
    .setName('addaccess')
    .setDescription('Kelola akses command bot per user'),

  async execute(interaction) {
    const myRole = getUserRole(interaction.guild.id, interaction.user.id);

    if (myRole !== 'administrator' && myRole !== 'operator') {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki permission untuk menggunakan command ini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.reply({
      embeds: [mainMenuEmbed(interaction.guild.name)],
      components: [mainMenuRow(myRole)],
      flags: MessageFlags.Ephemeral,
    });
  },

  async buttonHandle(interaction) {
    const myRole = getUserRole(interaction.guild.id, interaction.user.id);
    const [, action, ...rest] = interaction.customId.split(':');

    if (action === 'menu') {
      return interaction.update({
        embeds: [mainMenuEmbed(interaction.guild.name)],
        components: [mainMenuRow(myRole)],
      });
    }

    // ── TAMBAH AKSES ───────────────────────────────────────────────────────
    if (action === 'add_start') {
      if (myRole !== 'administrator' && myRole !== 'operator') {
        return interaction.reply({ content: '❌ Tidak ada permission.', flags: MessageFlags.Ephemeral });
      }

      const modal = new ModalBuilder()
        .setCustomId('addaccess_modal:add_userid')
        .setTitle('Tambah Akses');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('userid')
            .setLabel('User ID atau Username')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Contoh: 123456789012345678 atau namauser')
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (action === 'add_role') {
      const targetId = rest[0];
      if (myRole !== 'administrator' && myRole !== 'operator') {
        return interaction.reply({ content: '❌ Tidak ada permission.', flags: MessageFlags.Ephemeral });
      }

      let targetUser;
      try {
        targetUser = await interaction.client.users.fetch(targetId);
      } catch {
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('❌ User tidak ditemukan. Pastikan ID atau username benar.')],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:add_start`).setLabel('Coba Lagi').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const roleOptions = [];
      if (myRole === 'administrator') {
        roleOptions.push(
          { label: 'Administrator', description: 'Akses penuh semua command', value: `role:${targetId}:administrator` },
          { label: 'Operator', description: 'Akses setwelcome, rules, biodata, sendimage', value: `role:${targetId}:operator` },
        );
      }
      roleOptions.push({ label: 'User', description: 'Akses biodata', value: `role:${targetId}:user` });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Pilih Role')
          .setDescription(`Pilih role untuk **${targetUser.tag}**\nID: \`${targetUser.id}\``)
          .setThumbnail(targetUser.displayAvatarURL())],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`${CMD_ID}:select_role`)
              .setPlaceholder('Pilih role...')
              .addOptions(roleOptions)
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    // ── HAPUS AKSES ────────────────────────────────────────────────────────
    if (action === 'remove_start') {
      if (myRole !== 'administrator') {
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('❌ Hanya Administrator yang bisa menghapus akses.')],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('addaccess_modal:remove_userid')
        .setTitle('Hapus Akses');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('userid')
            .setLabel('User ID atau Username')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Contoh: 123456789012345678 atau namauser')
            .setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    if (action === 'remove_confirm') {
      const targetId   = rest[0];
      let targetUser;
      try { targetUser = await interaction.client.users.fetch(targetId); } catch { targetUser = null; }
      const targetRole = getUserRole(interaction.guild.id, targetId);
      const name       = targetUser ? targetUser.tag : targetId;
      const userId     = targetUser ? targetUser.id : targetId;

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('Konfirmasi Hapus Akses')
          .setDescription(
            `Apakah kamu yakin ingin menghapus akses **${name}**?\n` +
            `ID: \`${userId}\`\n` +
            `Role saat ini: **${targetRole ?? 'tidak ada'}**\n\n` +
            `Tindakan ini tidak bisa dibatalkan.`
          )],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${CMD_ID}:remove_do:${targetId}`).setLabel('Ya, Hapus').setStyle(ButtonStyle.Danger),
          new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Batal').setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    if (action === 'remove_do') {
      if (myRole !== 'administrator') {
        return interaction.reply({ content: '❌ Tidak ada permission.', flags: MessageFlags.Ephemeral });
      }
      const targetId = rest[0];
      let targetUser;
      try { targetUser = await interaction.client.users.fetch(targetId); } catch { targetUser = null; }
      const name = targetUser ? targetUser.tag : targetId;

      removeUserAccess(interaction.guild.id, targetId);

      if (targetUser) {
        const dmEmbed = new EmbedBuilder()
          .setColor(0xed4245)
          .setTitle('Akses Bot Dicabut')
          .setDescription(`Akses kamu untuk menggunakan bot di server **${interaction.guild.name}** telah dicabut.`)
          .setTimestamp();
        try { await targetUser.send({ embeds: [dmEmbed] }); } catch { /* DM dimatikan */ }
      }

      return interaction.update({
        embeds: [new EmbedBuilder().setColor(0x57f287).setDescription(`✅ Akses **${name}** berhasil dihapus.`)],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali ke Menu').setStyle(ButtonStyle.Secondary),
        )],
      });
    }

    // ── LIST AKSES ─────────────────────────────────────────────────────────
    if (action === 'list') {
      const access  = getAccess(interaction.guild.id);
      const entries = Object.entries(access);

      if (entries.length === 0) {
        return interaction.update({
          embeds: [new EmbedBuilder().setColor(0xffa500).setTitle('Daftar Akses').setDescription('Belum ada user yang terdaftar.')],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const lines = await Promise.all(entries.map(async ([uid, data]) => {
        let username = 'Unknown';
        let tag      = uid;
        try {
          const u = await interaction.client.users.fetch(uid);
          username = u.username;
          tag      = u.tag;
        } catch {}
        const cmds = data.commands?.includes('all')
          ? 'Semua command'
          : (data.commands ?? []).map(c => `/${c}`).join(', ');
        return `**${tag}**\nUsername: \`${username}\` | ID: \`${uid}\`\nRole: \`${data.role}\` | Command: \`${cmds}\``;
      }));

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle(`Daftar Akses (${entries.length} user)`)
          .setDescription(lines.join('\n\n'))
          .setTimestamp()],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
        )],
      });
    }
  },

  async selectHandle(interaction) {
    const myRole = getUserRole(interaction.guild.id, interaction.user.id);
    const [, action] = interaction.customId.split(':');

    if (action === 'select_role') {
      const value    = interaction.values[0];
      const parts    = value.split(':');
      const targetId = parts[1];
      const roleName = parts[2];

      if (!canAssignRole(myRole, roleName)) {
        return interaction.reply({ content: '❌ Kamu tidak bisa memberikan role ini.', flags: MessageFlags.Ephemeral });
      }

      let targetUser;
      try { targetUser = await interaction.client.users.fetch(targetId); } catch { targetUser = null; }
      const name = targetUser ? targetUser.tag : targetId;

      if (roleName === 'administrator') {
        setUserAccess(interaction.guild.id, targetId, 'administrator', ['all']);
        await sendAccessDM(targetUser, interaction.guild.name, 'administrator', ['all']);

        return interaction.update({
          embeds: [new EmbedBuilder()
            .setColor(0x57f287)
            .setTitle('✅ Akses Ditambahkan')
            .setDescription(`**${name}** (ID: \`${targetId}\`) diberikan role **Administrator** (akses semua command).`)],
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali ke Menu').setStyle(ButtonStyle.Secondary),
          )],
        });
      }

      const availableCommands = ROLE_COMMANDS[roleName];
      const commandOptions    = availableCommands.map(cmd => ({
        label: COMMAND_LABELS[cmd] ?? `/${cmd}`,
        value: cmd,
      }));

      const { setGuildConfig } = require('../utils/storage');
      setGuildConfig(interaction.guild.id, {
        [`pendingAccess_${interaction.user.id}`]: { targetId, roleName },
      });

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('Pilih Command')
          .setDescription(`Pilih command untuk **${name}** (role: **${roleName}**).\nBisa pilih lebih dari satu.`)],
        components: [
          new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId(`${CMD_ID}:select_commands`)
              .setPlaceholder('Pilih command...')
              .setMinValues(1)
              .setMaxValues(commandOptions.length)
              .addOptions(commandOptions)
          ),
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali').setStyle(ButtonStyle.Secondary),
          ),
        ],
      });
    }

    if (action === 'select_commands') {
      const { getGuildConfig, setGuildConfig } = require('../utils/storage');
      const cfg     = getGuildConfig(interaction.guild.id);
      const pending = cfg[`pendingAccess_${interaction.user.id}`];

      if (!pending) {
        return interaction.reply({ content: '❌ Sesi habis. Mulai ulang dari /addaccess.', flags: MessageFlags.Ephemeral });
      }

      const { targetId, roleName } = pending;
      const selectedCommands = interaction.values;

      setUserAccess(interaction.guild.id, targetId, roleName, selectedCommands);

      const allCfg = getGuildConfig(interaction.guild.id);
      delete allCfg[`pendingAccess_${interaction.user.id}`];
      setGuildConfig(interaction.guild.id, allCfg);

      let targetUser;
      try { targetUser = await interaction.client.users.fetch(targetId); } catch { targetUser = null; }
      const name = targetUser ? targetUser.tag : targetId;

      await sendAccessDM(targetUser, interaction.guild.name, roleName, selectedCommands);

      return interaction.update({
        embeds: [new EmbedBuilder()
          .setColor(0x57f287)
          .setTitle('✅ Akses Berhasil Ditambahkan')
          .addFields(
            { name: 'User', value: `${name}\nID: \`${targetId}\``, inline: true },
            { name: 'Role', value: roleName, inline: true },
            { name: 'Command', value: selectedCommands.map(c => `\`/${c}\``).join(', ') },
          )
          .setTimestamp()],
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId(`${CMD_ID}:menu`).setLabel('Kembali ke Menu').setStyle(ButtonStyle.Secondary),
        )],
      });
    }
  },
};

// ── Helpers ────────────────────────────────────────────────────────────────────

async function sendAccessDM(targetUser, guildName, role, commands) {
  if (!targetUser) return;

  const roleInfo = {
    administrator: { label: 'Administrator', desc: 'Kamu memiliki akses penuh ke semua command bot dan dapat mengelola akses user lain.' },
    operator:      { label: 'Operator',      desc: 'Kamu dapat menggunakan command server management dan menambahkan role User ke orang lain.' },
    user:          { label: 'User',          desc: 'Kamu dapat menggunakan command dasar yang tersedia.' },
  };

  const info = roleInfo[role] ?? { label: role, desc: '' };
  const commandList = commands.includes('all')
    ? 'Semua command (`/rules`, `/biodata`, `/sendimage`, `/setwelcome`, `/testwelcome`, `/addaccess`)'
    : commands.map(c => `\`/${c}\``).join(', ');

  const embed = new EmbedBuilder()
    .setColor(role === 'administrator' ? 0xf0b429 : role === 'operator' ? 0x5865f2 : 0x57f287)
    .setTitle('Kamu Mendapat Akses Bot')
    .setDescription(`Kamu telah diberikan akses bot di server **${guildName}**.`)
    .addFields(
      { name: 'Role', value: `**${info.label}**` },
      { name: 'Deskripsi Role', value: info.desc },
      { name: 'Command yang Bisa Diakses', value: commandList },
    )
    .setTimestamp();

  try { await targetUser.send({ embeds: [embed] }); } catch { /* DM dimatikan */ }
}

function mainMenuEmbed(guildName) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Manajemen Akses Bot')
    .setDescription(
      `Kelola siapa saja yang bisa menggunakan command bot di **${guildName}**.\n\n` +
      '**Role yang tersedia:**\n' +
      '**Administrator** — Akses penuh semua command + kelola akses\n' +
      '**Operator** — Akses setwelcome, rules, biodata, sendimage\n' +
      '**User** — Akses biodata'
    )
    .setTimestamp();
}

function mainMenuRow(myRole) {
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`${CMD_ID}:add_start`).setLabel('Tambah Akses').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`${CMD_ID}:list`).setLabel('List Akses').setStyle(ButtonStyle.Primary),
  );

  if (myRole === 'administrator') {
    row.addComponents(
      new ButtonBuilder().setCustomId(`${CMD_ID}:remove_start`).setLabel('Hapus Akses').setStyle(ButtonStyle.Danger),
    );
  }

  return row;
}
