# report.md — Laporan Implementasi Modul Autentikasi Backend Rentify

**Tanggal:** 24 September 2026
**Branch:** `feat/be-login`
**Lingkup:** modul Autentikasi sesuai `BE.md` + `ARSITEKTUR.md` + `CLAUDE.md`
**Status keseluruhan:** **Successful** — seluruh Definition of Done di `BE.md` §9
terpenuhi, kecuali satu item yang tidak bisa diuji tanpa kredensial Google
asli (dijelaskan di §7). Dua error ditemukan selama pengerjaan, keduanya
sudah diperbaiki (§6).

---

## 1. Fitur yang dikerjakan

| # | Fitur | Endpoint / Berkas | Status |
|---|---|---|---|
| 1 | Registrasi akun (nama, email, password, peran Host/Guest, telepon) | `POST /api/auth/register` | Selesai & teruji |
| 2 | Login email + password | `POST /api/auth/callback/credentials` (Auth.js Credentials) | Selesai & teruji |
| 3 | Login / sign-up via Google + auto-link by email | `POST /api/auth/signin/google`, `GET/POST /api/auth/callback/google` | Selesai; round-trip ke Google belum diuji (§7) |
| 4 | Sesi berbasis token JWT di cookie httpOnly | `src/lib/auth.ts` callback `jwt`/`session` | Selesai & teruji |
| 5 | Endpoint identitas user aktif | `GET /api/auth/me` | Selesai & teruji |
| 6 | Logout | `POST /api/auth/signout` (Auth.js) | Selesai & teruji |
| 7 | Middleware pembatas akses berbasis peran | `requireAuth()` / `requireRole(...)` | Selesai & teruji |
| 8 | Contoh route terproteksi (pola untuk modul lain) | `GET /api/host/ping`, `GET /api/guest/ping` | Selesai & teruji |
| 9 | Skema data + migration + seed user dummy | `prisma/schema.prisma`, `prisma/seed.ts` | Selesai & teruji |

Yang **tidak** dikerjakan, sesuai `BE.md` §4 "Di luar cakupan": e-KYC/OCR,
face liveness, booking, payment gateway, rating/review, deteksi kerusakan
kendaraan, GPS tracking, chatbot, dan fitur Admin. Field `emailVerified` dan
`verificationStatus` hanya disiapkan di skema sebagai placeholder, tanpa
logika apa pun.

---

## 2. Tech stack yang digunakan

