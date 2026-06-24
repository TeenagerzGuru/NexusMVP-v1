import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; children: ReactNode }) {
  return (
    <button
      className={`nexus-btn ${variant === "primary" ? "nexus-btn-primary" : "nexus-btn-ghost"} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
