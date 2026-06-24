import type { HTMLAttributes, ReactNode } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`nexus-card p-6 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`nexus-card overflow-hidden p-6 ${className}`}>
      <div className="animate-shimmer h-8 w-48 rounded-lg" />
      <div className="animate-shimmer mt-4 h-40 rounded-lg" />
    </div>
  );
}
