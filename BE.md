# BE.md — Spesifikasi Backend Rentify (Modul Autentikasi)

Dokumen ini adalah **spesifikasi**, bukan laporan hasil. Ini yang harus
dibangun oleh Claude Code, mengikuti aturan kerja di `CLAUDE.md` dan
arsitektur di `arsitektur.md`.

## 1. Tujuan modul

Membangun backend autentikasi Rentify: registrasi akun dengan pemilihan
peran (Host/Guest), login email+password, dan login via Google —
sesuai FR `Register Account` dan `Login` pada worksheet Week 2:

> **Register Account** — Sistem harus dapat memfasilitasi registrasi akun
> baru dengan pemilihan peran sebagai Host atau Guest, mencakup data diri
> dan kredensial (email & password).
>
> **Login** — Sistem harus dapat mengautentikasi pengguna berdasarkan
> kredensial dan menerbitkan token sesi (JWT/OAuth) untuk mengakses fitur
> sesuai perannya.

## 2. Tech stack (wajib, sudah disepakati tim)

Express.js · PostgreSQL · Prisma · Auth.js (`@auth/express`,
`@auth/prisma-adapter`) · bcrypt · zod · TypeScript. Lihat versi persis
dependency di `CLAUDE.md`. Jangan ganti library inti (mis. pindah dari
Auth.js ke solusi JWT manual) tanpa persetujuan tim.

## 3. Aktor & peran

| Peran | Deskripsi |
|---|---|
| `GUEST` | Penyewa kendaraan. Role default saat registrasi/Google sign-up. |
| `HOST` | Pemilik kendaraan yang menyewakan. Dipilih eksplisit saat registrasi. |
| `ADMIN` | Pengelola platform (fitur Admin dibangun di modul lain, tapi role-nya harus sudah ada di skema sejak awal). |

## 4. Ruang lingkup

**Termasuk cakupan modul ini:**
- Registrasi akun (email + password + nama + pilihan peran Host/Guest).
- Login email/password.
- Login/registrasi via Google OAuth, termasuk auto-link ke akun email yang
  sama jika sudah ada.
- Sesi berbasis token (JWT) yang membawa identitas & peran user.
- Middleware pembatas akses berbasis peran, untuk dipakai modul-modul lain
  nanti (booking, listing kendaraan, dsb).
- Logout.

**Di luar cakupan modul ini** (jangan diimplementasikan di sini):
e-KYC/OCR KTP-SIM, face liveness detection, pencarian & booking
kendaraan, payment gateway, rating/review, deteksi kerusakan kendaraan
(AI vision), GPS tracking, chatbot, fitur Admin (manage users, review
verification, handle disputes). Field/relasi yang mereka butuhkan boleh
disiapkan di skema (lihat §5) tapi logikanya tidak.

## 5. Data model

### User

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | String (cuid) | PK |
| `name` | String? | |
| `email` | String | unik, wajib |
| `emailVerified` | DateTime? | placeholder untuk verifikasi email (belum ada alurnya di modul ini) |
| `image` | String? | avatar, biasanya terisi dari Google |
| `passwordHash` | String? | **null jika akun murni dari Google** — jangan pernah simpan password mentah |
| `role` | enum `HOST \| GUEST \| ADMIN` | default `GUEST` |
| `phone` | String? | opsional saat registrasi |
| `verificationStatus` | enum `UNVERIFIED \| PENDING \| VERIFIED \| REJECTED` | default `UNVERIFIED`, dipakai modul e-KYC nanti |
| `createdAt` | DateTime | default `now()` — **jangan** diberi `@updatedAt` |
| `updatedAt` | DateTime | `@updatedAt` |

### Account, Session, VerificationToken

