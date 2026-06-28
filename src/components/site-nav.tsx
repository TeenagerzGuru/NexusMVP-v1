import { getSession } from "@/lib/auth/session";

import { SiteNavLinks } from "./site-nav-links";

export async function SiteNav() {
  const session = await getSession();
  return <SiteNavLinks role={session?.role ?? null} />;
}
