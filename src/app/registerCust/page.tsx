"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

import { PageContainer } from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Card, CardSkeleton } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { fetchJson } from "@/lib/fetch-json";
import { email, hasErrors, required, type FieldErrors } from "@/lib/form-validation";

type RegisterField = "name" | "email" | "password" | "confirmPassword";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<RegisterField>>({});
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => setMounted(true), []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const nameVal = String(form.get("name") ?? "");
    const emailVal = String(form.get("email") ?? "");
    const passwordVal = String(form.get("password") ?? "");
    const confirmPasswordVal = String(form.get("confirmPassword") ?? "");

    const errors: FieldErrors<RegisterField> = {};

    const nameError = required(nameVal, "Please enter your full name.");
    if (nameError) errors.name = nameError;

    const emailError = email(emailVal);
    if (emailError) errors.email = emailError;

    const passwordError = required(passwordVal, "Please enter a password.");
    if (passwordError) {
      errors.password = passwordError;
    } else if (passwordVal.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }

    if (!confirmPasswordVal) {
      errors.confirmPassword = "Please confirm your password.";
    } else if (passwordVal !== confirmPasswordVal) {
      errors.confirmPassword = "Passwords do not match.";
    }

    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      const first = Object.keys(errors)[0] as RegisterField;
      event.currentTarget.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }

    setFieldErrors({});
    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ error?: string }>("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameVal,
          email: emailVal,
          password: passwordVal,
          role: "CUSTOMER",
        }),
      });

      if (!ok) {
        setError(data.error ?? "Registration failed");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          Create account
        </h1>
        <p className="mt-1 text-sm text-gray-500">Register as a new customer</p>

        <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
          <Field label="Full Name" error={fieldErrors.name}>
            <Input
              key={fieldErrors.name ? `name-shake-${shakeKey}` : "name"}
              name="name"
              data-field="name"
              type="text"
              autoComplete="name"
              invalid={!!fieldErrors.name}
              onChange={() => setFieldErrors((prev) => ({ ...prev, name: undefined }))}
            />
          </Field>

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

          <Field label="Password" error={fieldErrors.password}>
            <Input
              key={fieldErrors.password ? `password-shake-${shakeKey}` : "password"}
              name="password"
              data-field="password"
              type="password"
              autoComplete="new-password"
              invalid={!!fieldErrors.password}
              onChange={() => setFieldErrors((prev) => ({ ...prev, password: undefined }))}
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
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        {error && (
          <p className="animate-fade-in mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        <p className="mt-5 text-center text-xs text-gray-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold underline hover:text-gray-700">
            Sign in
          </Link>
        </p>
      </Card>
    </PageContainer>
  );
}