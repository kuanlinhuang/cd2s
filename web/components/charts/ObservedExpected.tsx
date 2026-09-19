import { Bars } from "@/components/charts/Bars";

/**
 * The two numbers behind an "underexplored" label, side by side: how many articles
 * analyzed the data, and how many the reuse model predicts for a dataset of the same
 * size, age, breadth and access tier. Readers grasp "3 against about 200" at once; the
 * log-scale index they would have to look up.
 */

export function ObservedExpected({
  observed,
  expected,
  underexplored = false,
  labelWidth = 96,
  height = 8,
}: {
  observed: number;
  expected: number;
  underexplored?: boolean;
  labelWidth?: number;
  height?: number;
}) {
  const exp = expected < 1 ? expected.toFixed(1) : Math.round(expected).toLocaleString("en-US");
  return (
    <Bars
      labelWidth={labelWidth}
      valueWidth={56}
      height={height}
      rows={[
        {
          key: "observed",
          label: "Analyzed it",
          value: observed,
          tone: underexplored ? "emphasis" : "primary",
          title: `${observed.toLocaleString("en-US")} articles place the accession in their methods, results, a table or a figure`,
        },
        {
          key: "expected",
          label: "Expected",
          value: expected,
          display: `~${exp}`,
          tone: "muted",
          title: "Predicted by the reuse model from cohort size, years available, number of measurement types and access tier",
        },
      ]}
    />
  );
}

/** One plain sentence for the same two numbers. */
export function reuseSentence(observed: number | null | undefined, expected: number | null | undefined): string | null {
  if (expected === null || expected === undefined) return null;
  const exp = expected < 1 ? expected.toFixed(1) : Math.round(expected).toLocaleString("en-US");
  if (!observed) return `No article has analyzed these data. About ${exp} would be expected.`;
  return `${observed.toLocaleString("en-US")} article${observed === 1 ? "" : "s"} analyzed these data. About ${exp} would be expected.`;
}
