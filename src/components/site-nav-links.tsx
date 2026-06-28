"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import type { UserRole } from "@prisma/client";

import { LogoutButton } from "./logout-button";

type NavItem = { href: string; label: string; match?: "exact" | "prefix" };

function isActive(pathname: string, href: string, match: "exact" | "prefix" = "exact"): boolean {
  const path = href.split("#")[0] || href;
  if (match === "prefix") {
    return pathname === path || pathname.startsWith(`${path}/`);
  }
  return pathname === path;
}

function NavLink({ href, children, match = "exact" }: { href: string; children: ReactNode; match?: "exact" | "prefix" }) {
  const pathname = usePathname();
  const active = isActive(pathname, href, match);

  return (
    <Link href={href} className={`nexus-nav-link ${active ? "nexus-nav-link-active" : ""}`} aria-current={active ? "page" : undefined}>
      {children}
    </Link>
  );
}

export function SiteNavLinks({
  role,
}: {
  role: UserRole | null;
}) {
  const items: NavItem[] = [];

  if (!role) {
    return (
      <nav className="flex items-center gap-1 text-sm">
        <NavLink href="/#quote">Get quote</NavLink>
        <NavLink href="/login">Staff login</NavLink>
      </nav>
    );
  }

  items.push({ href: "/#quote", label: "Get quote" });

  if (role === "ADMIN" || role === "OPERATIONS") {
    items.push({ href: "/dashboard", label: "Dashboard" });
    items.push({ href: "/admin/reports", label: "Reports", match: "prefix" });
  }

  if (role === "ADMIN" || role === "OPERATIONS" || role === "DRIVER") {
    items.push({ href: "/driver", label: "Driver" });
  }

  if (role === "CUSTOMER") {
    items.push({ href: "/account", label: "My bookings" });
  }

  if (role === "ADMIN") {
    items.push({ href: "/admin/pricing", label: "Pricing", match: "prefix" });
  }

  return (
    <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
      {items.map((item) => (
        <NavLink key={item.href} href={item.href} match={item.match}>
          {item.label}
        </NavLink>
      ))}
      <LogoutButton />
    </nav>
  );
}
