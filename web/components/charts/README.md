# Charts

Every chart on the site is built from these components.
No chart library: the marks are HTML and inline SVG, so they render on the server, print cleanly, and follow the site's colour tokens in both themes.

## Palette

Three hues, each with one meaning, plus a de-emphasis grey.
The set was validated with the data-viz skill's `validate_palette.js` in both modes, all-pairs, on the card surface.

| Token | Light | Dark | Meaning |
| --- | --- | --- | --- |
| `--viz-1` | `#1a9a9e` | `#26a0a4` | the measured, usable thing (informative values, traceable records, analyzed articles) |
| `--viz-2` | `#6a5fc9` | `#8579dc` | emphasis; means "underexplored" everywhere on the site |
| `--viz-3` | `#c0891a` | `#a88a2a` | recorded but uninformative ("not reported", "unknown") |
| `--viz-mute` | `#b7bec9` | `#4a5262` | context: everything the chart is not about |

Amber sits at 2.97:1 on the light page background, so every chart that uses it also carries direct labels or a legend with values.

## Components

| Component | Form | Used for |
| --- | --- | --- |
| `BarAxis` | tick labels for a bar column, from a rounded ceiling | every bar chart below; pairs with `.bar-track.scaled` gridlines |
| `Bars` | horizontal bars, one hue | sex, race, vital status, reuse evidence tiers, assay coverage |
| `PairedDots` | two dots per row on one shared decade axis, joined by their gap | citations to a dataset's paper against articles that used its data |
| `SegmentBar` | one part-to-whole bar with a legend | where the corpus stands on reuse measurement |
| `CoverageChart` | one three-segment bar per clinical field | informative vs uninformative vs missing |
| `Composition` | one full-width stacked bar per field, label and readout above it | what a field holds, not only how full it is: the cohort's real values, and a measurement's share of it |
| `RepositoryBars` | stacked bars scaled to the largest | records per repository, traceable or not |
| `AgeBox` | box-and-whisker on a fixed 0 to 100 axis | age at diagnosis |
| `ObservedExpected` | two bars, emphasis on the first | the two numbers behind an underexplored label |
| `ReuseScatter` | log-log scatter, emphasis form, hover and table twin | observed vs expected reuse across the corpus |
| `FundingFlow` | layered card columns with drawn connectors | funding in, the dataset, what was published, funding out |

Rules carried by the CSS in `app/globals.css`: bars are 8 to 12px thick with a 4px rounded data-end, touching fills are separated by a 2px surface gap, dots carry a 2px surface ring, and text never wears a series colour.

Every bar chart carries a scale: hairline gridlines inside the track from `.bar-track.scaled`, and tick labels beneath the bar column from `BarAxis`, both taking the same rounded ceiling.
A bar without one shows which row is longer and nothing about by how much.

Charts shrink by their own width, not the window's.
`.bar-axis` and `.coverage-row` in `app/globals.css` are container queries, so a chart in a half-width column on a laptop and the same chart full-width on a phone each drop the parts they have no room for.
What goes first is fixed: the axis unit, then alternate ticks, then the bar's own width, and the field name last - a reader can work with a shorter bar and cannot work with "Vital s...".

`Composition` steps lightness, not hue, between categories of the same kind.
Two informative values in one bar - 116 dead against 96 alive - are both "the measured, usable thing", so a second hue would say they mean different things to the reader, and the palette has no spare hue that does not already mean something else on this site.
The step is the weaker cue, so it never carries the reading alone: every segment is named with its count in the readout beside the field, the full breakdown is in the row's tooltip when the tail is folded, and the 2px surface gaps between segments are what separate them at 10px tall.
The split that does carry meaning is still hue: teal for usable, amber for a recorded non-answer, and the gridded track showing through for a case with no value at all, exactly as in `CoverageChart`.

A measurement's coverage goes through the same component rather than through `Bars`.
"What share of these patients does whole-genome sequencing cover" and "what share of them have a usable vital status" are the same question against the same denominator, and drawing one as a bar scaled to the largest assay and the other as a part-to-whole made a reader translate between two scales to compare the two things a cohort card exists to compare.

`--viz-mute` is a de-emphasis grey, not a categorical hue, so the palette validator fails it on the lightness band and the chroma floor by design.
Where it is used as a series - the citation bar in `GroupedBars` - what matters still passes: CVD separation against `--viz-1` is dE 14.1 light and 20.5 dark against a target of 8, and normal vision 19.8 and 22.7 against a floor of 15.
Its contrast against the card is under 3:1, which obliges visible labels, so every bar in that chart prints its value.

Two measures never get two axes.
Both series in `PairedDots` are counts of articles and share one scale; a second axis rescaled to make the shorter series look comparable would assert a relationship that is not in the data.

Bars are linear, always.
`PairedDots` exists because the cited-against-used comparison needs a decade axis and bars cannot have one: length is read as proportional to value, and on a log scale a dataset with seven articles draws a bar a quarter as long as one with 2,831, four hundred times its reuse.
A dot encodes a position instead, which a log axis renders honestly - the same reason `ReuseScatter` can be log-log.
This corpus runs from 2,831 articles down to one, and the two series on the front page span 641 to 9,914; a linear axis scaled to the larger crowds every reuse mark into the left quarter of the track, while the decade axis gives all fourteen rows a readable mark.
`logScale` is therefore reached for by dots only, and never passed to `Bars`.
