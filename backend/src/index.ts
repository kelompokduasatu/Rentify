import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./lib/auth";
import { requireRole } from "./middleware/requireRole";
import { authRoutes } from "./routes/authRoutes";

const app = express();
const PORT = Number(process.env.PORT ?? 4000);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:3000";

app.set("trust proxy", true);

app.use(
  cors({
    origin: CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "Rentify Backend API — modul Autentikasi.",
    endpoints: {
      register: "POST /api/auth/register",
      me: "GET /api/auth/me",
      signIn: "GET /api/auth/signin",
      signInGoogle: "GET /api/auth/signin/google",
      credentialsCallback: "POST /api/auth/callback/credentials",
      session: "GET /api/auth/session",
      signOut: "POST /api/auth/signout",
      hostPing: "GET /api/host/ping",
      guestPing: "GET /api/guest/ping",
    },
  });
});

app.get("/health", (_req, res) => {
  res.json({ success: true, message: "Server sehat." });
});

app.use("/api/auth", authRoutes);
app.use("/api/auth/*", ExpressAuth(authConfig));

app.get("/api/host/ping", requireRole("HOST", "ADMIN"), (_req, res) => {
  const session = res.locals.session;
  res.json({
    success: true,
    message: "Halo Host! Anda berhasil mengakses endpoint khusus Host.",
    user: session.user,
  });
});

app.get("/api/guest/ping", requireRole("GUEST", "ADMIN"), (_req, res) => {
  const session = res.locals.session;
  res.json({
    success: true,
    message: "Halo Guest! Anda berhasil mengakses endpoint khusus Guest.",
    user: session.user,
  });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Endpoint tidak ditemukan." });
});

app.listen(PORT, () => {
  console.log(`Rentify backend berjalan di http://localhost:${PORT}`);
  console.log(`Auth.js terpasang di http://localhost:${PORT}/api/auth/*`);
});
