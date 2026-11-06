import React, { useState } from "react";
import Link from "next/link";

export interface RegisterFieldErrors {
  name?: string[];
  email?: string[];
  phone?: string[];
  password?: string[];
  confirmPassword?: string[];
  agreeTerms?: string[];
}

interface RegisterCardProps {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
  loading: boolean;
  errorMessage: string | null;
  fieldErrors: RegisterFieldErrors;
  successMessage: string | null;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onAgreeTermsChange: (checked: boolean) => void;
  onFieldBlur?: (field: keyof RegisterFieldErrors) => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function RegisterCard({
  name,
  email,
  phone,
  password,
  confirmPassword,
  agreeTerms,
  loading,
  errorMessage,
  fieldErrors,
  successMessage,
  onNameChange,
  onEmailChange,
  onPhoneChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onAgreeTermsChange,
  onFieldBlur,
  onSubmit,
}: RegisterCardProps) {
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleBlur = (field: keyof RegisterFieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    onFieldBlur?.(field);
  };

  const baseInputClass =
    "w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#135d54] focus:ring-1 focus:ring-[#135d54] user-invalid:border-red-600 user-invalid:bg-red-50/30 transition-colors";

  return (
    <section className="bg-white text-stone-900 rounded-2xl p-6 sm:p-10 shadow-sm border border-stone-100">
      {/* Header Texts */}
      <p className="text-xs font-semibold uppercase tracking-wider text-[#135d54]">
        GET STARTED
      </p>
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-stone-900">
        Create your account
      </h2>
      <p className="mt-2 text-xs sm:text-sm text-stone-500">
        A few details and you are ready to explore.
      </p>

      {/* Status Messages */}
      <div aria-live="polite" className="mt-4">
        {errorMessage && (
          <div
            role="alert"
            className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700"
          >
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div
            role="status"
            className="p-3.5 rounded-lg bg-[#e6f0ee] border border-[#135d54]/30 text-xs text-[#135d54] flex items-center justify-between gap-2"
          >
            <span>{successMessage}</span>
            <Link
              href="/"
              className="font-semibold underline whitespace-nowrap hover:text-[#0f4a43]"
            >
              Ke Login &rarr;
            </Link>
          </div>
        )}
      </div>

      {/* Registration Form */}
      <form
        method="POST"
        onSubmit={onSubmit}
        noValidate
        className="mt-5 space-y-4"
      >
        {/* Full Name Input */}
        <div>
          <label
            htmlFor="name"
            className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
          >
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            enterKeyHint="next"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={() => handleBlur("name")}
            required
            minLength={2}
            maxLength={100}
            placeholder="Your full name"
            aria-invalid={Boolean(fieldErrors.name?.length)}
            aria-describedby={fieldErrors.name?.length ? "name-error" : undefined}
            suppressHydrationWarning
            className={`${baseInputClass} ${
              fieldErrors.name?.length ? "border-red-600 bg-red-50/30" : ""
            }`}
          />
          {fieldErrors.name?.[0] && (
            <p id="name-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.name[0]}
            </p>
          )}
        </div>

        {/* Email Input */}
        <div>
          <label
            htmlFor="email"
            className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="username"
            spellCheck={false}
            autoCapitalize="none"
            autoCorrect="off"
            enterKeyHint="next"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            onBlur={() => handleBlur("email")}
            required
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.email?.length)}
            aria-describedby={
              fieldErrors.email?.length ? "email-error" : undefined
            }
            suppressHydrationWarning
            className={`${baseInputClass} ${
              fieldErrors.email?.length ? "border-red-600 bg-red-50/30" : ""
            }`}
          />
          {fieldErrors.email?.[0] && (
            <p id="email-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.email[0]}
            </p>
          )}
        </div>

