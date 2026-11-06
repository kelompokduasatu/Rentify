import React from "react";
import Link from "next/link";

interface LoginCardProps {
  email: string;
  password: string;
  loading: boolean;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginCard({
  email,
  password,
  loading,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginCardProps) {
  return (
    <section className="bg-white text-stone-900 rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-100">
      {/* Header Texts */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[#135d54]">
        WELCOME BACK
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900">
        Login to Rentify
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-stone-500">
        Pick up where your last journey left off.
      </p>

      {/* Login Form */}
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {/* Email / Phone Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
          >
            Email / phone
          </label>
          <input
            id="email"
            type="text"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            required
            placeholder="you@example.com or +62"
            suppressHydrationWarning
            className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#135d54] focus:ring-1 focus:ring-[#135d54] transition-colors"
          />
        </div>

        {/* Password Input */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            required
            placeholder="Enter your password"
            suppressHydrationWarning
            className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#135d54] focus:ring-1 focus:ring-[#135d54] transition-colors"
          />
        </div>

        {/* Forgot Password Link */}
        <div className="text-center py-1">
          <a
            href="#"
            className="text-xs font-semibold text-[#135d54] hover:underline"
          >
            Forgot password
          </a>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="w-full py-2.5 px-4 bg-[#135d54] hover:bg-[#0f4a43] text-white font-medium text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        {/* Divider */}
        <div className="text-xs text-stone-400 py-0.5">or</div>

        {/* Social Login Button */}
        <button
          type="button"
          suppressHydrationWarning
          className="w-full py-2.5 px-4 bg-white hover:bg-stone-50 border border-stone-400/80 text-[#135d54] font-semibold text-xs sm:text-sm rounded-lg transition-colors cursor-pointer"
        >
          Continue with Google
        </button>

        {/* Sign Up Prompt */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm text-stone-500">
            Don&apos;t have an account?
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/register"
              className="text-xs font-semibold text-[#135d54] hover:underline"
            >
              Sign up
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
