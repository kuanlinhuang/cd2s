import Link from "next/link";

import Logo from "@/components/Logo";
import { Nav, type NavItem } from "@/components/Nav";
import ThemeToggle from "@/components/ThemeToggle";

/**
 * The header: the wordmark, and one control that opens everywhere else.
 *
 * This used to carry three links chosen on the rule that a route earns a header slot
 * only if a first-time researcher would use it before asking a question, with Compare,
 * the funding network, the underexplored list and the software page reached from the
 * pages that lead to them. That rule is a reasonable one and this reverses it, on the
 * product call that all destinations stay reachable from every page - but behind
 * one control rather than as a row, so the header costs a reader one decision instead
 * of a full link row and has room to say what each destination holds. See components/Nav.tsx.
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
        {/* 72px, not more: `scroll-mt-20` is what holds an anchored section clear of
            this bar, and at 80px a section jumped to from the in-page nav would land
            underneath it. */}
        <div className="flex h-[72px] items-center gap-4 sm:gap-6">
          <Link
            href="/"
            aria-label="CD2S, Cancer Data to Science"
            className="flex min-w-0 shrink-0 items-center gap-3"
          >
            <Logo size={44} className="shrink-0" />
            <span className="hidden min-w-0 min-[460px]:block">
              <span className="block truncate text-2xl font-semibold leading-tight tracking-tight">
                CD2S
              </span>
              <span className="hidden truncate text-meta leading-tight t-muted md:block">
                Cancer Data to Science
              </span>
            </span>
          </Link>
          <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <Nav items={items} />
          </div>
        </div>
      </div>
    </header>
  );
}
