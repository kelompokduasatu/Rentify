"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import LoginCard from "@/components/LoginCard";

const BACKEND_URL = "http://localhost:5000";

interface UserSession {
  id: string;
  name: string;
  email: string;
  role: string;
  image?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("admin@rentify.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<"checking" | "online" | "offline">("checking");
  const [responseLog, setResponseLog] = useState<Record<string, unknown> | null>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Periksa koneksi ke Backend Express saat komponen dimuat
  useEffect(() => {
    let ignore = false;

    fetch(`${BACKEND_URL}/`)
      .then((res) => {
        if (!ignore) {
          setBackendStatus(res.ok ? "online" : "offline");
        }
      })
      .catch(() => {
        if (!ignore) {
          setBackendStatus("offline");
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResponseLog(null);

    try {
      const res = await fetch(`${BACKEND_URL}/api/test-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setResponseLog({ status: res.status, data });

      if (res.ok && data.success) {
        setCurrentUser(data.user);
      } else {
        setCurrentUser(null);
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Gagal terhubung ke backend Express di port 5000";
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
