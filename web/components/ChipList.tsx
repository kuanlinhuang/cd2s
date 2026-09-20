"use client";

import { useState } from "react";

import { Chip, type ChipTone } from "@/components/ui";

export type ChipListItem = { key: string; label: string; tone?: ChipTone; title?: string };

/**
 * A wrapping row of chips that folds a long list behind "Show all", so a record with
 * seventy disease labels does not push the rest of the page off screen.
 */
export default function ChipList({
  items,
  what,
  limit = 12,
}: {
  items: ChipListItem[];
  /** Plural noun for the toggle, for example "cancer types and sites". */
  what: string;
  limit?: number;
}) {
  const [open, setOpen] = useState(false);
  const folded = items.length > limit && !open;
  const shown = folded ? items.slice(0, limit) : items;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((it) => (
          <Chip key={it.key} tone={it.tone} title={it.title} wrap>
            {it.label}
          </Chip>
        ))}
      </div>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={!folded}
          className="mt-2 text-meta underline t-muted"
        >
          {folded
            ? `Show all ${items.length.toLocaleString("en-US")} ${what}`
            : "Show fewer"}
        </button>
      )}
    </div>
  );
}
