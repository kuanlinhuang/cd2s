/**
 * The site mark: a gradient C enclosing a D and an S, with the superscript node that
 * makes it CD2S.
 *
 * Kept in sync by hand with `app/icon.svg`, which is the same artwork. They cannot be
 * one file: Next.js serves the favicon from the `app/icon.svg` convention, which has to
 * be a static asset, while the header needs a component that inherits the page's layout.
 * If you change one, change the other.
 *
 * The gradient and filter ids are namespaced because this renders inline in the
 * document, where a bare id like "glow" would collide with any chart on the page that
 * happened to choose the same one - and an SVG paint server silently resolves to
 * whichever element won, so the collision shows up as a mark that renders in the wrong
 * colour rather than as an error.
 */
export default function Logo({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label="Cancer Data Showcase"
      focusable="false"
    >
      <defs>
        <linearGradient id="cds-logo-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <filter id="cds-logo-glow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.75" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      <g filter="url(#cds-logo-glow)">
        <path
          d="M 145,55 A 62,62 0 1,0 145,145"
          fill="none"
          stroke="url(#cds-logo-arc)"
          strokeWidth="18"
          strokeLinecap="round"
        />
        <path
          d="M 90,65 L 112,65 C 130,65 130,95 112,95 L 90,95 Z"
          fill="none"
          stroke="#06b6d4"
          strokeWidth="10"
          strokeLinejoin="round"
        />
        <path
          d="M 90,105 L 112,105 C 124,105 124,122 112,125 C 100,128 100,140 116,140 L 130,140"
          fill="none"
          stroke="#6366f1"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <circle cx="152" cy="42" r="9" fill="#ec4899" />
        <circle cx="152" cy="42" r="4" fill="#ffffff" />
        <circle cx="145" cy="55" r="6" fill="#06b6d4" />
        <circle cx="145" cy="145" r="6" fill="#ec4899" />
      </g>
    </svg>
  );
}
