/**
 * Scale and tick helpers shared by the chart components.
 *
 * Kept deliberately small. Every chart on the site is either a horizontal bar, which
 * needs a linear scale, or the reuse scatter, which needs a log scale with an offset of
 * one so that zero has a position. Nothing here knows about pixels beyond a range.
 */

/**
 * Pixel positions are rounded to hundredths. Node and the browser can disagree in the
 * last floating-point digit of Math.log10, and a client component rendered on the
 * server would otherwise hydrate with a coordinate mismatch on every mark.
 */
const px = (v: number) => Math.round(v * 100) / 100;

/** Linear map from [d0, d1] to [r0, r1]. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
  const span = d1 - d0 || 1;
  return (v: number) => px(r0 + ((v - d0) / span) * (r1 - r0));
}

/** log10(v + 1) mapped onto a pixel range. The +1 gives zero counts a position. */
export function logPlusOne(d0: number, d1: number, r0: number, r1: number) {
  const l0 = Math.log10(d0 + 1);
  const l1 = Math.log10(d1 + 1);
  const span = l1 - l0 || 1;
  return (v: number) => px(r0 + ((Math.log10(Math.max(v, 0) + 1) - l0) / span) * (r1 - r0));
}

/** Powers of ten (plus zero) that fall inside [0, max], for a log(v+1) axis. */
export function logTicks(max: number): number[] {
  const out = [0];
  for (let p = 1; p <= max; p *= 10) out.push(p);
  return out;
}

/** Round up to a clean axis ceiling: 1, 2, 5 times a power of ten. */
export function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const exp = Math.floor(Math.log10(v));
  const base = Math.pow(10, exp);
  const m = v / base;
  const step = m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10;
  return step * base;
}

/** Compact number for axis ticks and tight labels: 1,200 -> 1.2K. */
export function compact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  if (Math.abs(n) >= 10_000) return `${Math.round(n / 1000)}K`;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString("en-US");
}

/** Share as a whole-number percentage string, with a floor so small shares still read. */
export function pctOf(part: number, total: number): string {
  if (!total) return "0%";
  const p = (100 * part) / total;
  if (p > 0 && p < 1) return "<1%";
  return `${Math.round(p)}%`;
}

export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
