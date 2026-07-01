# discordbot

Bot untuk server Discord. Fiturnya ada welcome message, rules, biodata, kirim gambar, sama sistem akses buat ngatur siapa yang bisa pakai command apa.

## Cara pakai

Pertama install dulu dependencynya:

```bash
npm install
```

Terus isi file `.env` dengan data bot kamu:

```env
BOT_TOKEN=token bot
CLIENT_ID=application id bot
WELCOME_CHANNEL_ID=id channel untuk welcome
```

Sebelum jalanin bot, pastiin udah aktifin **Server Members Intent** dan **Message Content Intent** di Discord Developer Portal bagian Bot.

Kalau udah, tinggal:

```bash
npm start
```

Slash command bakal otomatis ke deploy waktu bot online, jadi ga perlu run command deploy terpisah.

## Command yang ada

`/setwelcome` — buat ngatur welcome message. Bisa set teks, warna, gambar, footer, sama channel tujuannya. Teks welcome support placeholder `{user}` dan `{server}`.

`/testwelcome` — buat preview welcome message sebelum beneran aktif.

`/rules` — kirim embed rules ke channel yang dipilih. Judul, isi, sama warnanya bisa diatur lewat modal.

`/biodata` — kirim biodata ke channel. Isi lewat modal, warna bisa diatur.

`/sendimage` — kirim gambar dalam embed ke channel. Warnanya bisa diatur juga.

`/addaccess` — kelola akses bot per user. Ada tombol tambah, hapus, sama lihat list.

`/help` — daftar semua command.

## Sistem akses

Bot punya sistem role sendiri, beda sama Discord role biasa. Owner server otomatis dapat role Administrator waktu bot pertama join.

Administrator bisa akses semua command dan kelola akses semua role.

Operator bisa akses rules, biodata, sendimage, setwelcome, testwelcome. Bisa tambah role User tapi ga bisa hapus.

User cuma bisa akses biodata. Ga bisa kelola akses sama sekali.

Buat nambahin akses, tinggal pakai `/addaccess` lalu klik Tambah Akses. Bisa input User ID atau username.

## Catatan

Data config welcome dan akses disimpan di `src/data/config.json` jadi ga hilang waktu bot di restart.

Warna embed bisa pakai nama seperti merah, biru, pink, atau langsung hex seperti #ff5733.
