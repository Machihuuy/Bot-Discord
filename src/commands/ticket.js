const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  MessageFlags,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { getUserRole } = require('../utils/access');
const {
  getTicketConfig,
  setTicketConfig,
  getTicket,
  saveTicket,
  removeTicket,
  getUserActiveTicket,
} = require('../utils/ticket');

const CMD_ID = 'ticket';

module.exports = {
  buttonId: CMD_ID,
  modalId: 'ticket_modal',

  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Setup sistem tiket')
    .addSubcommand(sub =>
      sub.setName('setup')
        .setDescription('Setup panel tiket')
        .addChannelOption(opt =>
          opt.setName('member_channel')
            .setDescription('Channel untuk panel tiket member')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('admin_channel')
            .setDescription('Channel untuk panel admin (notifikasi & claim)')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
        .addChannelOption(opt =>
          opt.setName('ticket_channel')
            .setDescription('Channel tempat thread tiket dibuat')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    ),

  // ── Slash command ──────────────────────────────────────────────────────────
  async execute(interaction) {
    const myRole = getUserRole(interaction.guild.id, interaction.user.id);
    if (myRole !== 'administrator' && myRole !== 'operator') {
      return interaction.reply({
        content: '❌ Kamu tidak memiliki permission untuk menggunakan command ini.',
        flags: MessageFlags.Ephemeral,
      });
    }

    const sub = interaction.options.getSubcommand();
    if (sub === 'setup') {
      await handleSetup(interaction);
    }
  },

  // ── Button handler ─────────────────────────────────────────────────────────
  async buttonHandle(interaction) {
    const parts  = interaction.customId.split(':');
    const action = parts[1];

    if (action === 'open') return handleOpenTicket(interaction);
    if (action === 'claim') return handleClaim(interaction, parts[2]);
    if (action === 'close') return handleClose(interaction, parts[2]);
    if (action === 'close_confirm') return handleCloseConfirm(interaction, parts[2]);
    if (action === 'close_cancel') return handleCloseCancel(interaction);
    if (action === 'pause') return handlePause(interaction, parts[2]);
    if (action === 'resume') return handleResume(interaction, parts[2]);
  },

  // ── Modal submit ───────────────────────────────────────────────────────────
  async modalSubmit(interaction) {
    await handleTicketModalSubmit(interaction);
  },
};

// ── Setup ──────────────────────────────────────────────────────────────────────
async function handleSetup(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const memberChannel = interaction.options.getChannel('member_channel');
  const adminChannel  = interaction.options.getChannel('admin_channel');
  const ticketChannel = interaction.options.getChannel('ticket_channel');

  // Simpan config
  setTicketConfig(interaction.guild.id, {
    memberChannelId: memberChannel.id,
    adminChannelId:  adminChannel.id,
    ticketChannelId: ticketChannel.id,
  });

  // Kirim panel ke member channel
  const memberEmbed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('Buat Tiket')
    .setDescription('Klik tombol di bawah untuk membuat tiket baru.\nTim kami akan segera membantu kamu.');

  await memberChannel.send({
    embeds: [memberEmbed],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`${CMD_ID}:open`)
        .setLabel('Buat Tiket')
        .setStyle(ButtonStyle.Primary),
    )],
  });

  await interaction.editReply(
    `✅ Setup selesai!\n- Panel member: ${memberChannel}\n- Panel admin: ${adminChannel}\n- Thread tiket: ${ticketChannel}`
  );
}

// ── Buka tiket (member klik tombol) ───────────────────────────────────────────
async function handleOpenTicket(interaction) {
  const guildId   = interaction.guild.id;
  const userId    = interaction.user.id;
  const myRole    = getUserRole(guildId, userId);

  // Admin/operator tidak bisa buat tiket
  if (myRole === 'administrator' || myRole === 'operator') {
    return interaction.reply({
      content: '❌ Admin dan operator tidak bisa membuat tiket.',
      flags: MessageFlags.Ephemeral,
    });
  }

  // Cek tiket aktif
  const existing = getUserActiveTicket(guildId, userId);
  if (existing) {
    const [threadId] = existing;
    return interaction.reply({
      content: `❌ Kamu sudah punya tiket aktif: <#${threadId}>`,
      flags: MessageFlags.Ephemeral,
    });
  }

  // Tampilkan modal untuk isi topik tiket
  const modal = new ModalBuilder()
    .setCustomId('ticket_modal:create')
    .setTitle('Buat Tiket Baru');

  modal.addComponents(
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('topik')
        .setLabel('Topik')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Apa yang ingin kamu tanyakan?')
        .setMaxLength(100)
        .setRequired(true)
    ),
    new ActionRowBuilder().addComponents(
      new TextInputBuilder()
        .setCustomId('deskripsi')
        .setLabel('Deskripsi (opsional)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Jelaskan lebih detail masalah kamu...')
        .setMaxLength(500)
        .setRequired(false)
    ),
  );

  await interaction.showModal(modal);
}

