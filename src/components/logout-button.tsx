"use client";

export function LogoutButton() {

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/";
  }

  return (
    <button type="button" className="nexus-nav-link" onClick={logout}>
      Log out
    </button>
  );
}
