"use client";

import { useState, useEffect } from "react";

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
  const [responseLog, setResponseLog] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const BACKEND_URL = "http://localhost:5000";

  // Periksa koneksi ke Backend Express saat komponen dimuat
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    setBackendStatus("checking");
    try {
      const res = await fetch(`${BACKEND_URL}/`);
      if (res.ok) {
        setBackendStatus("online");
      } else {
        setBackendStatus("offline");
      }
    } catch {
      setBackendStatus("offline");
    }
  };

  const fillPreset = (presetEmail: string) => {
    setEmail(presetEmail);
    setPassword("password123");
  };

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
    } catch (err: any) {
      setResponseLog({
        status: "Error",
        message: err.message || "Gagal terhubung ke backend Express di port 5000",
      });
      setCurrentUser(null);
    } finally {
      setLoading(false);
    }
  };

  const testProtectedRoute = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/test-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      setResponseLog({
        testType: "Protected Route Simulator",
        status: res.status,
        result: data.success
          ? `Akses Diterima sebagai Role: ${data.user.role}`
          : "Akses Ditolak",
        data,
      });
    } catch (err: any) {
      setResponseLog({ status: "Error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Card Form Login */}
        <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-6 sm:p-8 rounded-2xl shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                Rentify Auth Test
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Pengujian Login Dummy Backend Express & Auth.js
              </p>
            </div>
            {/* Status Indicator */}
            <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-full border border-slate-800 text-xs">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendStatus === "online"
                    ? "bg-emerald-500 animate-pulse"
                    : backendStatus === "offline"
                    ? "bg-rose-500"
                    : "bg-amber-500"
                }`}
              />
              <span className="font-mono text-slate-300">
                {backendStatus === "online"
                  ? "Express 5000 Online"
                  : backendStatus === "offline"
                  ? "Backend Offline"
                  : "Checking..."}
              </span>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="mb-6 p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <label className="text-xs font-semibold text-slate-400 block mb-2">
              ⚡ Kredensial Dummy Cepat:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillPreset("admin@rentify.com")}
                className="text-left px-3 py-2 bg-indigo-950/50 hover:bg-indigo-900/50 border border-indigo-800/50 rounded-lg text-xs transition-colors"
              >
                <div className="font-bold text-indigo-300">🔑 Admin</div>
                <div className="text-slate-400 truncate">admin@rentify.com</div>
              </button>
              <button
                type="button"
                onClick={() => fillPreset("user@rentify.com")}
                className="text-left px-3 py-2 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-lg text-xs transition-colors"
              >
                <div className="font-bold text-slate-200">👤 User</div>
                <div className="text-slate-400 truncate">user@rentify.com</div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="nama@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                placeholder="••••••••"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Password dummy default: <code className="text-indigo-400 font-mono">password123</code>
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Memproses Login...
                </>
              ) : (
                "Uji Login Sekarang"
              )}
            </button>
          </form>

          {backendStatus === "offline" && (
            <div className="mt-4 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              ⚠️ Server backend di port 5000 tidak terdeteksi. Jalankan <code className="bg-rose-900/60 px-1 py-0.5 rounded font-mono">npm run dev</code> di folder backend.
            </div>
          )}
        </div>

        {/* Dynamic Status & Log Viewer */}
        <div className="space-y-6">
          {/* Status Sesi Pengguna */}
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
              <span>Status Sesi Pengguna</span>
              {currentUser && (
                <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono rounded-full">
                  TERAUTENTIKASI
                </span>
              )}
            </h2>

            {currentUser ? (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-400 text-lg">
                    {currentUser.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-100">{currentUser.name}</h3>
                    <p className="text-xs text-slate-400">{currentUser.email}</p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Role Pengguna:</span>
                  <span className="font-mono font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded border border-indigo-800">
                    {currentUser.role}
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    onClick={testProtectedRoute}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
                  >
                    Uji Akses Protected Endpoint (/api/protected)
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950/60 p-6 rounded-xl border border-slate-800/60 text-center text-slate-500 text-xs">
                Belum ada sesi aktif. Silakan lakukan login untuk menguji status pengguna.
              </div>
            )}
          </div>

          {/* Response Payload Log */}
          <div className="bg-slate-900/80 border border-slate-800 backdrop-blur-md p-6 rounded-2xl shadow-xl">
            <h2 className="text-sm font-semibold text-slate-300 mb-2 flex items-center justify-between">
              <span>Respon Payload Backend</span>
              <button
                onClick={checkBackendHealth}
                className="text-[10px] text-indigo-400 hover:underline font-mono"
              >
                Refreshed Status
              </button>
            </h2>

            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto max-h-52 text-slate-300">
              {responseLog ? (
                <pre>{JSON.stringify(responseLog, null, 2)}</pre>
              ) : (
                <span className="text-slate-600">Menunggu aksi login...</span>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