// ── Modal submit — buat thread tiket ──────────────────────────────────────────
async function handleTicketModalSubmit(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const guildId    = interaction.guild.id;
  const cfg        = getTicketConfig(guildId);
  const topik      = interaction.fields.getTextInputValue('topik').trim();
  const deskripsi  = interaction.fields.getTextInputValue('deskripsi').trim();

  const ticketChannel = interaction.guild.channels.cache.get(cfg.ticketChannelId);
  const adminChannel  = interaction.guild.channels.cache.get(cfg.adminChannelId);

  if (!ticketChannel || !adminChannel) {
    return interaction.editReply('❌ Setup tiket belum lengkap. Hubungi admin untuk run `/ticket setup` ulang.');
  }

  // Buat thread di ticket channel
  const thread = await ticketChannel.threads.create({
    name: `tiket-${interaction.user.username}`,
    autoArchiveDuration: 10080, // 7 hari
    type: ChannelType.PrivateThread,
    reason: `Tiket dari ${interaction.user.tag}`,
  });

  // Tambah pembuat tiket ke thread
  await thread.members.add(interaction.user.id);

  // Pesan pertama di dalam thread
  const threadEmbed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(`Tiket: ${topik}`)
    .setDescription(deskripsi || 'Tidak ada deskripsi tambahan.')
    .addFields(
      { name: 'Dibuat oleh', value: `${interaction.user.tag}`, inline: true },
      { name: 'Status', value: 'Menunggu', inline: true },
    );

  await thread.send({
    content: `${interaction.user}`,
    embeds: [threadEmbed],
    components: [threadControlRow(thread.id, null, 'open')],
  });

  // Notifikasi ke admin channel
  const adminEmbed = new EmbedBuilder()
    .setColor(0xffa500)
    .setTitle('Tiket Baru')
    .addFields(
      { name: 'Member', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
      { name: 'Topik', value: topik, inline: true },
      { name: 'Status', value: 'Menunggu', inline: true },
      { name: 'Thread', value: `<#${thread.id}>` },
    );

  const adminMsg = await adminChannel.send({
    embeds: [adminEmbed],
    components: [adminControlRow(thread.id, null)],
  });

  // Simpan data tiket
  saveTicket(guildId, thread.id, {
    userId:       interaction.user.id,
    username:     interaction.user.tag,
    topik,
    status:       'open',
    claimedBy:    null,
    createdAt:    Date.now(),
    adminMsgId:   adminMsg.id,
    adminChannelId: adminChannel.id,
  });

  await interaction.editReply(`✅ Tiket kamu sudah dibuat: <#${thread.id}>`);
}

// ── Claim tiket (admin dari panel) ────────────────────────────────────────────
async function handleClaim(interaction, threadId) {
  const guildId = interaction.guild.id;
  const myRole  = getUserRole(guildId, interaction.user.id);

  if (myRole !== 'administrator' && myRole !== 'operator') {
    return interaction.reply({ content: '❌ Hanya admin/operator yang bisa claim tiket.', flags: MessageFlags.Ephemeral });
  }

  const tiket = getTicket(guildId, threadId);
  if (!tiket) return interaction.reply({ content: '❌ Data tiket tidak ditemukan.', flags: MessageFlags.Ephemeral });
  if (tiket.status === 'claimed') {
    return interaction.reply({ content: `❌ Tiket ini sudah di-claim.`, flags: MessageFlags.Ephemeral });
  }

  saveTicket(guildId, threadId, { status: 'claimed', claimedBy: interaction.user.id });

  // Tambah claimer ke thread
  const thread = interaction.guild.channels.cache.get(threadId);
  if (thread) await thread.members.add(interaction.user.id);

  // Update pesan di admin channel
  await updateAdminMessage(interaction, threadId, 'claimed');

  // Update pesan di thread
  await updateThreadMessage(interaction, threadId, 'claimed');

  await interaction.reply({
    content: `✅ Kamu berhasil claim tiket <#${threadId}>.`,
    flags: MessageFlags.Ephemeral,
  });
}

// ── Close (dari thread, minta konfirmasi) ─────────────────────────────────────
async function handleClose(interaction, threadId) {
  const guildId = interaction.guild.id;
  const myRole  = getUserRole(guildId, interaction.user.id);
  const tiket   = getTicket(guildId, threadId);

  if (!tiket) return interaction.reply({ content: '❌ Data tiket tidak ditemukan.', flags: MessageFlags.Ephemeral });

  // Admin/operator bisa close, atau member pemilik tiket
  const isStaff  = myRole === 'administrator' || myRole === 'operator';
  const isOwner  = tiket.userId === interaction.user.id;
  if (!isStaff && !isOwner) {
    return interaction.reply({ content: '❌ Kamu tidak bisa menutup tiket ini.', flags: MessageFlags.Ephemeral });
  }

  await interaction.reply({
    embeds: [new EmbedBuilder().setColor(0xed4245).setDescription('Yakin ingin menutup tiket ini?')],
    components: [new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`${CMD_ID}:close_confirm:${threadId}`).setLabel('Ya, Tutup').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId(`${CMD_ID}:close_cancel`).setLabel('Batal').setStyle(ButtonStyle.Secondary),
    )],
    flags: MessageFlags.Ephemeral,
  });
}

