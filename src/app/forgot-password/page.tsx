"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardSkeleton } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { fetchJson } from "@/lib/fetch-json";
import { email as validateEmail, hasErrors, required, type FieldErrors } from "@/lib/form-validation";

type Step = "email" | "otp" | "reset";
type FormField = "email" | "code" | "newPassword" | "confirmPassword";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<FormField>>({});
  const [shakeKey, setShakeKey] = useState(0);

  // State to hold data between steps
  const [emailAddress, setEmailAddress] = useState("");
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => setMounted(true), []);

  async function onEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const emailVal = String(form.get("email") ?? "");
    const errors: FieldErrors<FormField> = {};
    const emailErr = validateEmail(emailVal);
    if (emailErr) errors.email = emailErr;

    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ error?: string }>("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailVal }),
      });

      if (!ok) {
        setError(data.error ?? "Failed to request OTP");
        return;
      }

      setEmailAddress(emailVal);
      setStep("otp");
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to request OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onOtpSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const codeVal = String(form.get("code") ?? "");
    const errors: FieldErrors<FormField> = {};
    if (!codeVal) errors.code = "Please enter the 6-digit OTP";
    
    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ error?: string }>("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress, code: codeVal }),
      });

      if (!ok) {
        // specifically returning the error from backend here
        setError(data.error ?? "Failed to verify OTP");
        return;
      }

      setOtpCode(codeVal);
      setStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to verify OTP");
    } finally {
      setLoading(false);
    }
  }

  async function onResetSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const newPasswordVal = String(form.get("newPassword") ?? "");
    const confirmPasswordVal = String(form.get("confirmPassword") ?? "");
    
    const errors: FieldErrors<FormField> = {};
    if (!newPasswordVal) errors.newPassword = "Please enter a new password.";
    else if (newPasswordVal.length < 8) errors.newPassword = "Password must be at least 8 characters long.";

    if (!confirmPasswordVal) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (newPasswordVal !== confirmPasswordVal) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ error?: string }>("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailAddress, code: otpCode, newPassword: newPasswordVal }),
      });

      if (!ok) {
        setError(data.error ?? "Failed to reset password");
        return;
      }

      router.push("/login?reset=success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) {
    return (
      <PageContainer>
        <CardSkeleton className="mx-auto max-w-md" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Card className="animate-scale-in mx-auto max-w-md">
        <h1 className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
          Forgot Password
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {step === "email" && "Enter your email — if an account exists, we will send an OTP"}
          {step === "otp" && "If an account exists for that email, we sent a 6-digit OTP — enter it below"}
          {step === "reset" && "Create a new password"}
        </p>

        {step === "email" && (
          <form onSubmit={onEmailSubmit} noValidate className="mt-6 space-y-4">
            <Field label="Email" error={fieldErrors.email}>
              <Input
                key={fieldErrors.email ? `email-shake-${shakeKey}` : "email"}
                name="email"
                data-field="email"
                type="email"
                autoComplete="email"
                invalid={!!fieldErrors.email}
                onChange={() => setFieldErrors((prev) => ({ ...prev, email: undefined }))}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Sending OTP…" : "Send OTP"}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={onOtpSubmit} noValidate className="mt-6 space-y-4">
            <Field label="6-Digit OTP" error={fieldErrors.code}>
              <Input
                key={fieldErrors.code ? `code-shake-${shakeKey}` : "code"}
                name="code"
                data-field="code"
                type="text"
                maxLength={6}
                autoComplete="one-time-code"
                invalid={!!fieldErrors.code}
                onChange={() => setFieldErrors((prev) => ({ ...prev, code: undefined }))}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Verifying…" : "Verify OTP"}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={onResetSubmit} noValidate className="mt-6 space-y-4">
            <Field label="New Password" error={fieldErrors.newPassword}>
              <Input
                key={fieldErrors.newPassword ? `newPassword-shake-${shakeKey}` : "newPassword"}
                name="newPassword"
                data-field="newPassword"
                type="password"
                autoComplete="new-password"
                invalid={!!fieldErrors.newPassword}
                onChange={() => setFieldErrors((prev) => ({ ...prev, newPassword: undefined }))}
              />
            </Field>
            <Field label="Confirm Password" error={fieldErrors.confirmPassword}>
              <Input
                key={fieldErrors.confirmPassword ? `confirmPassword-shake-${shakeKey}` : "confirmPassword"}
                name="confirmPassword"
                data-field="confirmPassword"
                type="password"
                autoComplete="new-password"
                invalid={!!fieldErrors.confirmPassword}
                onChange={() => setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }))}
              />
            </Field>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Resetting…" : "Reset Password"}
            </Button>
          </form>
        )}

        {error && (
          <p className="animate-fade-in mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-5 text-center text-xs text-gray-500">
          Remember your password?{" "}
          <Link href="/login" className="font-semibold underline hover:text-gray-700">
            Sign in
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}
