import { Router } from "express";
import { Prisma } from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";
import { getAuthSession } from "../lib/auth";
import { prisma } from "../lib/prisma";

export const authRoutes = Router();

const BCRYPT_COST = 12;

const registerSchema = z.object({
  name: z
    .string({ required_error: "Nama wajib diisi." })
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(100, "Nama maksimal 100 karakter."),
  email: z
    .string({ required_error: "Email wajib diisi." })
    .trim()
    .email("Format email tidak valid.")
    .toLowerCase(),
  // Batas atas 72 karakter mengikuti batas input bcrypt.
  password: z
    .string({ required_error: "Password wajib diisi." })
    .min(8, "Password minimal 8 karakter.")
    .max(72, "Password maksimal 72 karakter."),
  role: z
    .enum(["HOST", "GUEST"], {
      errorMap: () => ({ message: "Peran harus HOST atau GUEST." }),
    })
    .default("GUEST"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 karakter.")
    .max(20, "Nomor telepon maksimal 20 karakter.")
    .optional(),
});

/**
 * POST /api/auth/register
 * Registrasi akun baru. Tidak otomatis membuat sesi — frontend memanggil
 * signIn() Auth.js setelah respons 201.
 */
authRoutes.post("/register", async (req, res) => {
  const hasil = registerSchema.safeParse(req.body);

  if (!hasil.success) {
    res.status(400).json({
      success: false,
      message: "Data registrasi tidak valid.",
      errors: hasil.error.flatten().fieldErrors,
    });
    return;
  }

  const { name, email, password, role, phone } = hasil.data;

  try {
    // Lapisan pertama: cek di level aplikasi supaya pesannya ramah.
    const sudahAda = await prisma.user.findUnique({ where: { email } });
    if (sudahAda) {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar. Silakan login atau gunakan email lain.",
      });
      return;
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_COST);

    const user = await prisma.user.create({
      data: { name, email, passwordHash, role, phone },
      // select eksplisit — passwordHash tidak boleh ikut keluar.
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({
      success: true,
      message: "Registrasi berhasil. Silakan login.",
      user,
    });
  } catch (error) {
    // Lapisan kedua: constraint unik database, untuk kasus balapan
    // (dua request registrasi email sama nyaris bersamaan).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      res.status(409).json({
        success: false,
        message: "Email sudah terdaftar. Silakan login atau gunakan email lain.",
      });
      return;
    }

    console.error("[POST /api/auth/register]", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server saat registrasi.",
    });
  }
});

/**
 * GET /api/auth/me
 * Versi "ramah API" dari /api/auth/session: membalas 401 saat belum login,
 * bukan 200 dengan body kosong.
 */
authRoutes.get("/me", async (req, res) => {
  try {
    const session = await getAuthSession(req);

    if (!session?.user) {
      res.status(401).json({ success: false, message: "Belum login." });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: session.user.id,
        name: session.user.name ?? null,
        email: session.user.email ?? null,
        role: session.user.role,
        image: session.user.image ?? null,
      },
    });
  } catch (error) {
    console.error("[GET /api/auth/me]", error);
    res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat membaca sesi.",
    });
  }
});
