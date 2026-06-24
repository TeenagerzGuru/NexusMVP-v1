import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

import { FieldError } from "@/components/ui/field-error";

export function Field({
  label,
  children,
  error,
}: {
  label: string;
  children: ReactNode;
  error?: string;
}) {
  return (
    <div className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">{label}</span>
      <div className="relative">
        {error && <FieldError message={error} />}
        {children}
      </div>
    </div>
  );
}

function inputClass(invalid?: boolean, extra?: string) {
  return ["nexus-input", invalid && "nexus-input-invalid", extra].filter(Boolean).join(" ");
}

export function Input({
  invalid,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return <input className={inputClass(invalid, className)} {...props} />;
}

export function Textarea({
  invalid,
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return <textarea className={inputClass(invalid, `resize-none ${className ?? ""}`.trim())} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="nexus-input" {...props} />;
}
