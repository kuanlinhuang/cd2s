"use client";

import { useEffect, useState } from "react";

/**
 * The sticky in-page navigation on a dataset page.
 *
 * A dataset page is long, so the nav marks which section is on screen and keeps that
 * link scrolled into view on narrow screens. Without JavaScript it is still a plain
 * row of anchor links.
 */
export type SectionItem = { id: string; label: string };

export default function SectionNav({ sections }: { sections: SectionItem[] }) {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    // The active section is the last one whose top has passed the sticky headers.
    const update = () => {
      const line = 140;
      let current: string | null = null;
      for (const el of els) {
        if (el.getBoundingClientRect().top <= line) current = el.id;
      }
      setActive(current ?? els[0].id);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [sections]);

  useEffect(() => {
    if (!active) return;
    document
      .querySelector<HTMLAnchorElement>(`[data-section-link="${active}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  return (
    <nav
      className="scroll-fade sticky top-14 z-30 -mx-4 mb-2 overflow-x-auto border-b px-4 backdrop-blur no-print sm:-mx-6 sm:px-6"
      style={{ background: "color-mix(in srgb, var(--bg) 92%, transparent)" }}
      aria-label="Sections of this page"
    >
      <div className="flex gap-1 py-2 text-[12px]">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <a
              key={s.id}
              href={`#${s.id}`}
              data-section-link={s.id}
              aria-current={isActive ? "location" : undefined}
              className="rounded px-2 py-1 whitespace-nowrap hover:underline"
              style={{
                color: isActive ? "var(--accent-text)" : "var(--text-muted)",
                background: isActive ? "var(--accent-bg)" : undefined,
                fontWeight: isActive ? 500 : undefined,
              }}
            >
              {s.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
