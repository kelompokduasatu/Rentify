import type { Request } from "express";
import type { ExpressAuth } from "@auth/express";
import { AuthError, getSession } from "@auth/express";
import Credentials from "@auth/express/providers/credentials";
import Google from "@auth/express/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcrypt";
import { z } from "zod";
import { prisma } from "./prisma";
import type { AuthSession, AuthUser } from "../types/auth";

// Tipe konfigurasi diambil langsung dari parameter ExpressAuth supaya selalu
// cocok dengan versi @auth/core yang benar-benar dipakai @auth/express.
export type ExpressAuthConfig = Parameters<typeof ExpressAuth>[0];

/**
 * Dilempar saat login credentials gagal (email tidak ada, akun Google-only,
 * atau password salah). Semua kasus dipetakan ke satu error yang sama supaya
 * tidak membocorkan mana yang salah.
 *
 * Kenapa tidak `return null` saja? Ada bug di `@auth/core@0.34.1` (versi yang
 * dikunci `@auth/express@0.5.x`): di build tersebut `CredentialsSignin`
 * `extends Error`, bukan `AuthError`. Akibatnya error dari `return null`
 * tidak lolos cek `instanceof AuthError` di route callback, dibungkus jadi
 * `CallbackRouteError`, dan frontend menerima `?error=Configuration` —
 * seolah-olah server salah konfigurasi, padahal cuma password salah.
 * Dengan melempar subclass `AuthError` ber-`type` "CredentialsSignin",
 * frontend menerima `?error=CredentialsSignin` sebagaimana mestinya.
 */
class InvalidCredentials extends AuthError {
  static type = "CredentialsSignin";
}

// Validasi kredensial yang masuk ke authorize(). Password di sini tidak
// dibatasi panjang minimum: aturan panjang hanya berlaku saat registrasi,
// login cukup mencocokkan apa adanya.
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const authConfig: ExpressAuthConfig = {
  // Adapter dipakai alur OAuth (membuat User + Account Google) dan tidak
  // dilewati provider Credentials — Auth.js memang melewatkannya.
  adapter: PrismaAdapter(prisma) as ExpressAuthConfig["adapter"],
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  // Wajib "jwt": Auth.js tidak mendukung database session bila ada
  // Credentials provider. Lihat arsitektur.md §4.
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 hari
  },

  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Menautkan otomatis akun Google ke User yang emailnya sudah terdaftar
      // lewat registrasi password (be.md §7 poin 3).
      allowDangerousEmailAccountLinking: true,
    }),

    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) throw new InvalidCredentials();

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
        });
        if (!user) throw new InvalidCredentials();

        // Akun murni Google (passwordHash null) tidak boleh login lewat
        // credentials — be.md §7 poin 2.
        if (!user.passwordHash) throw new InvalidCredentials();

        const cocok = await bcrypt.compare(password, user.passwordHash);
        if (!cocok) throw new InvalidCredentials();

        // Bukan object literal langsung, supaya `role` tidak kena excess
        // property check terhadap tipe User bawaan Auth.js.
        const hasil: AuthUser = {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
        };
        return hasil;
      },
    }),
  ],

  callbacks: {
    // Dipanggil saat token dibuat (login) dan tiap kali token dibaca ulang.
    // `user` hanya terisi pada saat login.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as Partial<AuthUser>).role;
      }

      // Login Google lewat adapter tidak membawa `role` di objek user, jadi
      // ambil sekali dari database lalu simpan di token.
      if (typeof token.id === "string" && !token.role) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true },
        });
        if (dbUser) token.role = dbUser.role;
      }

      return token;
    },

    async session({ session, token }) {
      const user = session.user as Partial<AuthUser> | undefined;
      if (user) {
        if (typeof token.id === "string") user.id = token.id;
        if (token.role) user.role = token.role as AuthUser["role"];
      }
      return session;
    },
  },
};

/**
 * Pembungkus `getSession()` dengan tipe sesi Rentify (`user.id` + `user.role`).
 * Ini satu-satunya tempat penyempitan tipe dilakukan — lihat catatan di
 * `src/types/auth.d.ts`.
 */
export async function getAuthSession(req: Request): Promise<AuthSession | null> {
  const session = await getSession(req, authConfig);
  return (session as AuthSession | null) ?? null;
}
