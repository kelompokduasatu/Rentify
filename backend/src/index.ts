import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./config/auth.config";
import { requireAuth, requireRole } from "./middlewares/auth.middleware";
import { authenticateDummyUser, DUMMY_USERS } from "./config/dummyUsers";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// Middlewares
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 1. Auth.js Route Handler (Mendukung /api/auth/signin, /api/auth/callback, /api/auth/session, dll)
app.use("/api/auth/*", ExpressAuth(authConfig));

// 2. Info Route Utama
app.get("/", (req, res) => {
  res.json({
    name: "Rentify Express Backend API",
    status: "Running",
    version: "1.0.0",
    dummyAccountsForTesting: DUMMY_USERS.map((u) => ({
      email: u.email,
      password: "password123",
      role: u.role,
      name: u.name,
    })),
    endpoints: {
      authJS: "/api/auth/*",
      testDummyLogin: "POST /api/test-login",
      protectedRoute: "GET /api/protected",
      adminProtectedRoute: "GET /api/admin/protected",
    },
  });
});

// 3. Endpoint Pengujian Direct Dummy Login (Untuk memverifikasi kredensial dummy tanpa browser)
app.post("/api/test-login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: "Email dan password wajib diisi.",
    });
  }

  const user = await authenticateDummyUser(email, password);

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Email atau password dummy salah.",
    });
  }

  return res.json({
    success: true,
    message: "Login dummy berhasil!",
    user,
    note: "Untuk sesi lengkap Auth.js di browser/Next.js, gunakan endpoint /api/auth/signin/credentials",
  });
});

// 4. Protected Route (Semua user terautentikasi)
app.get("/api/protected", requireAuth, (req, res) => {
  const session = res.locals.session;
  res.json({
    success: true,
    message: "Selamat datang! Anda berhasil mengakses endpoint terproteksi.",
    user: session.user,
  });
});

// 5. Protected Admin Route (Hanya role ADMIN)
app.get("/api/admin/protected", requireAuth, requireRole("ADMIN"), (req, res) => {
  const session = res.locals.session;
  res.json({
    success: true,
    message: "Selamat datang Admin! Anda memiliki akses khusus ke endpoint ini.",
    user: session.user,
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 Rentify Backend Server running at http://localhost:${PORT}`);
  console.log(`🔐 Auth.js routes available at http://localhost:${PORT}/api/auth/*`);
  console.log(`🧪 Test dummy accounts: admin@rentify.com / password123`);
  console.log(`====================================================`);
});