async function handleCloseConfirm(interaction, threadId) {
  const guildId = interaction.guild.id;
  const tiket   = getTicket(guildId, threadId);
  if (!tiket) return interaction.update({ content: '❌ Data tiket tidak ditemukan.', components: [] });

  // Tandai closed
  saveTicket(guildId, threadId, { status: 'closed' });

  // Archive thread
  const thread = interaction.guild.channels.cache.get(threadId);
  if (thread) {
    await thread.send({
      embeds: [new EmbedBuilder().setColor(0xed4245).setDescription(`Tiket ditutup oleh ${interaction.user.tag}.`)],
    });
    await thread.setArchived(true);
  }

  // Update admin message
  await updateAdminMessage(interaction, threadId, 'closed');

  // Hapus data tiket
  removeTicket(guildId, threadId);

  await interaction.update({ content: '✅ Tiket berhasil ditutup.', embeds: [], components: [] });
}

async function handleCloseCancel(interaction) {
  await interaction.update({ content: 'Dibatalkan.', embeds: [], components: [] });
}

// ── Pause tiket ───────────────────────────────────────────────────────────────
async function handlePause(interaction, threadId) {
  const guildId = interaction.guild.id;
  const myRole  = getUserRole(guildId, interaction.user.id);

  if (myRole !== 'administrator' && myRole !== 'operator') {
    return interaction.reply({ content: '❌ Hanya admin/operator yang bisa pause tiket.', flags: MessageFlags.Ephemeral });
  }

  saveTicket(guildId, threadId, { status: 'paused' });
  await updateAdminMessage(interaction, threadId, 'paused');
  await updateThreadMessage(interaction, threadId, 'paused');

  await interaction.reply({ content: '✅ Tiket di-pause.', flags: MessageFlags.Ephemeral });
}

