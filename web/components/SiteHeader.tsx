"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

/**
 * A route earns a header slot only if a first-time researcher would use it before
 * asking a question. Compare, the funding network, the underexplored list and the
 * software page all need something in hand first, so the agent, the browse page and
 * the dataset pages route to them instead.
 */
const NAV = [
  { href: "/datasets", label: "Datasets" },
  { href: "/questions", label: "Research questions" },
  { href: "/methods", label: "How this was built" },
];

function isActive(pathname: string, href: string) {
  return pathname === href || (href === "/datasets" && pathname.startsWith("/datasets/"));
}

function NavLinks({
  pathname,
  mobile = false,
  onNavigate,
}: {
  pathname: string;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  return NAV.map((item) => {
    const active = isActive(pathname, item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={onNavigate}
        className={`rounded-md whitespace-nowrap text-[13px] font-medium ${
          mobile ? "px-3 py-2.5" : "px-2.5 py-1.5"
        }`}
        style={{
          color: active ? "var(--accent-text)" : "var(--text-muted)",
          background: active ? "var(--accent-bg)" : undefined,
        }}
      >
        {item.label}
      </Link>
    );
  });
}

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur no-print"
      style={{ background: "color-mix(in srgb, var(--bg) 88%, transparent)" }}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="flex h-14 items-center gap-4 sm:gap-6">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2"
            onClick={() => setMenuOpen(false)}
          >
            <span
              aria-hidden
              className="grid h-6 w-6 shrink-0 place-items-center rounded font-mono text-[11px] font-bold"
              style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
            >
              CD
            </span>
            <span className="truncate font-semibold tracking-tight">Cancer Data Showcase</span>
          </Link>

          <nav aria-label="Primary" className="ml-auto hidden items-center gap-1 md:flex">
            <NavLinks pathname={pathname} />
          </nav>

          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setMenuOpen((open) => !open)}
            className="ml-auto shrink-0 rounded-md border px-3 py-1.5 text-[13px] font-medium md:hidden"
            style={{
              background: "var(--bg-raised)",
              borderColor: "var(--border-strong)",
            }}
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        {menuOpen && (
          <nav
            id="mobile-navigation"
            aria-label="Primary"
            className="grid grid-cols-2 gap-1 border-t py-2 md:hidden"
          >
            <NavLinks pathname={pathname} mobile onNavigate={() => setMenuOpen(false)} />
          </nav>
        )}
      </div>
    </header>
  );
}
