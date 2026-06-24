"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardSkeleton } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/field";
import { fetchJson } from "@/lib/fetch-json";
import { email, hasErrors, required, type FieldErrors } from "@/lib/form-validation";

type LoginField = "email" | "password";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<LoginField>>({});
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => setMounted(true), []);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const errors: FieldErrors<LoginField> = {};
    const emailError = email(String(form.get("email") ?? ""));
    if (emailError) errors.email = emailError;
    const passwordError = required(String(form.get("password") ?? ""), "Please enter your password.");
    if (passwordError) errors.password = passwordError;

    if (hasErrors(errors)) {
      setFieldErrors(errors);
      setShakeKey((k) => k + 1);
      const first = Object.keys(errors)[0] as LoginField;
      event.currentTarget.querySelector<HTMLElement>(`[data-field="${first}"]`)?.focus();
      return;
    }
    setFieldErrors({});

    setLoading(true);

    try {
      const { data, ok } = await fetchJson<{ role?: string; error?: string }>("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
        }),
      });

      if (!ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      if (data.role === "DRIVER") router.push("/driver");
      else if (data.role === "CUSTOMER") router.push("/account");
      else router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return <CardSkeleton className="mx-auto max-w-md" />;

  return (
    <Card className="animate-scale-in mx-auto max-w-md">
      <h1 className="text-2xl font-bold" style={{ color: "var(--brand-primary)" }}>
        Sign in
      </h1>
      <p className="mt-1 text-sm text-gray-500">Staff, drivers & customer accounts</p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
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
            autoComplete="current-password"
            invalid={!!fieldErrors.password}
            onChange={() => setFieldErrors((prev) => ({ ...prev, password: undefined }))}
          />
        </Field>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {error && (
        <p className="animate-fade-in mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <p className="mt-5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-500">
        Dev: <span className="font-mono">admin@nexus.local</span> / <span className="font-mono">Nexus2026!</span>
      </p>
    </Card>
  );
}