// ── Resume tiket ──────────────────────────────────────────────────────────────
async function handleResume(interaction, threadId) {
  const guildId = interaction.guild.id;
  const myRole  = getUserRole(guildId, interaction.user.id);

  if (myRole !== 'administrator' && myRole !== 'operator') {
    return interaction.reply({ content: '❌ Hanya admin/operator yang bisa resume tiket.', flags: MessageFlags.Ephemeral });
  }

  const tiket      = getTicket(guildId, threadId);
  const prevStatus = tiket?.claimedBy ? 'claimed' : 'open';
  saveTicket(guildId, threadId, { status: prevStatus });
  await updateAdminMessage(interaction, threadId, prevStatus);
  await updateThreadMessage(interaction, threadId, prevStatus);

  await interaction.reply({ content: '✅ Tiket di-resume.', flags: MessageFlags.Ephemeral });
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusLabel(status) {
  return { open: 'Menunggu', claimed: 'Ditangani', paused: 'Dijeda', closed: 'Ditutup' }[status] ?? status;
}

function statusColor(status) {
  return { open: 0xffa500, claimed: 0x57f287, paused: 0x95a5a6, closed: 0xed4245 }[status] ?? 0x5865f2;
}

// Row tombol di dalam thread (untuk admin/operator)
function threadControlRow(threadId, claimedBy, status) {
  const row = new ActionRowBuilder();
  if (status === 'paused') {
    row.addComponents(
      new ButtonBuilder().setCustomId(`${CMD_ID}:resume:${threadId}`).setLabel('Resume').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`${CMD_ID}:close:${threadId}`).setLabel('Tutup Tiket').setStyle(ButtonStyle.Danger),
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId(`${CMD_ID}:pause:${threadId}`).setLabel('Pause').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId(`${CMD_ID}:close:${threadId}`).setLabel('Tutup Tiket').setStyle(ButtonStyle.Danger),
    );
  }
  return row;
}

// Row tombol di admin channel
function adminControlRow(threadId, claimedBy) {
  const row = new ActionRowBuilder();
  if (!claimedBy) {
    row.addComponents(
      new ButtonBuilder().setCustomId(`${CMD_ID}:claim:${threadId}`).setLabel('Claim').setStyle(ButtonStyle.Success),
    );
  }
  row.addComponents(
    new ButtonBuilder().setCustomId(`${CMD_ID}:close:${threadId}`).setLabel('Tutup').setStyle(ButtonStyle.Danger),
  );
  return row;
}

// Update pesan notifikasi di admin channel
async function updateAdminMessage(interaction, threadId, status) {
  try {
    const guildId   = interaction.guild.id;
    const tiket     = getTicket(guildId, threadId);
    if (!tiket?.adminMsgId || !tiket?.adminChannelId) return;

    const adminCh = interaction.guild.channels.cache.get(tiket.adminChannelId);
    if (!adminCh) return;

    const msg = await adminCh.messages.fetch(tiket.adminMsgId).catch(() => null);
    if (!msg) return;

    const claimedBy = tiket.claimedBy;
    let claimerTag  = '';
    if (claimedBy) {
      try { claimerTag = (await interaction.client.users.fetch(claimedBy)).tag; } catch {}
    }

    const embed = new EmbedBuilder()
      .setColor(statusColor(status))
      .setTitle('Tiket')
      .addFields(
        { name: 'Member', value: `${tiket.username} (${tiket.userId})`, inline: true },
        { name: 'Topik', value: tiket.topik ?? '-', inline: true },
        { name: 'Status', value: statusLabel(status), inline: true },
        { name: 'Thread', value: `<#${threadId}>` },
      );

    if (claimerTag) embed.addFields({ name: 'Ditangani oleh', value: claimerTag, inline: true });

    await msg.edit({
      embeds: [embed],
      components: status === 'closed' ? [] : [adminControlRow(threadId, claimedBy)],
    });
  } catch { /* skip */ }
}

// Update pesan pertama di dalam thread
async function updateThreadMessage(interaction, threadId, status) {
  try {
    const thread = interaction.guild.channels.cache.get(threadId);
    if (!thread) return;

    const messages = await thread.messages.fetch({ limit: 10 });
    const botMsg   = messages.find(m =>
      m.author.id === interaction.client.user.id && m.embeds.length > 0
    );
    if (!botMsg) return;

    const tiket     = getTicket(interaction.guild.id, threadId);
    const oldEmbed  = botMsg.embeds[0];

    const newEmbed = new EmbedBuilder()
      .setColor(statusColor(status))
      .setTitle(oldEmbed.title ?? 'Tiket')
      .setDescription(oldEmbed.description ?? '')
      .addFields(
        { name: 'Dibuat oleh', value: tiket?.username ?? '-', inline: true },
        { name: 'Status', value: statusLabel(status), inline: true },
      );

    await botMsg.edit({
      embeds: [newEmbed],
      components: status === 'closed' ? [] : [threadControlRow(threadId, tiket?.claimedBy, status)],
    });
  } catch { /* skip */ }
}
