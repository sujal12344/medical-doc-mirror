"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Home", icon: "home" },
  { href: "/dashboard/products", label: "Products", icon: "box" },
  { href: "/dashboard/forms", label: "Forms", icon: "file" },
  { href: "/dashboard/compliance", label: "Compliance Guide", icon: "globe" },
  { href: "/dashboard/licenses", label: "License Vault", icon: "shield" },
  { href: "/dashboard/alerts", label: "Alerts", icon: "bell" },
  { href: "/dashboard/settings", label: "Settings", icon: "settings" },
];

const icons: Record<string, string> = {
  file: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  home: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1",
  box: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  shield: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
  upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
  globe: "M12 21a9 9 0 100-18 9 9 0 000 18zM3.6 9h16.8M3.6 15h16.8M12 3a15.3 15.3 0 014 9 15.3 15.3 0 01-4 9 15.3 15.3 0 01-4-9 15.3 15.3 0 014-9z",
  bot: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
  qms: "M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z",
  settings: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
  bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
};

export default function Sidebar({ userName }: { userName?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await signOut({ callbackUrl: "/login" });
  }

  return (
    <aside className="w-56 bg-surface border-r border-border flex flex-col h-full shrink-0">
      {/* Brand */}
      <div className="p-4 pb-3 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="w-8 h-8 bg-[var(--accent)]/15 border border-[var(--accent)]/30 rounded-lg flex items-center justify-center text-sm font-bold text-[var(--accent)]">S</span>
          <span className="text-base font-bold text-foreground tracking-tight">SwayamSutra</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-widest px-3 mb-2">Menu</p>
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition ${active
                  ? "bg-[var(--accent)]/10 text-[var(--accent)]"
                  : "text-muted hover:text-foreground hover:bg-surface2"
                }`}
            >
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={icons[item.icon] || ""} />
              </svg>
              <div className="min-w-0">
                <span className="block leading-tight">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Workflow hint */}
      <div className="mx-3 mb-3 p-3 bg-surface2 rounded-lg border border-border">
        <p className="text-[10px] font-semibold text-muted uppercase tracking-wide mb-1.5">Workflow</p>
        <div className="space-y-1.5">
          {["Learn Compliance", "Add Product", "Pick Country", "Fill & Export"].map((step, i) => (
            <div key={step} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] text-[9px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <span className="text-[11px] text-muted">{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* User */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-7 h-7 bg-[var(--accent)]/15 rounded-full flex items-center justify-center text-[11px] font-bold text-[var(--accent)]">
            {(userName || "U")[0].toUpperCase()}
          </div>
          <span className="text-[13px] font-medium text-foreground truncate flex-1">{userName || "User"}</span>
        </div>
        <button onClick={handleLogout} className="w-full text-left px-3 py-1.5 text-[11px] font-medium text-muted hover:text-[var(--status-error)] hover:bg-[var(--status-error-bg)] rounded-md transition">
          Sign out
        </button>
      </div>
    </aside>
  );
}
