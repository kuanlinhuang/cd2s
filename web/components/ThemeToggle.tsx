"use client";

import { useSyncExternalStore } from "react";

/**
 * System, light, dark - shown as three states rather than one switch.
 *
 * The stylesheet has always defined all three: `:root` is light, a
 * `prefers-color-scheme: dark` query takes over unless `data-theme="light"` is set, and
 * `data-theme="dark"` forces it the other way. Nothing ever wrote that attribute, so a
 * reader on a dark laptop could not get a light page to print or project from, and a
 * reader on a light one could not get the dark palette at all.
 *
 * Three buttons, not a toggle, because "follow my system" is a real choice and not the
 * absence of one. A two-state switch has to represent it as whichever end it happens to
 * be sitting on, and then silently stops following the system the first time it is
 * touched. Here the current state is always visible and always recoverable.
 */

export type Theme = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "cd2s-theme";

/** The attribute the stylesheet reads. `system` is its absence, not a third value. */
function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

/**
 * Set the attribute before the first paint, from the same key the control writes.
 *
 * Inlined into <head> by the root layout and deliberately not a module: anything
 * deferred, including every form of hydration, runs after the browser has already
 * painted a light page, and a reader who chose dark sees it flash white on every
 * navigation. Written defensively because a blocked or full localStorage throws on
 * read, and a theme preference is not worth a blank page.
 */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(t==="light"||t==="dark")document.documentElement.setAttribute("data-theme",t)}catch(e){}})()`;

// ------------------------------------------------------------------------------------
// The preference as an external store.
//
// It is one: it lives in localStorage, the boot script above reads it before React
// exists, and another tab can change it underneath this one. Reading it with
// `useSyncExternalStore` rather than an effect is what lets the server render and the
// hydrating render agree - both take `getServerSnapshot` - while the real value is
// picked up immediately afterwards.
// ------------------------------------------------------------------------------------

const listeners = new Set<() => void>();
let snapshot: Theme | null = null;

function readStored(): Theme {
  try {
    const t = localStorage.getItem(THEME_STORAGE_KEY);
    return t === "light" || t === "dark" ? t : "system";
  } catch {
    // Private windows and blocked site data: the control still works for this visit.
    return "system";
  }
}

/** Cached, because the hook requires a snapshot that is stable between changes. */
function getSnapshot(): Theme {
  if (snapshot === null) snapshot = readStored();
  return snapshot;
}

/** No preference is knowable on the server, so both sides start by following the OS. */
function getServerSnapshot(): Theme {
  return "system";
}

function subscribe(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

// `storage` fires in the other tabs, never the one that wrote. Registered once, at
// module scope, so it is not tied to any component being mounted.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e: StorageEvent) => {
    if (e.key !== null && e.key !== THEME_STORAGE_KEY) return;
    snapshot = readStored();
    applyTheme(snapshot);
    for (const l of listeners) l();
  });
}

function choose(next: Theme): void {
  snapshot = next;
  applyTheme(next);
  try {
    if (next === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Not being able to remember the choice is no reason to refuse it.
  }
  for (const l of listeners) l();
}

const OPTIONS: { value: Theme; label: string; icon: React.ReactNode }[] = [
  {
    value: "system",
    label: "Match system",
    icon: (
      <>
        <rect x="2.5" y="3" width="11" height="8" rx="1.25" />
        <path d="M6 13.5h4" />
      </>
    ),
  },
  {
    value: "light",
    label: "Light",
    icon: (
      <>
        <circle cx="8" cy="8" r="3.1" />
        <path d="M8 1.5v1.6M8 12.9v1.6M1.5 8h1.6M12.9 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" />
      </>
    ),
  },
  {
    value: "dark",
    label: "Dark",
    icon: <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3a5.6 5.6 0 1 0 6.6 6.6Z" />,
  },
];

export default function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return (
    <div
      className="flex shrink-0 items-center gap-0.5 rounded-lg border p-0.5 no-print"
      role="group"
      aria-label="Color theme"
      style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}
    >
      {OPTIONS.map((opt) => {
        const on = theme === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => choose(opt.value)}
            aria-pressed={on}
            title={opt.label}
            className="grid h-7 w-7 place-items-center rounded-md transition-colors"
            style={{
              background: on ? "var(--accent-bg)" : "transparent",
              color: on ? "var(--accent)" : "var(--text-faint)",
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
              focusable="false"
            >
              {opt.icon}
            </svg>
            <span className="sr-only">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
