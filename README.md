# How Much Subsidy Does the Next Dollar Cost?

A household that buys its coverage on the Marketplace pays a set share of its
income for the benchmark plan, and the subsidy pays the rest. The share rises
with income, and it rises faster than the table looks: a couple in the middle
of the table gives back about 17 cents of every extra dollar of income, the
rate climbs in a sawtooth to 19, drops to 10, and then the dollar that
crosses 400% of the poverty line costs the whole subsidy at once.

This is one page that draws what the plan costs at every household income for
one household, shows the subsidy at any point on hover, and prices the next
dollar — and the next $10,000 — from wherever the household is standing.

**Live:** https://ecao310.github.io/super-duper-broccoli/

It follows [How Much Can You Take Out This Year?](https://ecao310.github.io/congenial-octo-spork/),
built the same way, which drew the 400% line and left the loss blank, because
the loss is the benchmark premium and that page never asked for one. This one
asks, and prices the whole slope under the line as well as the dollar over
it. It began as an answer to a thread on r/financialindependence: a couple
taking household income from $50,000 to $60,000 loses about $1,716 of
subsidy, and the poster asked whether they were missing something. The page
opens on that household. They were not.

## The two steps

Both steps have the same shape as the page before: the chart first, then the
one control that moves the reader along it, then collapsed notes. Step 1 has
no curve of its own, so the household itself stands where the chart stands
below it.

1. **Your household** — who is on the plan, how old they are, and what the
   benchmark silver plan costs where they live. The ages are here because they
   are what sets the premium: the page scales KFF's national-average benchmark
   for a 40-year-old to the household's ages on the federal default age curve,
   and the reader can set their own county's figure under **Advanced inputs**,
   along with dependents and whether the state expanded Medicaid.
2. **What the plan costs** — what the household pays each month for the
   benchmark plan after the subsidy, plotted against household income. One
   curve, hatched underneath, because the area is money the household pays.
   Hovering any point gives the subsidy there, in dollars a year and a month,
   what the household pays, and the share of income that is. The control is a
   slider for the household's own income; the sentence under it prices that
   point and the next dollar. The subsidy's edges — the floor and the 400%
   line — are drawn from the start; the cost-sharing tiers at 150%, 200% and
   250% when the **Breakpoints** button in the corner of the plot is asked for
   them. Under the floor in an expansion state the curve is a gap rather than
   a zero, because the household is on Medicaid and not buying a Marketplace
   plan at all.

The page closes on the six figures the whole walk was for: household income as
a share of the poverty line, the subsidy and the benchmark it is a share of,
what the household pays, the share of income that is, what the next dollar
costs in subsidy, and the room left under the cliff. Under the footer's rule,
the reading list: the thread, Kitces on the same problem, The Finance Buff's
table, the KFF calculator, HealthCare.gov on what counts as income, and CMS's
age curve.

## What is priced

`src/lib/aca/` prices coverage years 2025 and 2026: the poverty guidelines on
their one-year lag, the applicable-percentage table for each year, the floor
under the subsidy at 138% or 100% of the line, the 400% ceiling where the
year has one, the cost-sharing tiers, and the benchmark premium from KFF's
national average scaled along CMS's federal default age curve. Nothing else:
what the same dollar of income owes anywhere but the Marketplace is not on
this page.

The two years are the two sides of the change the page is about. The 2025
table is ARPA section 9661's, extended through 2025 by the Inflation Reduction
Act: nothing owed under 150% of the line, 8.5% at the top, and no top. The 2026
table is the statute's own, indexed by Rev. Proc. 2025-25 — 2.10% under 133%,
9.96% from 300% to 400% — and the line is back. The House passed a three-year
extension on 8 January 2026; the Senate did not take it up. The engine prices
both and the tests exercise both; the page prices one, `PAGE_COVERAGE_YEAR`
in `src/lib/aca/years.ts`. Rev. Proc. 2026-26 has published the 2027 table
(2.15% to 10.22%) and the 2026 guidelines that price 2027 coverage are out
($15,960 and $5,680 a person); KFF's 2027 benchmark is not, so 2027 is one
entry away rather than on file.

One deliberate departure from Form 8962. The form rounds household income down
to a whole percent of the poverty line before the table lookup and the
percentage to four places after it, which puts steps of a few dollars in the
subsidy. The page is about the slope, so it draws the smooth line 26 CFR
1.36B-3(g) interpolates and leaves the rounding to the form;
`applicablePercentage` says so.

One change of law worth knowing about. Through 2025 a household under 400% of
the line repaid an advance subsidy paid on an underestimate only up to a cap;
the One Big Beautiful Bill Act repealed the cap for years after 2025. The page
has a note on it.

## Sharing a household

The whole household lives in the query string, so a link survives a refresh
and can be sent to a spouse or a navigator: `adults`, `age`, `spouse`,
`income`, `deps`, `premium`, `expansion`. Nothing is written unconditionally —
a key appears only when it differs from what the page opens with, so an
untouched page has no query string at all, and `premium` appears only when
the reader has set a benchmark of their own. A link asking for something the
page cannot show — an age of 70, an income past the slider's edge — is clamped
to what it can, and the page says on load what it changed. The step is a
fragment (`#step-cost`), not a query parameter: it is where the reader is
standing, not what the household is.

What the link looks like before it is opened is `index.html`: an Open Graph
and Twitter card block, pointing at `public/og-cover.png`. The card is not the
reader's own household and cannot be — this is static files on GitHub Pages,
so no server ever sees the query string. It says what the page is; the figures
stay on the page.

The curve on that card is the real one. `scripts/og-cover.mjs` bundles
`costCurve` out of `src/lib`, samples it for the household the page opens on,
and rasterises the result:

```bash
node scripts/og-cover.mjs   # rewrites public/og-cover.png and public/apple-touch-icon.png
```

It is run by hand rather than in CI, because rasterising needs a browser and
the deploy workflow does not install one — so the PNG is committed. It needs
a network too: the card is set in the page's own faces, Newsreader and IBM
Plex Mono, and fetches them from Google Fonts while it draws.

## Development

```bash
npm install
npm run dev      # start dev server
npm run test     # vitest
npm run lint     # eslint
npm run build    # tsc -b && vite build
```

## Layout

| Path | What it is |
| --- | --- |
| `src/App.tsx` | The composition root: the household in state, the figures derived from it, and the three sections it hands them to. |
| `src/components/` | What the page is made of — the two steps, the chart and its tooltip, the Breakpoints panel, the six notes, the close, the reading list. |
| `src/hooks/` | The three pieces of behaviour that are not markup: the live region's debounce, the address bar, and dismissing a panel. |
| `src/lib/aca/` | Every figure on the page, and the only place a percentage, a threshold or a premium is written down. One module per chapter, behind `index.ts`. |
| `src/lib/scenarioUrl.ts` | The household, encoded into the address bar and clamped back out of it. |
| `src/lib/format.ts`, `src/lib/householdProse.ts`, `src/lib/furtherReading.ts` | How a figure is rendered, how a household is described in words, and the reading list's one copy. |
| `src/styles/` | `index.css` and the subset of its palette the chart hands to SVG attributes. |
| `src/guards/` | The suites that hold down what no other test reads: the link preview and this README, the stylesheet, the rendered prose, the build's dependencies. |
| `src/test/` | Test setup and the fixtures more than one suite shares. |
| `docs/` | The published figures the engine is checked against, with their sources. |
| `public/` | The favicon, the touch icon and the link-preview card. |
| `scripts/og-cover.mjs` | Redraws the card from the page's own arithmetic. Run by hand; see above. |

Tests sit beside what they test: `src/lib/aca/ptc.test.ts` next to `ptc.ts`,
and the three `src/App.*.test.tsx` suites next to `App.tsx`, each rendering the
whole page and asking about one subject — the page, the chart, the close.

## Deployment

The repo has one GitHub Pages site and one workflow that publishes it,
`.github/workflows/deploy.yml`, which runs on a push to either branch. Every
push to `main` tests, builds and publishes it at
https://ecao310.github.io/super-duper-broccoli/

Every push to `dev` publishes a preview nested under it, at
https://ecao310.github.io/super-duper-broccoli/preview/ .

Whichever branch pushed, the run checks out both, builds `main` at the root
and `dev` under `/preview/`, and publishes the combined tree, because a Pages
deploy replaces the whole site. A missing or broken `dev` does not hold `main`
back; pushed from `dev`, a preview that fails its tests or build fails the run
and nothing is published.

`the front door` in `src/guards/meta.test.tsx` holds this section to that
file: it reads each "push to `branch`" sentence above and the URL it gives,
the branches the workflow fires on and the branch→base pairs its `env`
declares, and fails if any of them stop agreeing — or if **Live:** at the top
names a URL no branch here publishes.

---

Not insurance, tax or financial advice. Every figure here is a model of
published IRS, HHS and CMS numbers and a national-average premium, and a real
household has facts a page like this never asks for.
