"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import RegisterHeroSection from "@/components/RegisterHeroSection";
import RegisterCard, { RegisterFieldErrors } from "@/components/RegisterCard";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState<
    "checking" | "online" | "offline"
  >("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<RegisterFieldErrors>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Periksa koneksi ke Backend Express saat komponen dimuat
  useEffect(() => {
    let ignore = false;

    async function checkBackend() {
      try {
        const res = await fetch(`${BACKEND_URL}/health`, {
          credentials: "include",
        });

        if (ignore) return;
        setBackendStatus(res.ok ? "online" : "offline");
      } catch {
        if (!ignore) {
          setBackendStatus("offline");
        }
      }
    }

    checkBackend();

    return () => {
      ignore = true;
    };
  }, []);

  const validateSingleField = (
    field: keyof RegisterFieldErrors
  ): string[] | undefined => {
    switch (field) {
      case "name": {
        const trimmed = name.trim();
        if (!trimmed) return ["Nama wajib diisi."];
        if (trimmed.length < 2) return ["Nama minimal 2 karakter."];
        if (trimmed.length > 100) return ["Nama maksimal 100 karakter."];
        return undefined;
      }
      case "email": {
        const trimmed = email.trim();
        if (!trimmed) return ["Email wajib diisi."];
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
          return ["Format email tidak valid."];
        }
        return undefined;
      }
      case "phone": {
        const trimmed = phone.trim();
        if (!trimmed) return ["Nomor telepon wajib diisi."];
        if (trimmed.length < 8) return ["Nomor telepon minimal 8 karakter."];
        if (trimmed.length > 20) return ["Nomor telepon maksimal 20 karakter."];
        return undefined;
      }
      case "password": {
        if (!password) return ["Password wajib diisi."];
        if (password.length < 8) return ["Password minimal 8 karakter."];
        if (password.length > 72) return ["Password maksimal 72 karakter."];
        if (!/\d/.test(password)) {
          return ["Password harus mengandung minimal 1 angka."];
        }
        return undefined;
      }
      case "confirmPassword": {
        if (!confirmPassword) return ["Konfirmasi password wajib diisi."];
        if (confirmPassword !== password) {
          return ["Konfirmasi password tidak cocok."];
        }
        return undefined;
      }
      case "agreeTerms": {
        if (!agreeTerms) {
          return ["Anda harus menyetujui Terms of Service dan Privacy Policy."];
        }
        return undefined;
      }
      default:
        return undefined;
    }
  };

  const handleFieldBlur = (field: keyof RegisterFieldErrors) => {
    const err = validateSingleField(field);
    setFieldErrors((prev) => ({ ...prev, [field]: err }));
  };

  const clearFieldError = (field: keyof RegisterFieldErrors) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const validateAll = (): boolean => {
    const fields: (keyof RegisterFieldErrors)[] = [
      "name",
      "email",
      "phone",
      "password",
      "confirmPassword",
      "agreeTerms",
    ];
    const nextErrors: RegisterFieldErrors = {};
    let isValid = true;

    for (const field of fields) {
      const err = validateSingleField(field);
      if (err && err.length > 0) {
        nextErrors[field] = err;
        isValid = false;
      }
    }

    setFieldErrors(nextErrors);
    return isValid;
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!validateAll()) {
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
          phone: phone.trim(),
          role: "GUEST",
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        message?: string;
        errors?: Partial<Record<keyof RegisterFieldErrors, string[]>>;
      };

      if (!res.ok || !data.success) {
        if (data.errors) {
          setFieldErrors((prev) => ({ ...prev, ...data.errors }));
        }
        setErrorMessage(
          data.message ?? "Registrasi gagal. Silakan periksa kembali data Anda."
        );
        return;
      }

      setSuccessMessage(
        data.message ?? "Registrasi berhasil! Mengarahkan ke halaman Login..."
      );

      setTimeout(() => {
        router.push("/");
      }, 1800);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : `Gagal terhubung ke backend Express di ${BACKEND_URL}`;
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#f7f6f2] text-stone-900 flex flex-col"
      data-backend-status={backendStatus}
    >
      {/* Top Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-14 flex items-center">
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Promotional Card */}
          <RegisterHeroSection />

          {/* Right Registration Card */}
          <RegisterCard
            name={name}
            email={email}
            phone={phone}
            password={password}
            confirmPassword={confirmPassword}
            agreeTerms={agreeTerms}
            loading={loading}
            errorMessage={errorMessage}
            fieldErrors={fieldErrors}
            successMessage={successMessage}
            onNameChange={(val) => {
              setName(val);
              clearFieldError("name");
            }}
            onEmailChange={(val) => {
              setEmail(val);
              clearFieldError("email");
            }}
            onPhoneChange={(val) => {
              setPhone(val);
              clearFieldError("phone");
            }}
            onPasswordChange={(val) => {
              setPassword(val);
              clearFieldError("password");
            }}
            onConfirmPasswordChange={(val) => {
              setConfirmPassword(val);
              clearFieldError("confirmPassword");
            }}
            onAgreeTermsChange={(checked) => {
              setAgreeTerms(checked);
              clearFieldError("agreeTerms");
            }}
            onFieldBlur={handleFieldBlur}
            onSubmit={handleRegister}
          />
        </div>
      </main>
    </div>
  );
}