Semua mengikuti dependency yang sudah disepakati tim (Issue #33) — tidak ada
library inti yang diganti.

| Lapisan | Teknologi | Versi terpasang |
|---|---|---|
| Runtime | Node.js | v24.19.0 (dev: `ts-node-dev` 2.0.0) |
| Bahasa | TypeScript | 5.9.3 (`strict: true`) |
| Framework HTTP | Express.js | 4.22.3 |
| Autentikasi | Auth.js — `@auth/express` 0.5.6, `@auth/core` 0.37.4, `@auth/prisma-adapter` 2.11.3 | |
| Provider | Google OAuth 2.0 (OIDC + PKCE) & Credentials | |
| ORM | Prisma | 6.19.3 |
| Basis data | PostgreSQL | 16 (diuji di container Docker sementara; database tim: Supabase untuk sementara) |
| Hash password | `bcrypt` | 5.1.1, cost factor 12 |
| Validasi input | `zod` | 3.25.76 |
| Lain-lain | `cors` 2.8.6, `cookie-parser` 1.4.7, `dotenv` 16.6.1 | |

### Letak kode

Backend ditempatkan di direktori **`backend/`**, bukan di root repo, karena
root sudah dipakai proyek frontend Next.js (`app/`, `next.config.ts`,
`package.json` Next.js). Struktur di dalam `backend/` persis mengikuti
§"Struktur folder" di `CLAUDE.md`:

```
backend/
  src/
    index.ts                  # entrypoint Express: middleware + urutan mounting route
    lib/
      prisma.ts               # singleton PrismaClient
      auth.ts                 # konfigurasi Auth.js: providers, callbacks, getAuthSession()
    middleware/
      requireRole.ts          # requireAuth() / requireRole(...roles)
    routes/
      authRoutes.ts           # POST /register, GET /me (di luar Auth.js)
    types/
      auth.d.ts               # tipe AuthUser / AuthSession (id + role)
  prisma/
    schema.prisma             # User, Account, Session, VerificationToken
    migrations/20260924115654_init_auth/
    seed.ts                   # user dummy Host/Guest/Admin + akun Google-only
  .env.example
  package.json
  tsconfig.json
```

Total kode yang ditulis: 520 baris TypeScript (di luar konfigurasi & migration).

---

## 3. Cara kerja fitur

### 3.1 Registrasi — `POST /api/auth/register`

1. Body request divalidasi `zod` **sebelum** menyentuh database: `name` 2–100
   karakter, `email` format valid (otomatis di-`toLowerCase`), `password` 8–72
   karakter, `role` hanya `HOST`/`GUEST` (default `GUEST`), `phone` opsional
   8–20 karakter. Gagal validasi → `400` berisi `errors` per-field dalam
   Bahasa Indonesia.
2. Lookup email di level aplikasi. Kalau sudah ada → `409` dengan pesan ramah.
3. Password di-hash `bcrypt.hash(password, 12)`.
4. `prisma.user.create` dengan `select` eksplisit — hanya `id`, `name`,
   `email`, `role`, `createdAt` yang keluar, jadi `passwordHash` tidak mungkin
   ikut terkirim.
5. Kalau ada dua request registrasi email sama nyaris bersamaan dan lolos
   langkah 2, constraint unik database melempar Prisma error `P2002` yang
   ditangkap dan juga dipetakan ke `409` — pengaman lapis kedua sesuai
   `BE.md` §6.
6. Endpoint ini **tidak** membuat sesi. Frontend memanggil `signIn()` terpisah
   setelah menerima `201`.

Batas atas 72 karakter pada password bukan angka sembarangan: itu batas input
yang benar-benar dibaca algoritma bcrypt — karakter ke-73 dan seterusnya
diabaikan secara diam-diam, sehingga menolaknya lebih jujur daripada
menerimanya.

### 3.2 Login email/password

Ditangani Auth.js Credentials provider lewat `authorize()` di
`src/lib/auth.ts`:

1. Kredensial masuk divalidasi `zod`.
2. `prisma.user.findUnique({ email })`.
3. Kalau user tidak ada → gagal.
4. Kalau `user.passwordHash === null` → gagal. Ini kasus akun yang murni
   dibuat lewat Google; tanpa cek ini akun tersebut akan bisa ditembus dengan
   password kosong/apa pun.
5. `bcrypt.compare(password, user.passwordHash)` → kalau tidak cocok, gagal.
6. Kalau cocok, kembalikan `{ id, name, email, image, role }` → Auth.js
   menerbitkan JWT dan mengirimkannya sebagai cookie `authjs.session-token`
   (`HttpOnly`, `SameSite=Lax`, umur 30 hari).

Keempat kasus gagal sengaja dipetakan ke **satu** error yang sama
(`CredentialsSignin`) supaya response tidak membocorkan apakah yang salah itu
emailnya atau passwordnya.

### 3.3 Login Google

Ditangani Auth.js + `@auth/prisma-adapter`; tidak ada kode manual:

1. Frontend memanggil `signIn("google")` → `POST /api/auth/signin/google`
   (dengan `csrfToken`) → 302 ke consent screen Google, lengkap dengan PKCE
   (`code_challenge_method=S256`) dan `redirect_uri` backend.
2. Google memanggil balik `/api/auth/callback/google` dengan `code`.
3. Adapter menukar `code` jadi profil, lalu:
   - email belum terdaftar → buat `User` baru (role default `GUEST` dari
     Prisma) + baris `Account` provider `google`;
   - email sudah terdaftar dari registrasi password → berkat
     `allowDangerousEmailAccountLinking: true`, baris `Account` baru
     **ditautkan ke User yang sudah ada**; `role` dan `passwordHash` user lama
     tidak tertimpa.
4. Callback `jwt` menaruh `id` + `role` ke token, lalu Set-Cookie sesi.

### 3.4 Sesi & token

- Strategi **`"jwt"`** — bukan pilihan bebas: Auth.js tidak mendukung database
  session bila ada Credentials provider.
- Callback `jwt` mengisi `token.id` dan `token.role` saat login. Untuk login
  Google, objek `user` dari adapter tidak selalu membawa `role`, jadi callback
  mengambilnya sekali dari database lalu menyimpannya di token.
- Callback `session` memindahkan `id` + `role` dari token ke `session.user`,
  sehingga `requireRole` **tidak perlu query database tiap request**.
- Model `Session` tetap ada di skema demi kompatibilitas adapter, tapi selama
  strategi JWT aktif tabel itu memang kosong — ini normal, bukan bug.

### 3.5 `GET /api/auth/me`

Membaca sesi lewat `getAuthSession(req)` lalu mengembalikan `{ id, name,
email, role, image }`. Bedanya dengan `GET /api/auth/session` bawaan Auth.js:
endpoint ini membalas **`401`** saat belum login, bukan `200` dengan body
kosong — lebih mudah dipakai frontend dan consumer API lain.

### 3.6 Middleware peran

`requireAuth()` dan `requireRole(...roles)` di `src/middleware/requireRole.ts`.
Keduanya membaca & memverifikasi JWT dari cookie, menyimpan hasilnya di
`res.locals.session` (sehingga handler di belakangnya tidak perlu memanggil
`getSession()` lagi), lalu: tidak ada sesi → `401`; sesi ada tapi peran tidak
cocok → `403`; cocok → `next()`.

Berbeda dari prototipe lama, `requireRole` memanggil `getSession()` sendiri,
jadi bisa dipasang berdiri sendiri tanpa harus dirangkai di belakang
`requireAuth` terlebih dahulu.

---

## 4. Logika & keputusan teknis penting

### 4.1 Urutan mounting route

```ts
app.use("/api/auth", authRoutes);                  // /register, /me
app.use("/api/auth/*", ExpressAuth(authConfig));   // sisanya
```

Urutan ini **tidak boleh dibalik** (`ARSITEKTUR.md` §2). Express Router yang
tidak menemukan route cocok otomatis `next()` ke middleware berikutnya, jadi
`/api/auth/signin`, `/callback/*`, `/session`, `/signout`, `/csrf`,
`/providers` tetap jatuh ke Auth.js. Kalau dibalik, `ExpressAuth` akan mencoba
menangani `/api/auth/register` sebagai action Auth.js yang tidak dikenal dan
gagal. Sudah diverifikasi berjalan benar — lihat tabel uji §5.

### 4.2 Tipe sesi: kenapa tidak pakai module augmentation

`CLAUDE.md` menyebut `src/types/auth.d.ts` untuk module augmentation
(`declare module "@auth/core/types"`). Pendekatan itu **tidak bisa dipakai di
sini**, dan ini terbukti dari percobaan langsung, bukan dugaan:

`@auth/express@0.5.6` mengunci `@auth/core@0.34.1` sebagai dependensi
**bersarang**, sementara `@auth/prisma-adapter` mengunci `@auth/core@0.41.3`,
dan `package.json` tim menyebut `^0.37.0` di level teratas — jadi ada tiga
salinan `@auth/core` di `node_modules`. Augmentation dari proyek ini hanya
mengenai salinan teratas, bukan salinan bersarang yang tipenya benar-benar
dipakai `getSession()`. Percobaan augmentation malah menghasilkan
`TS2664: Invalid module name in augmentation, module '@auth/core/types' cannot be found`.

Solusinya: `src/types/auth.d.ts` mendeklarasikan tipe `AuthUser`/`AuthSession`
secara eksplisit, dan penyempitan tipe dilakukan **satu kali** di helper
`getAuthSession()` (`src/lib/auth.ts`). Konsumen (`authRoutes`,
`requireRole`) memakai helper itu dan mendapat `session.user.id` +
`session.user.role` yang ter-type dengan benar. Berkas dan perannya tetap
sesuai struktur folder yang diminta.

Alasan tidak menyeragamkan versi `@auth/core` lewat `overrides`: signature
`createActionURL()` berubah antara 0.34 dan 0.37 (argumen ke-5 berubah dari
`basePath: string` menjadi objek config), sehingga memaksa `@auth/express`
0.5.6 memakai core 0.37 justru akan merusak `getSession()` saat runtime.

### 4.3 Tipe konfigurasi Auth.js

`@auth/express@0.5.6` tidak mengekspor `ExpressAuthConfig`. Tipe konfigurasi
diturunkan dari `Parameters<typeof ExpressAuth>[0]` supaya selalu cocok dengan
versi `@auth/core` yang benar-benar dipakai, tanpa bergantung pada nama tipe
yang belum tentu ada di versi tertentu.

---

## 5. Hasil pengujian

Diuji manual dengan `curl` terhadap server yang benar-benar berjalan
(`npm run dev` dan hasil `npm run build` + `npm start`) dan PostgreSQL 16 asli.

### 5.1 Kontrak API

| # | Skenario | Diharapkan | Hasil |
|---|---|---|---|
| 1 | Registrasi Host lengkap | `201` + user tanpa `passwordHash` | **PASS** |
| 2 | Registrasi tanpa `role` | `201`, role = `GUEST` | **PASS** |
| 3 | Registrasi email huruf besar `Siti@Rentify.Test` | tersimpan `siti@rentify.test` | **PASS** |
| 4 | Registrasi email duplikat | `409` | **PASS** |
| 5 | Registrasi data tidak valid (nama 1 huruf, email ngawur, password 3 huruf, role `ADMIN`) | `400` + `errors` per-field | **PASS** |
| 6 | `GET /api/auth/me` belum login | `401` `"Belum login."` | **PASS** |
| 7 | Login credentials password benar | 302 + `Set-Cookie: authjs.session-token` (HttpOnly) | **PASS** |
| 8 | `GET /api/auth/me` sesudah login | `200` + `{id,name,email,role,image}` | **PASS** |
| 9 | Login password salah | ditolak, tidak ada cookie sesi | **PASS** |
| 10 | Login akun Google-only (`passwordHash = null`) | ditolak | **PASS** |
| 11 | Login email tidak terdaftar | ditolak | **PASS** |
| 12 | `signIn(redirect:false)` gagal | `{"url":".../error?error=CredentialsSignin"}` | **PASS** (sesudah perbaikan §6.1) |
| 13 | HOST akses `GET /api/host/ping` | `200` | **PASS** |
| 14 | HOST akses `GET /api/guest/ping` | `403` | **PASS** |
| 15 | Tanpa cookie akses `/api/host/ping` | `401` | **PASS** |
| 16 | `POST /api/auth/signout` lalu `/api/auth/me` | `401` | **PASS** |
| 17 | `/api/auth/csrf`, `/providers`, `/session` | dilayani Auth.js, bukan router kustom | **PASS** (urutan mounting benar) |
| 18 | Endpoint tidak dikenal | `404` `{success:false}` | **PASS** |
| 19 | `POST /api/auth/signin/google` | 302 ke `accounts.google.com` + PKCE + `redirect_uri` benar | **PASS** |
| 20 | Grep `passwordHash`/`password` di seluruh body response uji | 0 kemunculan | **PASS** |

### 5.2 Skema & adapter (diuji langsung terhadap PostgreSQL)

Karena alur OAuth ke Google tidak bisa dijalankan tanpa kredensial asli,
perilaku yang menjadi tumpuannya diuji dengan memanggil method
`@auth/prisma-adapter` secara langsung — persis method yang dipanggil route
callback Auth.js:

| # | Yang diuji | Hasil |
|---|---|---|
| 1 | `createUser()` adapter → role default `GUEST` | **PASS** |
| 2 | Akun Google baru punya `passwordHash = null` | **PASS** |
| 3 | `linkAccount()` + `getUserByAccount()` | **PASS** |
| 4 | `Account` duplikat `(provider, providerAccountId)` ditolak DB | **PASS** |
| 5 | `getUserByEmail()` menemukan akun hasil registrasi password | **PASS** |
| 6 | Account Google tertaut ke User lama, bukan bikin user baru (auto-link) | **PASS** |
| 7 | `role` HOST tidak tertimpa `GUEST` saat linking | **PASS** |
| 8 | `passwordHash` tetap utuh sesudah linking | **PASS** |
| 9 | Email duplikat ditolak constraint unik DB | **PASS** |
| 10 | `createdAt` **tidak** berubah saat row di-update | **PASS** |
| 11 | `updatedAt` ikut berubah saat row di-update | **PASS** |
| 12 | Hapus `User` → `Account` ikut terhapus (`onDelete: Cascade`) | **PASS** |

Poin 10 adalah pengecekan langsung terhadap kesalahan yang dicatat di
`CLAUDE.md` §"Kesalahan yang pernah terjadi" — `createdAt` sengaja hanya
diberi `@default(now())` tanpa `@updatedAt`, dan perilakunya sudah dibuktikan
di database nyata.

### 5.3 Build & migration

| Perintah | Hasil |
|---|---|
| `npm install` | OK (perlu `npm approve-scripts` sekali di repo ini; sudah tersimpan di `package.json`, lihat §6.3) |
| `npx prisma migrate dev --name init_auth` | OK — `20260924115654_init_auth` |
| `npm run prisma:generate` | OK |
| `npm run seed` | OK — 3 user dummy + 1 akun Google-only |
| `npm run build` (`tsc`, `strict: true`) | **0 error** |
| `npm start` (hasil build) | OK, server jalan di port 4000 |
| `npm run dev` (`ts-node-dev`) | OK |

---

## 6. Error yang ditemukan & perbaikannya

### 6.1 Login gagal melaporkan `error=Configuration`, bukan `CredentialsSignin` — bug upstream

**Gejala.** Setiap login credentials yang gagal (password salah, email tidak
terdaftar, akun Google-only) mengarahkan ke
`/api/auth/error?error=Configuration`. Artinya frontend akan menerima sinyal
"server salah konfigurasi" padahal yang terjadi hanya salah password — tidak
mungkin dibedakan dari kegagalan konfigurasi yang sesungguhnya.

**Penyebab (terverifikasi di kode `node_modules`, bukan dugaan).** Ada bug di
`@auth/core@0.34.1` — versi yang dikunci `@auth/express@0.5.x`. Di build
tersebut kelas `CredentialsSignin` dideklarasikan `extends Error`, bukan
`extends AuthError`:

```js
// node_modules/@auth/express/node_modules/@auth/core/errors.js:141
export class CredentialsSignin extends Error { ... }
```

Akibatnya, error yang dilempar saat `authorize()` mengembalikan `null` tidak
lolos cek `if (e instanceof AuthError) throw e` di route callback, sehingga
dibungkus jadi `CallbackRouteError`. `CallbackRouteError` tidak ada di daftar
`clientErrors`, jadi Auth.js memetakannya ke `"Configuration"`. Dibuktikan
langsung:

```
new CredentialsSignin() instanceof AuthError  →  false
  .type  →  undefined      .name  →  "Error"
```

**Perbaikan.** `authorize()` tidak lagi `return null`, tapi melempar subclass
`AuthError` sendiri yang `type`-nya memang ada di daftar `clientErrors`:

```ts
class InvalidCredentials extends AuthError {
  static type = "CredentialsSignin";
}
```

`AuthError` diimpor dari `@auth/express`, sehingga identitas kelasnya cocok
dengan salinan `@auth/core` yang benar (bersarang). Sesudah perbaikan,
ketiga kasus gagal mengembalikan `?error=CredentialsSignin`, dan pola
`signIn("credentials", { redirect: false })` menerima
`{"url":".../error?error=CredentialsSignin"}`. Semua kasus gagal tetap
dipetakan ke satu error yang sama, jadi tidak ada kebocoran informasi tentang
mana yang salah.

**Catatan untuk tim:** bug ini hilang sendiri kalau nanti naik ke
`@auth/core >= 0.41.3` (lihat §6.4) — subclass `InvalidCredentials` boleh
dihapus saat itu.

### 6.2 Peringatan `env-url-basepath-redundant`

**Gejala.** Setiap request memunculkan
`[auth][warn][env-url-basepath-redundant` di log.

**Penyebab.** `AUTH_URL` diisi `http://localhost:4000/api/auth`. `@auth/express`
sudah menurunkan `basePath` sendiri dari titik mounting route, jadi menulis
path di `AUTH_URL` bersifat redundan dan berpotensi bentrok.

**Perbaikan.** `AUTH_URL` diisi origin saja (`http://localhost:4000`), dan
`.env.example` diberi komentar penjelasnya. Peringatan hilang (0 kemunculan
di log sesudah perbaikan).

### 6.3 `npm install` tidak menjalankan build script native

**Gejala.** Sesudah `npm install`, `bcrypt` dan `prisma` tidak bisa dipakai —
binding native `bcrypt` tidak ter-build dan engine Prisma tidak terpasang.

**Penyebab.** npm 11 memblokir install script secara default
(`npm warn allow-scripts ... not yet covered by allowScripts`), sementara
`bcrypt` butuh `node-pre-gyp` dan `prisma` butuh postinstall-nya.

**Perbaikan.** Dijalankan sekali di repo ini:

```bash
npm approve-scripts @prisma/client bcrypt prisma @prisma/engines
npm install
```

**Cukup sekali untuk seluruh tim, bukan per mesin.** `npm approve-scripts`
menuliskan persetujuannya sebagai field `allowScripts` di
`backend/package.json`, dan field itu ikut ter-commit:

```json
"allowScripts": {
  "@prisma/client@6.19.3": true,
  "bcrypt@5.1.1": true,
  "prisma@6.19.3": true,
  "@prisma/engines@6.19.3": true
}
```

Jadi developer lain dan runner CI cukup `npm install` / `npm ci` seperti biasa.
Yang perlu diingat: persetujuannya **terpin per versi**, sehingga saat versi
`bcrypt` atau `prisma` dinaikkan nanti, `npm approve-scripts` perlu dijalankan
ulang sekali dan `package.json` di-commit lagi.

### 6.4 `npm audit`: 8 advisory pada dependency yang disepakati

Bukan error yang menghambat, tapi harus dilaporkan apa adanya:

| Paket | Tingkat | Masalah | Jalur |
|---|---|---|---|
| `@auth/core` `<0.41.3` | **critical** | Email normalizer memvalidasi alamat sebelum normalisasi Unicode → bypass homoglyph `@` ([GHSA-7rqj-j65f-68wh](https://github.com/advisories/GHSA-7rqj-j65f-68wh)) | runtime |
| `@auth/core` `<0.41.3` | high | `getToken()` melempar exception tak tertangkap pada header Bearer rusak | runtime |
| `@auth/core` `<=0.41.2` | moderate | Cookie `state`/`nonce`/PKCE tidak terikat ke provider pembuatnya | runtime |
| `cookie` `<0.7.0` | low | Menerima nama/path/domain cookie dengan karakter di luar batas | runtime (via `@auth/core@0.34.1`) |
| `tar` `<=7.5.20` | critical/high | Beberapa advisory path traversal & DoS | **build-time saja** (via `bcrypt` → `@mapbox/node-pre-gyp`) |
| `deepmerge-ts` `<8.0.0` | high | Stack exhaustion saat merge objek rekursif | **build-time saja** (via `prisma` → `@prisma/config`) |

Yang berdampak ke runtime produksi hanya `@auth/core` dan `cookie`. Keduanya
hanya bisa ditutup dengan menaikkan `@auth/core` ke `>= 0.41.3`, yang berarti
mengganti versi dependency yang sudah disepakati tim di Issue #33 — dan
`@auth/express@0.5.x` mengunci `@auth/core@0.34.1`, jadi perlu naik versi
`@auth/express` juga. **Tidak dilakukan di sini**; ini keputusan tim, bukan
keputusan sepihak. Rekomendasi: jadikan satu issue tersendiri, karena advisory
homoglyph `@` menyentuh langsung modul yang sedang dibangun (normalisasi
email saat sign-in).

---

## 7. Yang belum bisa diverifikasi

**Login Google end-to-end.** `BE.md` §9 meminta pembuktian dengan kredensial
OAuth asli dari Google Cloud Console. `AUTH_GOOGLE_ID` dan
`AUTH_GOOGLE_SECRET` belum tersedia, jadi round-trip penuh ke consent screen
Google belum pernah dijalankan.

Yang **sudah** dibuktikan tanpa kredensial asli:

- Provider Google ter-registrasi benar — `GET /api/auth/providers`
  menampilkannya dengan `signinUrl`/`callbackUrl` yang tepat.
- Dengan client ID placeholder, `POST /api/auth/signin/google` benar-benar
  302 ke `https://accounts.google.com/o/oauth2/v2/auth` lengkap dengan
  `code_challenge_method=S256` (PKCE), `scope=openid profile email`, dan
  `redirect_uri=http://localhost:4000/api/auth/callback/google`.
- Seluruh perilaku database yang dipakai callback Google — pembuatan user,
  linking Account, auto-link by email, constraint unik, cascade delete —
  sudah diuji langsung lewat adapter terhadap PostgreSQL nyata (§5.2).

Yang tersisa untuk diuji manusia: isi `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`,
daftarkan `http://localhost:4000/api/auth/callback/google` sebagai Authorized
redirect URI di Google Cloud Console, lalu buka
`http://localhost:4000/api/auth/signin` dan klik "Sign in with Google".

---

## 8. Temuan lain yang perlu keputusan tim

**`BE.md` §6 menulis `GET /api/auth/signin/google` untuk memulai alur OAuth.**
Itu konvensi NextAuth v4. Di Auth.js v5 (`@auth/core`, yang dipakai di sini),
memulai alur OAuth **wajib lewat `POST`** disertai `csrfToken`; `GET` ke path
yang sama membalas `UnknownAction: Unsupported action`. Ini bukan bug
implementasi — `GET /api/auth/signin` (tanpa nama provider) tetap merender
halaman pilihan provider, dan tombolnya melakukan `POST` ke
`/api/auth/signin/google`. Frontend yang memakai `signIn("google")` dari
Auth.js sudah otomatis benar. Saran: koreksi baris tabel itu di `BE.md` agar
tidak menyesatkan pengembang frontend yang memanggil API secara manual.

---

## 9. Catatan untuk menjalankan di mesin lain

1. `cd backend && npm install` — persetujuan install script native sudah
   tersimpan di `package.json` (field `allowScripts`), jadi tidak perlu
   menjalankan `npm approve-scripts` lagi (§6.3).
2. Salin `.env.example` → `.env`, lalu isi:
   - `DATABASE_URL` — arahkan ke PostgreSQL masing-masing. Pengujian di
     laporan ini memakai container PostgreSQL 16 sementara yang sudah
     dihapus lagi sesudah selesai, jadi nilai di `.env` perlu disesuaikan
     dengan database masing-masing sebelum dipakai.
   - `AUTH_SECRET` — **wajib dibuat ulang** dengan `npx auth secret`. Nilai
     yang ada di `.env` lokal hanya untuk pengujian dan tidak boleh dipakai
     di mana pun selain mesin ini.
   - `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` dari Google Cloud Console.
   - `AUTH_URL` — origin saja, tanpa `/api/auth` (lihat §6.2).
3. `npx prisma migrate dev` lalu `npm run seed`
4. `npm run dev`

`.env` sudah tercakup `.gitignore` (pola `.env*`), dan `/backend/dist`
ditambahkan ke `.gitignore` dalam pengerjaan ini. Sudah diverifikasi dengan
`git check-ignore`.

User dummy hasil seed (semua password `password123`):
`host@rentify.test` (HOST), `guest@rentify.test` (GUEST),
`admin@rentify.test` (ADMIN), dan `google-only@rentify.test` — akun tanpa
password untuk menguji bahwa login credentials menolaknya.

---

## 10. Kesimpulan

**Successful.** Modul autentikasi terbangun lengkap sesuai `BE.md` dan
`ARSITEKTUR.md`: registrasi dengan pemilihan peran, login email/password,
login Google dengan auto-link by email, sesi JWT di cookie httpOnly, logout,
dan middleware pembatas peran yang siap dipakai modul booking/listing
berikutnya. `npm run build` bersih tanpa error, migration berhasil dibuat dan
dijalankan di PostgreSQL nyata, dan seluruh 20 skenario kontrak API serta 12
pemeriksaan skema/adapter lulus.

Dua error ditemukan dan diperbaiki — satu bug upstream di `@auth/core@0.34.1`
yang membuat kegagalan login menyamar sebagai kesalahan konfigurasi, dan satu
salah isi `AUTH_URL`. Dua hal disisakan untuk keputusan tim, bukan diputuskan
sendiri: menaikkan versi `@auth/core` demi menutup advisory keamanan (§6.4),
dan koreksi satu baris di `BE.md` soal method HTTP untuk memulai alur Google
(§8). Satu item Definition of Done — login Google end-to-end — menunggu
kredensial OAuth asli (§7).
