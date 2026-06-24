import type { ReactNode } from "react";

import { SiteNav } from "@/components/site-nav";
import { getBrand } from "@/lib/brand/resolve";

import "./globals.css";

export default async function RootLayout({ children }: { children: ReactNode }) {
  const brand = await getBrand();

  return (
    <html lang="en-GB" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        style={
          {
            "--brand-primary": brand.colours.primary,
            "--brand-secondary": brand.colours.secondary,
            "--brand-accent": brand.colours.accent,
            "--brand-background": brand.colours.background,
          } as React.CSSProperties
        }
      >
        <div className="min-h-screen">
          <header
            className="animate-slide-down sticky top-0 z-50 border-b border-white/10 px-4 py-4 text-white shadow-lg"
            style={{
              background: `linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)`,
            }}
          >
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-white/70">NEXUS Portal</p>
                <h1 className="text-xl font-bold">{brand.name}</h1>
              </div>
              <SiteNav />
            </div>
          </header>
          <main className="page-enter mx-auto max-w-5xl px-4 py-8">{children}</main>
          <footer className="border-t border-black/5 py-6 text-center text-xs text-gray-500">
            {brand.name} · VAT {brand.vatNumber} · {brand.contactEmail}
          </footer>
        </div>
      </body>
    </html>
  );
}
