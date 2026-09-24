# CLAUDE.md

Instruksi ini dibaca Claude Code setiap kali mengerjakan repo backend
**Rentify**. Dokumen ini menjelaskan cara kerja & konvensi; **apa** yang
dibangun ada di `be.md`, **bagaimana** arsitekturnya ada di
`arsitektur.md`.

## Mulai dari sini

Repo ini dimulai dari nol — belum ada kode. Sebelum menulis satu baris
kode pun:

1. Baca `be.md` (spesifikasi fungsional + kontrak API + skema data yang
   harus dibangun).
2. Baca `arsitektur.md` (struktur lapisan, urutan mounting route, alur
   request, arsitektur sesi/token).
3. Buat struktur folder sesuai §"Struktur folder" di bawah, lalu
   implementasikan sesuai `be.md`, ikuti konvensi di dokumen ini.
4. Setelah selesai satu bagian (mis. skema Prisma, lalu registrasi, lalu
   login credentials, lalu Google OAuth), jalankan langkah verifikasi di
   §"Perintah penting" sebelum lanjut ke bagian berikutnya — jangan
   menulis seluruh modul dulu baru diuji di akhir.

## Tentang proyek

Rentify adalah platform penyewaan kendaraan P2P (Senior Project, Lab
Jaringan Komputer dan Aplikasi Terdistribusi, DTETI UGM) yang
mempertemukan **Host** (pemilik kendaraan) dengan **Guest** (penyewa).
Repo ini adalah **backend** Rentify saja — frontend dikerjakan terpisah
(lihat desain di Figma: proyek "Rentify").

Modul yang sedang dikerjakan di repo ini: **Autentikasi** — registrasi,
login berbasis email/password, dan login berbasis Google (Auth.js). Modul
lain (e-KYC, face liveness, booking, pembayaran, deteksi kerusakan
kendaraan, GPS tracking, chatbot) akan menyusul sebagai modul terpisah;
jangan implementasikan itu di sini kecuali diminta eksplisit — lihat
"Ruang lingkup" di `be.md`.

## Tech stack

- **Runtime**: Node.js + TypeScript, dijalankan lewat `ts-node-dev` saat dev
- **Framework**: Express.js 4
- **ORM**: Prisma (`@prisma/client`, `prisma`)
- **Database**: PostgreSQL
- **Auth**: Auth.js (`@auth/express`, `@auth/core`, `@auth/prisma-adapter`)
  - Provider: Google OAuth + Credentials (email/password)
  - Session strategy: **JWT** (wajib — Auth.js tidak mendukung database
    session bila ada Credentials provider)
- Password hashing: `bcrypt`
- Validasi input: `zod`

```json
{
  "dependencies": {
    "@auth/core": "^0.37.0",
    "@auth/express": "^0.5.0",
    "@auth/prisma-adapter": "^2.7.0",
    "@prisma/client": "^6.4.0",
    "bcrypt": "^5.1.1",
    "cookie-parser": "^1.4.7",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "express": "^4.21.2",
    "zod": "^3.24.1"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/cookie-parser": "^1.4.8",
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.13.0",
    "prisma": "^6.4.0",
    "ts-node": "^10.9.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.7.3"
  }
}
```

