/**
 * Records per repository, split by whether their reuse can be traced at all.
 *
 * The split is the point: two of the five repositories hold most of the corpus and
 * almost none of their records carry an accession that appears in article text, so
 * their reuse is unmeasurable rather than low.
 */

export type RepoRow = { repository: string; traceable: number; untraceable: number };

export function RepositoryBars({ rows }: { rows: RepoRow[] }) {
  const sorted = [...rows].sort(
    (a, b) => b.traceable + b.untraceable - (a.traceable + a.untraceable),
  );
  const max = Math.max(1, ...sorted.map((r) => r.traceable + r.untraceable));
  return (
    <div>
      <ul className="space-y-2">
        {sorted.map((r) => {
          const total = r.traceable + r.untraceable;
          return (
            <li
              key={r.repository}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: "minmax(72px, 110px) minmax(0, 1fr) 96px" }}
            >
              <span className="viz-label truncate">{r.repository}</span>
              <span className="block" style={{ width: `${(100 * total) / max}%` }}>
                <span
                  className="seg-bar"
                  style={{ height: 10 }}
                  role="img"
                  aria-label={`${r.repository}: ${r.traceable} traceable, ${r.untraceable} not traceable`}
                >
                  {r.traceable > 0 && (
                    <span
                      style={{ flex: `${r.traceable} 0 0`, background: "var(--viz-1)" }}
                      title={`${r.traceable.toLocaleString("en-US")} with a citable accession`}
                    />
                  )}
                  {r.untraceable > 0 && (
                    <span
                      style={{ flex: `${r.untraceable} 0 0`, background: "var(--viz-mute)" }}
                      title={`${r.untraceable.toLocaleString("en-US")} without a citable accession`}
                    />
                  )}
                </span>
              </span>
              <span className="viz-value text-right">
                {total.toLocaleString("en-US")}
                <span className="t-faint">
                  {" "}
                  &middot; {r.traceable.toLocaleString("en-US")} traceable
                </span>
              </span>
            </li>
          );
        })}
      </ul>
      <div className="viz-legend mt-3">
        <span>
          <span className="viz-swatch" style={{ background: "var(--viz-1)" }} />
          Accession can be searched for in the literature
        </span>
        <span>
          <span className="viz-swatch" style={{ background: "var(--viz-mute)" }} />
          No citable accession, so reuse cannot be traced
        </span>
      </div>
    </div>
  );
}
