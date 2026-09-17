import { Request, Response, NextFunction } from "express";
import { getSession } from "@auth/express";
import { authConfig } from "../config/auth.config";

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const session = await getSession(req, authConfig);

    if (!session || !session.user) {
      return res.status(401).json({
        success: false,
        message: "Akses ditolak. Silakan login terlebih dahulu.",
      });
    }

    res.locals.session = session;
    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan saat memeriksa sesi autentikasi.",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const session = res.locals.session;
    const userRole = session?.user?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Membutuhkan hak akses: ${roles.join(", ")}`,
      });
    }

    return next();
  };
}
