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
| `Bars` | horizontal bars, one hue | sex, race, vital status, reuse evidence tiers, assay coverage |
| `SegmentBar` | one part-to-whole bar with a legend | where the corpus stands on reuse measurement |
| `CoverageChart` | one three-segment bar per clinical field | informative vs uninformative vs missing |
| `RepositoryBars` | stacked bars scaled to the largest | records per repository, traceable or not |
| `AgeBox` | box-and-whisker on a fixed 0 to 100 axis | age at diagnosis |
| `ObservedExpected` | two bars, emphasis on the first | the two numbers behind an underexplored label |
| `ReuseScatter` | log-log scatter, emphasis form, hover and table twin | observed vs expected reuse across the corpus |

Rules carried by the CSS in `app/globals.css`: bars are 8 to 12px thick with a 4px rounded data-end, touching fills are separated by a 2px surface gap, dots carry a 2px surface ring, and text never wears a series colour.
