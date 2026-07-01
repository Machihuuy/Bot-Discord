# discord-bot

Bot Discord untuk manajemen server. Fitur yang tersedia: welcome message, rules, biodata, kirim gambar, sistem tiket, dan manajemen akses per user.

## Cara Setup

Install dependency terlebih dahulu:

```bash
npm install
```

Isi file `.env` dengan data berikut:

```env
BOT_TOKEN=token_bot
CLIENT_ID=application_id_bot
WELCOME_CHANNEL_ID=id_channel_welcome
```

Sebelum menjalankan bot, aktifkan **Server Members Intent** dan **Message Content Intent** di Discord Developer Portal bagian Bot.

Jalankan bot:

```bash
npm start
```

Slash command akan otomatis terdeploy saat bot online.

## Command

`/setwelcome` — atur welcome message. Bisa set teks, warna, gambar, footer, dan channel tujuan. Teks mendukung placeholder `{user}` dan `{server}`.

`/testwelcome` — preview welcome message sesuai konfigurasi yang sudah disimpan.

`/rules` — kirim embed rules ke channel yang dipilih. Judul, isi, dan warna diatur lewat modal.

`/biodata` — kirim biodata ke channel. Isi lewat modal, warna bisa diatur.

`/sendimage` — kirim gambar dalam embed ke channel. Warna bisa diatur.

`/ticket setup` — setup sistem tiket. Pilih channel panel member dan channel panel admin. Embed panel bisa dikustomisasi lewat modal.

`/addaccess` — kelola akses bot per user. Ada tombol tambah, hapus, dan lihat daftar.

`/settings` — pengaturan bot, termasuk toggle DM notifikasi akses.

`/help` — daftar semua command.

## Sistem Akses

Bot menggunakan sistem role internal yang terpisah dari Discord role. Owner server otomatis mendapat role Administrator saat bot pertama kali masuk ke server.

Administrator memiliki akses ke semua command dan bisa mengelola akses semua role.

Operator bisa memilih command apa saja yang ingin diakses saat setup akses, kecuali command yang hanya untuk Administrator. Operator juga bisa menambah role User.

User hanya bisa mengakses `/biodata` dan tidak bisa mengelola akses.

Untuk menambah akses, gunakan `/addaccess` lalu klik Tambah Akses dan masukkan User ID atau username.

## Sistem Tiket

Tiket dibuat sebagai thread di channel panel member. Saat tiket dibuat, semua user dengan role Administrator dan Operator otomatis ditambahkan ke thread.

Admin bisa claim tiket dari panel admin channel. Setelah diclaim, tiket bisa ditutup dari panel admin. Member yang membuat tiket tidak bisa menutup tiketnya sendiri.

## Catatan

Data konfigurasi disimpan di `src/data/config.json` dan tidak hilang saat bot direstart.

Warna embed bisa menggunakan nama seperti `merah`, `biru`, `pink`, atau format hex seperti `#ff5733`.

## File Penting

`src/index.js` — entry point bot. Login, load command dan event, deploy slash command otomatis.

`src/clear-commands.js` — hapus semua slash command lama dari Discord lalu deploy ulang. Berguna jika ada command yang sudah dihapus tapi masih muncul. Jalankan dengan `node src/clear-commands.js`.

`src/deploy-commands.js` — versi manual deploy ke guild tertentu. Sudah jarang dipakai.

`package.json` — daftar dependency dan script. `npm start` untuk menjalankan bot, `npm run clear` untuk bersihkan command lama.

`.env` — menyimpan token dan ID yang bersifat rahasia. Jangan dipush ke GitHub.

`noted` - sistem role di addaccess adalah prototipe jika menggunakan role dari discordnya dan bisa di implementasikan menggunakan role langsung dari discordnya, agar data tidak di reset setiap restart bot atau deploy ulang aku sarankan untuk menggunakan database seperti mongodb dan supabase, untuk hosting bebas kalau mau gratis pakai railway