        {/* Phone Input */}
        <div>
          <label
            htmlFor="phone"
            className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
          >
            Phone
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            enterKeyHint="next"
            value={phone}
            onChange={(e) => onPhoneChange(e.target.value)}
            onBlur={() => handleBlur("phone")}
            required
            minLength={8}
            maxLength={20}
            placeholder="+62"
            aria-invalid={Boolean(fieldErrors.phone?.length)}
            aria-describedby={
              fieldErrors.phone?.length ? "phone-error" : undefined
            }
            suppressHydrationWarning
            className={`${baseInputClass} ${
              fieldErrors.phone?.length ? "border-red-600 bg-red-50/30" : ""
            }`}
          />
          {fieldErrors.phone?.[0] && (
            <p id="phone-error" className="mt-1 text-xs text-red-600">
              {fieldErrors.phone[0]}
            </p>
          )}
        </div>

        {/* Password & Confirm Password Row */}
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                enterKeyHint="next"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                onBlur={() => handleBlur("password")}
                required
                minLength={8}
                maxLength={72}
                pattern="(?=.*\d).{8,72}"
                placeholder="Create password"
                aria-invalid={Boolean(fieldErrors.password?.length)}
                aria-describedby="password-constraints"
                suppressHydrationWarning
                className={`${baseInputClass} ${
                  fieldErrors.password?.length
                    ? "border-red-600 bg-red-50/30"
                    : ""
                }`}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-xs sm:text-sm font-medium text-stone-800 mb-1.5"
              >
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                enterKeyHint="done"
                value={confirmPassword}
                onChange={(e) => onConfirmPasswordChange(e.target.value)}
                onBlur={() => handleBlur("confirmPassword")}
                required
                minLength={8}
                maxLength={72}
                placeholder="Repeat password"
                aria-invalid={Boolean(fieldErrors.confirmPassword?.length)}
                aria-describedby="password-constraints"
                suppressHydrationWarning
                className={`${baseInputClass} ${
                  fieldErrors.confirmPassword?.length
                    ? "border-red-600 bg-red-50/30"
                    : ""
                }`}
              />
            </div>
          </div>

          {/* Password Rules Hint */}
          <p
            id="password-constraints"
            className={`mt-2 text-[11px] sm:text-xs ${
              fieldErrors.password?.length && touched.password
                ? "text-red-600 font-medium"
                : "text-stone-400"
            }`}
          >
            Use at least 8 characters, including a number.
          </p>

          {fieldErrors.password?.[0] && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.password[0]}
            </p>
          )}
          {fieldErrors.confirmPassword?.[0] && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.confirmPassword[0]}
            </p>
          )}
        </div>

        {/* Terms of Service Checkbox */}
        <div className="pt-0.5">
          <div className="flex items-center gap-2">
            <input
              id="agreeTerms"
              name="agreeTerms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => onAgreeTermsChange(e.target.checked)}
              required
              aria-invalid={Boolean(fieldErrors.agreeTerms?.length)}
              suppressHydrationWarning
              className="h-3.5 w-3.5 rounded border-stone-300 accent-[#135d54] focus:ring-[#135d54] cursor-pointer"
            />
            <label
              htmlFor="agreeTerms"
              className="text-xs text-stone-600 select-none cursor-pointer"
            >
              I agree to the Terms of Service and Privacy Policy.
            </label>
          </div>
          {fieldErrors.agreeTerms?.[0] && (
            <p className="mt-1 text-xs text-red-600">
              {fieldErrors.agreeTerms[0]}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          suppressHydrationWarning
          className="w-full py-2.5 px-4 bg-[#135d54] hover:bg-[#0f4a43] text-white font-medium text-xs sm:text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>

        {/* Login Prompt */}
        <div className="pt-2">
          <p className="text-xs sm:text-sm text-stone-500">
            Already have an account?
          </p>
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-xs font-semibold text-[#135d54] hover:underline"
            >
              Login
            </Link>
          </div>
        </div>
      </form>
    </section>
  );
}
