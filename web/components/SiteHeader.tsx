import Link from "next/link";

import { Nav, type NavItem } from "@/components/Nav";

/**
 * The header: the wordmark, and one control that opens everywhere else.
 *
 * This used to carry three links chosen on the rule that a route earns a header slot
 * only if a first-time researcher would use it before asking a question, with Compare,
 * the funding network, the underexplored list and the software page reached from the
 * pages that lead to them. That rule is a reasonable one and this reverses it, on the
 * product call that all seven destinations stay reachable from every page - but behind
 * one control rather than as a row, so the header costs a reader one decision instead
 * of seven and has room to say what each destination holds. See components/Nav.tsx.
 *
 * A server component now: the nav's counts come from the corpus, and the only thing
 * that needed the client was the old mobile menu's open state, which `Nav` owns.
 */
export default function SiteHeader({ items }: { items: NavItem[] }) {
  return (
    <header
      className="sticky top-0 z-40 border-b backdrop-blur no-print"
      style={{ background: "color-mix(in srgb, var(--bg) 96%, transparent)" }}
    >
      <div className="mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="flex h-16 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex min-w-0 shrink-0 items-center gap-2.5">
            {/* The monogram stacks so all four characters stay legible in a 32px mark;
                the expansion sits beside the name on wide screens and drops on a phone,
                where the name alone has to carry the header. */}
            <span
              aria-hidden
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold leading-[1.05]"
              style={{ background: "var(--accent)", color: "var(--bg-raised)" }}
            >
              <span>CD</span>
              <span>2S</span>
            </span>
            <span className="truncate text-title font-semibold tracking-tight">CD2S</span>
            <span className="hidden truncate text-body lg:inline t-faint">
              Cancer Data to Study
            </span>
          </Link>
          <Nav items={items} />
        </div>
      </div>
    </header>
  );
}
