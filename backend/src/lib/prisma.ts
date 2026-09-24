import { PrismaClient } from "@prisma/client";

// Singleton: ts-node-dev me-reload modul tiap kali file berubah, tanpa
// cache di globalThis tiap reload akan membuka pool koneksi baru.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
