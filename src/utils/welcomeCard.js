const { createCanvas, loadImage } = require('@napi-rs/canvas');
const fetch = require('node-fetch');

// Canvas resolusi 2x untuk ketajaman HD
const WIDTH = 1100;
const HEIGHT = 400;

/**
 * Generate welcome/goodbye card HD
 * @param {import('discord.js').GuildMember} member
 * @param {'welcome'|'goodbye'} type
 * @returns {Promise<Buffer>}
 */
async function generateWelcomeCard(member, type = 'welcome') {
  const canvas = createCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  const isWelcome = type === 'welcome';

  // ── 1. BACKGROUND ─────────────────────────────────────────────────────────
  // Base gelap
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // Blur blob kiri (warna aksen)
  const blobColor = isWelcome ? 'rgba(88, 101, 242, 0.35)' : 'rgba(237, 66, 69, 0.3)';
  drawBlob(ctx, 180, 200, 260, blobColor);

  // Blur blob kanan
  const blobColor2 = isWelcome ? 'rgba(87, 242, 135, 0.2)' : 'rgba(254, 163, 0, 0.18)';
  drawBlob(ctx, 920, 200, 220, blobColor2);

  // Overlay gelap transparan di atas blob supaya tetap terbaca
  ctx.fillStyle = 'rgba(13, 17, 23, 0.55)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ── 2. GRID PATTERN (texture halus) ───────────────────────────────────────
  ctx.strokeStyle = 'rgba(255,255,255,0.03)';
  ctx.lineWidth = 1;
  const grid = 40;
  for (let x = 0; x <= WIDTH; x += grid) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, HEIGHT); ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += grid) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WIDTH, y); ctx.stroke();
  }

  // ── 3. BORDER CARD ────────────────────────────────────────────────────────
  const accentColor = isWelcome ? '#5865f2' : '#ed4245';
  const accentGlow  = isWelcome ? 'rgba(88,101,242,0.6)' : 'rgba(237,66,69,0.6)';

  // Shadow/glow border
  ctx.save();
  ctx.shadowColor = accentGlow;
  ctx.shadowBlur = 24;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 2.5;
  roundRect(ctx, 16, 16, WIDTH - 32, HEIGHT - 32, 20);
  ctx.stroke();
  ctx.restore();

  // Inner border tipis putih
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  roundRect(ctx, 18, 18, WIDTH - 36, HEIGHT - 36, 19);
  ctx.stroke();

  // ── 4. DIVIDER VERTIKAL ───────────────────────────────────────────────────
  const divX = 350;
  const divGrad = ctx.createLinearGradient(divX, 60, divX, HEIGHT - 60);
  divGrad.addColorStop(0,   'transparent');
  divGrad.addColorStop(0.3, accentColor);
  divGrad.addColorStop(0.7, accentColor);
  divGrad.addColorStop(1,   'transparent');
  ctx.strokeStyle = divGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(divX, 60);
  ctx.lineTo(divX, HEIGHT - 60);
  ctx.stroke();

  // ── 5. AVATAR ─────────────────────────────────────────────────────────────
  const avatarSize = 180;
  const avatarCX = 175;
  const avatarCY = HEIGHT / 2;

  // Glow lingkaran avatar
  ctx.save();
  ctx.shadowColor = accentGlow;
  ctx.shadowBlur = 40;
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Ring kedua tipis
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarSize / 2 + 14, 0, Math.PI * 2);
  ctx.stroke();

  // Gambar avatar (circle clip)
  const avatarImg = await fetchImage(
    member.user.displayAvatarURL({ extension: 'png', size: 256 }),
    `https://cdn.discordapp.com/embed/avatars/0.png`
  );
  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarCX, avatarCY, avatarSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(avatarImg, avatarCX - avatarSize / 2, avatarCY - avatarSize / 2, avatarSize, avatarSize);
  ctx.restore();

  // Badge status online (dot hijau di bawah kanan avatar)
  const badgeX = avatarCX + avatarSize / 2 * Math.cos(Math.PI * 0.25);
  const badgeY = avatarCY + avatarSize / 2 * Math.sin(Math.PI * 0.25);
  ctx.fillStyle = '#23272a';
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 14, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = isWelcome ? '#57f287' : '#ed4245';
  ctx.beginPath();
  ctx.arc(badgeX, badgeY, 10, 0, Math.PI * 2);
  ctx.fill();

  // ── 6. TEKS KANAN ─────────────────────────────────────────────────────────
  const textX = divX + 44;
  const centerY = HEIGHT / 2;

  // Label chip (WELCOME / GOODBYE)
  const chipLabel = isWelcome ? '  ✦  WELCOME  ✦  ' : '  ✦  GOODBYE  ✦  ';
  ctx.font = 'bold 13px sans-serif';
  const chipW = ctx.measureText(chipLabel).width + 24;
  const chipH = 28;
  const chipY = centerY - 115;

  // Chip background
  ctx.fillStyle = accentColor + '33'; // 20% opacity
  roundRect(ctx, textX, chipY, chipW, chipH, 14);
  ctx.fill();
  ctx.strokeStyle = accentColor + '88';
  ctx.lineWidth = 1;
  roundRect(ctx, textX, chipY, chipW, chipH, 14);
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.font = 'bold 13px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(chipLabel, textX + 12, chipY + chipH / 2);
  ctx.textBaseline = 'alphabetic';

  // Nama user
  const username = member.user.username;
  const nameFontSize = getAdaptiveFontSize(username, 64, 20);
  ctx.font = `bold ${nameFontSize}px sans-serif`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0,0,0,0.8)';
  ctx.shadowBlur = 12;
  ctx.fillText(truncate(username, ctx, WIDTH - textX - 60), textX, centerY - 42);
  ctx.shadowBlur = 0;

  // Discriminator / display name baris kedua
  const subName = member.nickname
    ? `"${member.nickname}"`
    : (member.user.discriminator !== '0' ? `#${member.user.discriminator}` : member.user.globalName ?? '');
  if (subName) {
    ctx.font = '20px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(subName, textX, centerY + 2);
  }

  // Garis pemisah di bawah nama
  const lineY = centerY + 20;
  const lineGrad = ctx.createLinearGradient(textX, lineY, textX + 380, lineY);
  lineGrad.addColorStop(0, accentColor);
  lineGrad.addColorStop(1, 'transparent');
  ctx.strokeStyle = lineGrad;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(textX, lineY);
  ctx.lineTo(textX + 380, lineY);
  ctx.stroke();

  // Baris info bawah
  const infoY = centerY + 52;
  const memberCount = member.guild.memberCount;

  if (isWelcome) {
    // Member ke-N
    ctx.font = 'bold 17px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('Anggota ke-', textX, infoY);
    const prefixW = ctx.measureText('Anggota ke-').width;
    ctx.font = `bold 17px sans-serif`;
    ctx.fillStyle = accentColor;
    ctx.fillText(`#${memberCount}`, textX + prefixW + 4, infoY);
    const numW = ctx.measureText(`#${memberCount}`).width;
    ctx.font = '17px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(` di ${member.guild.name}`, textX + prefixW + numW + 4, infoY);
  } else {
    ctx.font = '17px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(`Sisa ${memberCount} anggota di ${member.guild.name}`, textX, infoY);
  }

  // Tanggal bergabung Discord
  const joinDate = new Date(member.user.createdTimestamp);
  const joinStr = joinDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  ctx.font = '15px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText(`🗓  Akun dibuat: ${joinStr}`, textX, infoY + 36);

  // ── 7. ICON SERVER (kanan bawah) ──────────────────────────────────────────
  const iconURL = member.guild.iconURL({ extension: 'png', size: 64 });
  if (iconURL) {
    try {
      const icon = await fetchImage(iconURL);
      const iconSize = 48;
      const iconX = WIDTH - iconSize - 30;
      const iconY = HEIGHT - iconSize - 28;

      ctx.save();
      ctx.beginPath();
      ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(icon, iconX, iconY, iconSize, iconSize);
      ctx.restore();

      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(iconX + iconSize / 2, iconY + iconSize / 2, iconSize / 2 + 1, 0, Math.PI * 2);
      ctx.stroke();
    } catch { /* skip */ }
  }

  // Nama server kecil di bawah icon
  ctx.font = 'bold 13px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.textAlign = 'right';
  ctx.fillText(member.guild.name, WIDTH - 30, HEIGHT - 18);
  ctx.textAlign = 'left';

  return canvas.toBuffer('image/png');
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Gambar blur blob bulat sebagai latar warna */
function drawBlob(ctx, cx, cy, radius, color) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
  grad.addColorStop(0, color);
  grad.addColorStop(1, 'transparent');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
}

/** Helper roundRect manual (kompatibel semua versi canvas) */
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Fetch gambar dari URL, dengan fallback */
async function fetchImage(url, fallback) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch failed');
    const buf = await res.buffer();
    return await loadImage(buf);
  } catch {
    if (fallback) {
      const res = await fetch(fallback);
      const buf = await res.buffer();
      return await loadImage(buf);
    }
    throw new Error('Gagal load gambar');
  }
}

/** Sesuaikan ukuran font dengan panjang teks */
function getAdaptiveFontSize(text, max, min) {
  const sizes = [max, max - 8, max - 16, max - 22, max - 28];
  const limits = [10, 14, 18, 22, 99];
  for (let i = 0; i < limits.length; i++) {
    if (text.length <= limits[i]) return Math.max(sizes[i], min);
  }
  return min;
}

/** Potong teks supaya tidak meluber */
function truncate(text, ctx, maxWidth) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  while (ctx.measureText(text + '…').width > maxWidth && text.length > 0) {
    text = text.slice(0, -1);
  }
  return text + '…';
}

module.exports = { generateWelcomeCard };
