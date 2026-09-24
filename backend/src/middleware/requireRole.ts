import type { NextFunction, Request, Response } from "express";
import type { UserRole } from "@prisma/client";
import type { AuthSession } from "../types/auth";
import { getAuthSession } from "../lib/auth";

// Sesi hasil verifikasi JWT disimpan di res.locals supaya handler di
// belakang middleware tidak perlu memanggil getSession() lagi.
async function ambilSesi(req: Request, res: Response): Promise<AuthSession | null> {
  if (res.locals.session) return res.locals.session as AuthSession;

  const session = await getAuthSession(req);
  res.locals.session = session;
  return session;
}

/** Hanya memastikan ada sesi valid, tanpa peduli peran. */
export function requireAuth() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await ambilSesi(req, res);

      if (!session?.user) {
        res.status(401).json({ success: false, message: "Belum login." });
        return;
      }

      next();
    } catch (error) {
      console.error("[requireAuth]", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memeriksa sesi.",
      });
    }
  };
}

/** Memastikan ada sesi valid DAN perannya termasuk salah satu `roles`. */
export function requireRole(...roles: UserRole[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await ambilSesi(req, res);

      if (!session?.user) {
        res.status(401).json({ success: false, message: "Belum login." });
        return;
      }

      if (!session.user.role || !roles.includes(session.user.role)) {
        res.status(403).json({
          success: false,
          message: `Akses ditolak. Endpoint ini hanya untuk peran: ${roles.join(", ")}.`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error("[requireRole]", error);
      res.status(500).json({
        success: false,
        message: "Terjadi kesalahan saat memeriksa sesi.",
      });
    }
  };
}