Ini adalah dependency yang sudah disepakati tim (Issue #33). Jangan
mengganti library inti (mis. pindah dari Auth.js ke solusi JWT manual,
atau dari Prisma ke ORM lain) tanpa alasan kuat dan persetujuan tim.

## Struktur folder

```
src/
  index.ts              # entrypoint Express: middleware, mounting routes
  lib/
    prisma.ts            # singleton PrismaClient
    auth.ts              # ExpressAuthConfig: providers, callbacks, session
  middleware/
    requireRole.ts        # requireAuth() / requireRole(...roles)
  routes/
    authRoutes.ts          # POST /register, GET /me (di luar Auth.js)
  types/
    auth.d.ts               # module augmentation (Session.user.role, dst)
prisma/
  schema.prisma              # User, Account, Session, VerificationToken
  seed.ts                     # user dummy Host/Guest untuk testing lokal
be.md
arsitektur.md
CLAUDE.md
```

## Konvensi

- **Pesan/response API dalam Bahasa Indonesia** (`message`, `note`),
  **field JSON dalam camelCase Inggris** (`email`, `passwordHash`,
  `role`) — konsisten dengan prototype `/api/test-login` di worksheet
  Week 3.
- Semua response API pakai bentuk `{ success: boolean, message?, ...data }`.
- Endpoint kustom yang **bukan** bagian dari Auth.js (register, me, dan
  modul-modul lain nanti seperti booking) dipasang **sebelum**
  `app.use("/api/auth/*", ExpressAuth(authConfig))` di `index.ts`, supaya
  path spesifik ditangani lebih dulu dan sisanya (signin, callback/\*,
  session, signout, csrf, providers) jatuh ke Auth.js. Jangan pindahkan
  urutan ini (alasannya ada di `arsitektur.md` §2).
- Role disimpan sebagai enum Prisma `UserRole` (`HOST | GUEST | ADMIN`),
  bukan string bebas. Tambahkan role baru lewat migration, bukan lewat
  validasi aplikasi saja.
- Password **tidak pernah** disimpan plain text; selalu lewat
  `bcrypt.hash(password, 12)`. User yang daftar via Google punya
  `passwordHash = null` — `authorize()` di `src/lib/auth.ts` wajib
  menolak login credentials untuk akun seperti ini.
- Route yang butuh role tertentu memakai middleware
  `requireRole("HOST", "ADMIN")` dari `src/middleware/requireRole.ts`,
  bukan pengecekan manual berulang di tiap handler.
- Setiap endpoint baru: validasi input dengan `zod` di awal handler,
  `return` lebih awal untuk kasus error (jangan nested if dalam-dalam).

## Kesalahan yang pernah terjadi — jangan diulang

Poin-poin ini ditemukan lewat validasi manual skema di PostgreSQL nyata
pada iterasi sebelumnya, bukan sekadar dugaan:

- **Jangan** memberi atribut `@updatedAt` pada field `createdAt` di
  Prisma — itu membuat `createdAt` ikut berubah setiap kali baris
  di-update, padahal harus tetap. `createdAt` cukup `@default(now())`.
- Model `Account`/`Session` **harus** persis mengikuti skema resmi
  `@auth/prisma-adapter` (nama kolom, tipe, `@@unique([provider,
  providerAccountId])`) — adapter mengasumsikan struktur ini apa adanya.
- Relasi `Account`/`Session` ke `User` wajib `onDelete: Cascade`, supaya
  hapus user tidak menyisakan baris yatim.
- Session **wajib** strategi `"jwt"`; jangan dicoba diganti ke
  `"database"` selama Credentials provider masih dipakai — Auth.js akan
  gagal.

## Environment variables

Lihat `.env.example`. Wajib diisi sebelum `npm run dev`:
`DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, `AUTH_GOOGLE_ID`,
`AUTH_GOOGLE_SECRET`. Jangan commit `.env` (masukkan ke `.gitignore`).

## Perintah penting

```bash
npm install
npx prisma migrate dev --name <nama_migration>   # setiap ubah schema.prisma
npm run prisma:generate                            # regenerate client saja
npm run seed                                        # isi user dummy
npm run dev                                         # jalankan server (port 4000 default)
npm run build                                       # cek tsc tanpa error sebelum lanjut
npm start                                           # jalankan hasil build (produksi)
```

Setelah tiap bagian modul selesai, jalankan minimal: `npm run build`
(harus tanpa error) dan uji manual endpoint terkait dengan `curl`/Postman
sesuai kontrak di `be.md` §6, sebelum menandainya selesai.

## Referensi tambahan (opsional)

Ada implementasi referensi dari iterasi eksplorasi sebelumnya
(kode + laporan `BACKEND_REPORT.md`) yang sudah divalidasi skemanya
terhadap PostgreSQL asli (constraint unik, cascade delete, linking akun
Google semua terbukti berjalan sesuai desain). Boleh dipakai sebagai
pembanding kalau progres macet, tapi **`be.md` dan `arsitektur.md` yang
mengikat** — kalau ada perbedaan, ikuti kedua dokumen itu.