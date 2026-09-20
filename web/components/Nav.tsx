"use client";

/**
 * One menu, opened from one button, instead of a row of tabs.
 *
 * As a row the destinations cost a reader the same set of decisions on every page, in
 * small type, with nothing to say what
 * any of them held. A single control collapses that to one decision, and buys the space
 * to answer the only question a visitor actually has about a nav item: why would I click
 * this. So every entry carries a one-line hint and a count where there is one to give.
 *
 * The button is labelled with the section currently open, not with the word "Menu", so
 * the header still answers "where am I" without being unfolded.
 *
 * Groups are labelled here rather than merely separated, because the panel is read once,
 * deliberately, unlike a persistent bar where a label is a word to skip past forever.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";

export interface NavItem {
  href: string;
  label: string;
  hint: string;
  /** Shown right-aligned: how much is behind the link. */
  count?: string;
  group: "find" | "use" | "trust";
}

const GROUPS: { key: NavItem["group"]; label: string }[] = [
  { key: "find", label: "Find data" },
  { key: "use", label: "Work with it" },
  { key: "trust", label: "Check the evidence" },
];

function isActive(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

export function Nav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  // The route the panel was opened on, rather than a boolean.
  //
  // The panel is a way to leave the page, so it has no business still being open on the
  // next one - including after a back button, which no click handler sees. Storing the
  // route makes that fall out of a comparison instead of needing an effect to undo
  // state after the fact, which is a cascading render and the thing the React lint rule
  // is there to catch.
  const [openAt, setOpenAt] = useState<string | null>(null);
  const open = openAt !== null && openAt === pathname;
  const close = () => setOpenAt(null);
  const wrap = useRef<HTMLDivElement>(null);
  const panelId = useId();

  const current = items.find((n) => isActive(pathname, n.href));
  const label = current?.label ?? "Explore resources";

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpenAt(open ? null : pathname)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded-lg border px-3.5 py-2 text-body font-medium"
        style={{
          borderColor: open ? "var(--accent)" : "var(--border-strong)",
          background: open ? "var(--accent-bg)" : "var(--bg-raised)",
          color: open ? "var(--accent)" : "var(--text)",
        }}
      >
        <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden focusable="false">
          {[1, 6, 11].map((y) => (
            <rect key={y} x="0" y={y - 1} width="16" height="2" rx="1" fill="currentColor" />
          ))}
        </svg>
        <span className="hidden whitespace-nowrap sm:inline">{label}</span>
        <span className="whitespace-nowrap sm:hidden">Explore</span>
        <svg
          width="11"
          height="7"
          viewBox="0 0 11 7"
          aria-hidden
          focusable="false"
          style={{ transform: open ? "rotate(180deg)" : undefined, opacity: 0.7 }}
        >
          <path d="M1 1.5 5.5 5.5 10 1.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          id={panelId}
          role="menu"
          aria-label="Site sections"
          className="absolute right-0 z-50 mt-2 w-[min(94vw,470px)] overflow-hidden rounded-xl border"
          style={{
            borderColor: "var(--border-strong)",
            background: "var(--bg-raised)",
            boxShadow: "0 16px 44px rgb(0 0 0 / 0.22)",
          }}
        >
          {GROUPS.map((group, gi) => (
            <div key={group.key} className={gi > 0 ? "border-t" : undefined}>
              <p className="px-4 pt-3.5 pb-1 text-micro font-semibold uppercase tracking-wider t-faint">
                {group.label}
              </p>
              <ul className="pb-3">
                {items
                  .filter((n) => n.group === group.key)
                  .map((n) => {
                    const active = isActive(pathname, n.href);
                    return (
                      <li key={n.href}>
                        <Link
                          href={n.href}
                          role="menuitem"
                          aria-current={active ? "page" : undefined}
                          onClick={close}
                          className="flex items-baseline gap-3 px-4 py-2 hover:bg-[var(--bg-sunken)]"
                          style={active ? { background: "var(--accent-bg)" } : undefined}
                        >
                          <span className="min-w-0 flex-1">
                            <span
                              className="block text-body font-semibold"
                              style={{ color: active ? "var(--accent)" : "var(--text)" }}
                            >
                              {n.label}
                            </span>
                            <span className="block text-meta t-muted">{n.hint}</span>
                          </span>
                          {n.count && (
                            <span
                              className="tnum shrink-0 text-meta font-semibold"
                              style={{ color: "var(--accent)" }}
                            >
                              {n.count}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
