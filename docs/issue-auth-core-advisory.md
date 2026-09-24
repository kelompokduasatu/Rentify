# Draft issue — Advisory keamanan `@auth/core`: perlu keputusan naik versi

> Berkas ini adalah **draft** untuk ditempel ke GitHub Issues. Keputusan naik
> versi ada di tangan tim, bukan sesuatu yang diputuskan sepihak saat
> mengerjakan modul autentikasi. Data di bawah diambil dari `npm audit` pada
> `backend/` per 24 September 2026.

**Label yang disarankan:** `security`, `dependencies`, `backend`
**Terkait:** Issue #33 (kesepakatan dependency), PR modul autentikasi (`feat/be-login`)

---

## Ringkasan

`npm audit` di `backend/` melaporkan 3 advisory pada `@auth/core`, salah
satunya **critical** dan menyentuh langsung jalur kode yang baru saja kita
bangun (normalisasi email saat sign-in). Perbaikannya tersedia, tapi
mengharuskan kita menaikkan versi dependency yang sudah disepakati di
Issue #33 — karena itu dibawa ke issue terpisah untuk diputuskan bersama.

| Severity | Advisory | Rentang terdampak |
|---|---|---|
| **Critical** | [GHSA-7rqj-j65f-68wh](https://github.com/advisories/GHSA-7rqj-j65f-68wh) — email normalizer memvalidasi alamat **sebelum** normalisasi Unicode, sehingga karakter homoglyph `@` bisa dipakai untuk bypass | `>=0.1.0 <0.41.3` |
| High | [GHSA-xmf8-cvqr-rfgj](https://github.com/advisories/GHSA-xmf8-cvqr-rfgj) — `getToken()` melempar exception tak tertangkap pada header `Authorization: Bearer` yang rusak | `>=0.1.0 <0.41.3` |
| Moderate | [GHSA-x445-f3h2-j279](https://github.com/advisories/GHSA-x445-f3h2-j279) — cookie `state`, `nonce`, dan PKCE tidak terikat ke provider yang membuatnya | `<=0.41.2` |

Ikut terbawa: [GHSA-pxg6-pf52-xh8x](https://github.com/advisories/GHSA-pxg6-pf52-xh8x)
(low) pada `cookie@0.6.0`, yang masuk lewat `@auth/core@0.34.1`.

## Kenapa ini relevan untuk kita

Advisory yang critical bukan sesuatu yang jauh dari kode kita — ia menyentuh
**normalisasi email saat sign-in**, persis jalur yang dipakai dua fitur yang
baru dibangun:

- `authorize()` di `backend/src/lib/auth.ts` yang mencari user berdasarkan email
- **auto-link by email** pada login Google (`allowDangerousEmailAccountLinking: true`)

Kombinasi "cocokkan user by email" + "tautkan otomatis akun Google ke user
dengan email sama" adalah skenario yang paling terdampak kalau normalisasi
email bisa di-bypass. Perlu ditegaskan: **belum ada bukti eksploitasi pada
aplikasi kita** — yang dilaporkan di sini adalah paparan terhadap advisory
upstream, bukan temuan pentest.

## Kondisi dependency sekarang

Ada **tiga** salinan `@auth/core` di `backend/node_modules`:

| Salinan | Versi | Dipakai oleh |
|---|---|---|
| `node_modules/@auth/core` | 0.37.4 | level teratas (sesuai `^0.37.0` di Issue #33); praktis tidak dipakai saat runtime |
| `node_modules/@auth/express/node_modules/@auth/core` | **0.34.1** | ini yang benar-benar dieksekusi `ExpressAuth()` dan `getSession()` |
| `node_modules/@auth/prisma-adapter/node_modules/@auth/core` | 0.41.3 | type-only |

Penyebab nesting: `@auth/express@0.5.6` mengunci `@auth/core@0.34.1` secara
eksak. Artinya menaikkan `@auth/core` di `package.json` saja **tidak
menyelesaikan apa pun** — `@auth/express` harus ikut naik.

Menyeragamkan lewat `overrides` juga bukan jalan keluar: signature
`createActionURL()` berubah antara 0.34 dan 0.37 (argumen ke-5 berubah dari
`basePath: string` menjadi objek config `Pick<AuthConfig, "basePath" | "logger">`).
Memaksa `@auth/express@0.5.6` memakai core yang lebih baru justru merusak
`getSession()` saat runtime, karena ia masih memanggil versi lama.

## Jalur perbaikan yang diusulkan

```diff
  "dependencies": {
-   "@auth/core": "^0.37.0",
-   "@auth/express": "^0.5.0",
+   "@auth/core": "^0.41.3",
+   "@auth/express": "^0.12.3",
```

`@auth/express@0.12.3` bergantung pada `@auth/core@0.41.3` — persis versi yang
sudah bebas dari ketiga advisory di atas. `@auth/prisma-adapter` juga sudah
memakai 0.41.3, jadi sesudah upgrade hanya akan ada **satu** salinan
`@auth/core` di dependency tree.

`npm audit` menandai fix ini `isSemVerMajor: true`, jadi harus lewat PR
tersendiri dengan pengujian ulang, bukan `npm audit fix`.

### Tiga hal yang jadi lebih baik sebagai efek samping

Upgrade ini kebetulan menyelesaikan tiga kompromi yang saat ini ada di kode:

1. **Workaround `InvalidCredentials` bisa dihapus.** Di `@auth/core@0.34.1`
   ada bug: `CredentialsSignin extends Error`, bukan `AuthError` — akibatnya
   setiap login gagal dilaporkan ke frontend sebagai `?error=Configuration`
   (seolah server salah konfigurasi) alih-alih `CredentialsSignin`. Kita
   menambal ini dengan subclass sendiri di `backend/src/lib/auth.ts`. Di
   0.41.3 sudah diperbaiki menjadi `CredentialsSignin extends SignInError`,
   jadi subclass itu bisa dibuang dan `authorize()` kembali cukup
   `return null`.
2. **Module augmentation jadi bisa dipakai lagi.** `src/types/auth.d.ts`
   sekarang tidak bisa memakai `declare module "@auth/core/types"` (gagal
   dengan `TS2664`) justru karena ada tiga salinan `@auth/core`. Dengan satu
   salinan, pendekatan idiomatis yang diminta `CLAUDE.md` bisa dipulihkan dan
   helper `getAuthSession()` tidak lagi perlu melakukan penyempitan tipe
   manual.
3. **`ExpressAuthConfig` diekspor resmi.** `@auth/express@0.5.6` tidak
   mengekspornya, sehingga tipe konfigurasi kita turunkan lewat
   `Parameters<typeof ExpressAuth>[0]`. Versi 0.12.3 mengekspor
   `ExpressAuthConfig` langsung.

### Yang perlu diuji ulang kalau upgrade disetujui

`@auth/express@0.12.3` masih mendeklarasikan `peerDependencies: express ^4.18.2 || ^5.0.0`
dan `getBasePath()`-nya masih memakai mekanisme yang sama (`req.baseUrl` +
`req.params[0]`), jadi urutan mounting di `src/index.ts` kemungkinan besar tidak
berubah. Tetap perlu dibuktikan, bukan diasumsikan:

- [ ] Urutan mounting `authRoutes` sebelum `ExpressAuth` masih bekerja
      (`/api/auth/register` dan `/api/auth/me` tidak ditelan Auth.js)
- [ ] `npm run build` (tsc, `strict`) tetap 0 error
- [ ] Login credentials: berhasil untuk password benar; gagal untuk password
      salah, email tidak terdaftar, dan akun Google-only
- [ ] Kode error login gagal = `CredentialsSignin` (bukan `Configuration`)
      **tanpa** subclass `InvalidCredentials`
- [ ] `GET /api/auth/me` → 401 saat logout, 200 saat login
- [ ] `requireRole` menolak peran salah dengan 403
- [ ] Login Google end-to-end + auto-link by email
- [ ] `npm audit` bersih untuk `@auth/core` dan `cookie`

## Advisory lain yang **tidak** perlu ditindak sekarang

Keduanya hanya menyentuh tooling saat build, tidak ikut ke runtime produksi:

| Paket | Severity | Jalur |
|---|---|---|
| `tar <=7.5.20` | critical/high (beberapa advisory) | `bcrypt` → `@mapbox/node-pre-gyp` |
| `deepmerge-ts <8.0.0` | high | `prisma` → `@prisma/config` |

Akan hilang sendiri saat `bcrypt` dan `prisma` naik versi.

## Pertanyaan untuk tim

1. Setuju menaikkan `@auth/express` ke `^0.12.3` + `@auth/core` ke `^0.41.3`,
   meski itu mengubah kesepakatan di Issue #33?
2. Kalau setuju — dikerjakan sekarang (sebelum modul booking/e-KYC menumpuk di
   atas fondasi auth) atau dijadwalkan setelah modul autentikasi di-merge?
   Saran: **sebelum** modul lain menumpuk, karena permukaan perubahannya masih
   kecil dan checklist pengujiannya masih segar.
