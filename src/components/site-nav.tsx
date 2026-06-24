import Link from "next/link";

import { getSession } from "@/lib/auth/session";

import { LogoutButton } from "./logout-button";

export async function SiteNav() {
  const session = await getSession();

  return (
    <nav className="flex items-center gap-1 text-sm">
      {session ? (
        <>
          {(session.role === "ADMIN" || session.role === "OPERATIONS") && (
            <Link href="/dashboard" className="nexus-nav-link">
              Dashboard
            </Link>
          )}
          {(session.role === "ADMIN" || session.role === "OPERATIONS" || session.role === "DRIVER") && (
            <Link href="/driver" className="nexus-nav-link">
              Driver
            </Link>
          )}
          {session.role === "CUSTOMER" && (
            <Link href="/account" className="nexus-nav-link">
              My bookings
            </Link>
          )}
          {session.role === "ADMIN" && (
            <Link href="/admin/pricing" className="nexus-nav-link">
              Pricing
            </Link>
          )}
          <LogoutButton />
        </>
      ) : (
        <Link href="/login" className="nexus-nav-link font-medium">
          Staff login
        </Link>
      )}
    </nav>
  );
}