Ikuti **persis** skema resmi `@auth/prisma-adapter`
(https://authjs.dev/getting-started/adapters/prisma) — jangan mengarang
field sendiri, adapter mengasumsikan nama kolom tertentu. `Account` dan
`Session` relasi ke `User` dengan `onDelete: Cascade`.

## 6. Kontrak API

Semua respons berbentuk `{ success: boolean, message?: string, ... }`.
Pesan untuk pengguna dalam Bahasa Indonesia; nama field JSON camelCase
Inggris.

### `POST /api/auth/register`

Registrasi akun baru.

Request body:
```json
{
  "name": "string, 2-100 karakter",
  "email": "string, format email valid",
  "password": "string, 8-72 karakter",
  "role": "HOST | GUEST (default GUEST)",
  "phone": "string, opsional, 8-20 karakter"
}
```

| Kondisi | Status | Body |
|---|---|---|
| Sukses | `201` | `{ success: true, message, user: { id, name, email, role, createdAt } }` (tanpa passwordHash) |
| Validasi gagal | `400` | `{ success: false, message, errors: { field: [pesan] } }` |
| Email sudah terdaftar | `409` | `{ success: false, message }` |

Aturan bisnis:
- Password di-hash dengan `bcrypt`, cost factor **12**, sebelum disimpan.
- Cek email unik di level aplikasi (lookup dulu) **dan** biarkan constraint
  unik database jadi pengaman kedua.
- Endpoint ini tidak otomatis login-kan user; frontend memanggil sign-in
  terpisah setelah registrasi sukses (atau memicu `signIn()` Auth.js).

### `GET /api/auth/me`

Mengembalikan user dari sesi aktif.

| Kondisi | Status | Body |
|---|---|---|
| Sudah login | `200` | `{ success: true, user: { id, name, email, role, image } }` |
| Belum login | `401` | `{ success: false, message: "Belum login." }` |

Catatan: ini **bukan** pengganti `GET /api/auth/session` bawaan Auth.js
(yang membalas `200` dengan `{}` saat logout) — endpoint ini sengaja
membalas `401` supaya lebih mudah dipakai frontend/consumer API lain.

### Ditangani Auth.js langsung (jangan dibuat ulang manual)

| Method | Path | Deskripsi |
|---|---|---|
| `GET` | `/api/auth/signin` | Halaman pilihan provider bawaan Auth.js |
| `POST` | `/api/auth/signin/google` | Mulai alur OAuth Google (**wajib `POST` + `csrfToken`**) |
| `*` | `/api/auth/callback/google` | Callback OAuth Google, membuat/menautkan `User`+`Account` |
| `POST` | `/api/auth/callback/credentials` | Login email/password (dipanggil lewat `signIn("credentials", …)` di frontend) |
| `GET` | `/api/auth/session` | Session mentah format Auth.js |
| `POST` | `/api/auth/signout` | Logout, menghapus cookie sesi |
| `GET` | `/api/auth/csrf`, `/api/auth/providers` | Utilitas bawaan Auth.js |

Catatan soal baris `signin/google`: memulai alur OAuth **harus lewat `POST`**
disertai `csrfToken` (ambil dari `GET /api/auth/csrf`). Ini berbeda dari
NextAuth v4 yang memakai `GET`; di Auth.js v5 `GET /api/auth/signin/google`
membalas `UnknownAction: Unsupported action`. Yang tetap `GET` adalah
`/api/auth/signin` **tanpa** nama provider — halaman itu merender daftar
provider, dan tombolnya melakukan `POST` ke `/api/auth/signin/google`.
Frontend yang memakai `signIn("google")` dari Auth.js sudah otomatis benar;
catatan ini penting untuk consumer yang memanggil API secara manual
(curl/Postman/mobile).

### Contoh route terproteksi (pola untuk modul lain)

```
GET /api/host/ping   -> requireRole("HOST", "ADMIN")
GET /api/guest/ping  -> requireRole("GUEST", "ADMIN")
```

Route baru di modul lain (booking, listing, dsb.) mengikuti pola yang
sama: bungkus dengan `requireRole(...)` atau `requireAuth()`, jangan cek
role manual di dalam handler.

## 7. Alur autentikasi (ringkas — detail sequence diagram ada di `arsitektur.md`)

1. **Registrasi** → validasi → cek email unik → hash password → simpan
   `User` dengan role terpilih.
2. **Login credentials** → Auth.js `authorize()` mencari user by email →
   tolak (`return null`) jika `passwordHash` kosong (akun Google-only) →
   `bcrypt.compare` → jika cocok, terbitkan JWT sesi.
3. **Login Google** → Auth.js + Prisma Adapter mengurus redirect,
   pembuatan `User`/`Account`, dan linking otomatis by email
   (`allowDangerousEmailAccountLinking: true`) → role default `GUEST`.
4. **Sesi** → strategi **JWT** untuk kedua provider (database session
   tidak didukung Auth.js bila ada Credentials provider). Callback `jwt`
   menaruh `id`+`role` ke token; callback `session` memindahkannya ke
   `session.user`.

## 8. Aturan bisnis & keamanan

- Password: minimal 8 karakter, di-hash bcrypt cost 12. Tidak ada
  kompleksitas tambahan (huruf besar/simbol) di versi ini — cukup
  panjang minimum.
- `AUTH_SECRET` wajib panjang & acak (`npx auth secret`), tidak boleh
  masuk repo (`.env` di `.gitignore`).
- CORS dibatasi ke origin frontend lewat env `CORS_ORIGIN`
  (`credentials: true` karena sesi berbasis cookie).
- Semua endpoint custom di luar Auth.js divalidasi input dengan `zod`
  sebelum menyentuh database.
- Jangan pernah mengembalikan `passwordHash` di response API mana pun.

## 9. Kriteria selesai (Definition of Done)

- [ ] `npm run build` (tsc) tanpa error.
- [ ] `npx prisma migrate dev` berhasil membuat migration dari skema §5.
- [ ] Registrasi Host dan Guest berhasil, email duplikat ditolak `409`.
- [ ] Login credentials berhasil untuk user yang benar, gagal (401) untuk
      password salah, dan gagal untuk akun Google-only.
- [ ] Login Google end-to-end berhasil dengan kredensial OAuth asli
      (perlu `AUTH_GOOGLE_ID`/`SECRET` dari Google Cloud Console).
- [ ] `GET /api/auth/me` membalas `401` saat logout dan `200` + data user
      saat login.
- [ ] Route contoh `requireRole` menolak peran yang salah dengan `403`.
- [ ] Tidak ada `passwordHash` yang bocor di response manapun.