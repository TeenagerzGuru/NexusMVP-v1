import Link from "next/link";
import type { ReactNode } from "react";

import { SiteNav } from "@/components/site-nav";
import { SmoothScroll } from "@/components/smooth-scroll";
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
        <SmoothScroll>
        <div className="flex min-h-screen flex-col">
          <header
            className="animate-slide-down sticky top-0 z-50 border-b border-white/10 px-4 py-3.5 text-white shadow-lg backdrop-blur-md"
            style={{
              background: `linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 92%, transparent) 0%, color-mix(in srgb, var(--brand-secondary) 88%, transparent) 100%)`,
            }}
          >
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
              <Link href="/" className="group transition-opacity hover:opacity-90">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.25em] text-white/60">NEXUS Portal</p>
                <h1 className="text-lg font-bold tracking-tight sm:text-xl">{brand.name}</h1>
              </Link>
              <SiteNav />
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-black/5 bg-white">
            <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
              <div>
                <p className="font-semibold text-gray-900">{brand.name}</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  UK road freight — instant quotes, online booking and digital proof of delivery.
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contact</p>
                <ul className="mt-3 space-y-1.5 text-sm text-gray-600">
                  <li>
                    <a href={`mailto:${brand.contactEmail}`} className="hover:text-gray-900">
                      {brand.contactEmail}
                    </a>
                  </li>
                  {brand.contactPhone && (
                    <li>
                      <a href={`tel:${brand.contactPhone}`} className="hover:text-gray-900">
                        {brand.contactPhone}
                      </a>
                    </li>
                  )}
                  <li>VAT {brand.vatNumber}</li>
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Quick links</p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  <li>
                    <Link href="/#quote" className="text-gray-600 hover:text-gray-900">
                      Get a quote
                    </Link>
                  </li>
                  <li>
                    <Link href="/#services" className="text-gray-600 hover:text-gray-900">
                      Services
                    </Link>
                  </li>
                  <li>
                    <Link href="/login" className="text-gray-600 hover:text-gray-900">
                      Staff login
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="border-t border-black/5 py-4 text-center text-xs text-gray-400">
              © {new Date().getFullYear()} {brand.name}. All rights reserved.
            </div>
          </footer>
        </div>
        </SmoothScroll>
      </body>
    </html>
  );
}
