"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LoginCard from "@/components/LoginCard";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

interface UserSession {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  image?: string | null;
}

export default function LoginPage() {
  const [email, setEmail] = useState("admin@rentify.test");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [responseLog, setResponseLog] = useState<Record<string, unknown> | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Periksa koneksi & sesi aktif di Backend Express saat komponen dimuat
  useEffect(() => {
    let ignore = false;

    async function checkBackendAndSession() {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, {
          credentials: "include",
        });

        if (ignore) return;

        if (!res.ok) {
          setBackendStatus("offline");
          return;
        }

        setBackendStatus("online");

        // Cek apakah sudah ada sesi login aktif di cookie
        const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
          credentials: "include",
        });
        if (!ignore && meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.user) {
            setCurrentUser(meData.user);
          }
        }
      } catch {
        if (!ignore) {
          setBackendStatus("offline");
        }
      }
    }

    checkBackendAndSession();

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    try {
      // 1. Ambil CSRF token dari Auth.js
      const csrfRes = await fetch(`${BACKEND_URL}/api/auth/csrf`, {
        credentials: "include",
      });

      if (!csrfRes.ok) {
        throw new Error("Gagal mengambil CSRF token dari server.");
      }

      const { csrfToken } = (await csrfRes.json()) as { csrfToken: string };

      // 2. Kirim kredensial ke endpoint callback Auth.js
      // redirect: "manual" mencegah fetch mengikuti redirect HTML jika @auth/express melakukan 302 redirect
      const loginRes = await fetch(`${BACKEND_URL}/api/auth/callback/credentials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Auth-Return-Redirect": "1",
        },
        credentials: "include",
        redirect: "manual",
        body: new URLSearchParams({
          csrfToken,
          email,
          password,
          json: "true",
        }),
      });

      // Parse respons JSON jika tersedia (ketika X-Auth-Return-Redirect / json=true didukung)
      let loginData: { url?: string } | null = null;
      const contentType = loginRes.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        loginData = await loginRes.json();
      }

      // Periksa apakah redirect URL dari Auth.js mengandung parameter ?error=...
      const redirectUrl = loginData?.url ?? loginRes.headers.get("Location") ?? "";
      if (redirectUrl.includes("error=")) {
        setResponseLog({
          status: 401,
          data: {
            success: false,
            message: "Email atau password salah.",
            errorUrl: redirectUrl,
          },
        });
        setCurrentUser(null);
        return;
      }

      // 3. Verifikasi sesi dan ambil data profil user dari /api/auth/me
      const meRes = await fetch(`${BACKEND_URL}/api/auth/me`, {
        credentials: "include",
      });
      const meData = await meRes.json();

      setResponseLog({ status: meRes.status, data: meData });

      if (meRes.ok && meData.success) {
        setCurrentUser(meData.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Gagal terhubung ke backend Express di ${BACKEND_URL}`;
      setResponseLog({
        status: "Error",
        message,
      });
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f7f6f2] text-stone-900 flex flex-col"
      data-backend-status={backendStatus}
      data-authenticated={Boolean(currentUser)}
      data-has-response={Boolean(responseLog)}
    >
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Promotional Card */}
          <HeroSection />

          {/* Right Login Card */}
          <LoginCard
            email={email}
            password={password}
            loading={loading}
            onEmailChange={setEmail}
            onPasswordChange={setPassword}
            onSubmit={handleLogin}
          />
        </div>
      </main>
    </div>
  );
}
