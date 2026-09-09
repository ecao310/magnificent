# How Much Subsidy Does the Next Dollar Cost?

A household that buys its coverage on the Marketplace pays a set share of its
income for the benchmark plan, and the subsidy pays the rest. The share rises
with income: a couple in the middle of the table gives back about 17 cents of
every extra dollar of income, the rate climbs in a sawtooth to 19, drops to
10, and then the dollar that crosses 400% of the poverty line costs the whole
subsidy at once.

One page, two charts of the same household, one showing at a time: what
you pay at every household income, the subsidy at any point on hover, and
the price of the next dollar and the next $10,000; or federal income tax
and the premium added up and drawn as one rate.

**Live:** https://ecao310.github.io/super-duper-broccoli/

Companion to [How Much Can You Take Out This Year?](https://ecao310.github.io/congenial-octo-spork/),
which drew the 400% line without pricing it.

## The two steps

1. **Your household** — adults and children on the plan, their ages, your
   state (a list, opening on the national average), and the benchmark plan's
   monthly premium (a number input, prefilled with the state's or the
   national average for those ages, editable). Whether the state expanded
   Medicaid, and so where the subsidy starts, follows from the state.
2. **The chart** — one of two, chosen by the pair of boxes directly above
   it, swapped in place:
   - **What you pay** — the benchmark plan's monthly cost after the subsidy,
     plotted against household income. A green band marks the subsidy
     between the cost curve and a dashed full-premium line; ink-dashed lines
     mark where it starts, at 138% or 100% of the poverty line, and ends, at
     400%. Four figures follow: You pay, Subsidy, Each extra $1 of income
     costs, and Room before the cliff. Five notes: How the subsidy is
     figured, The slope, The 400% cliff, The Medicaid line, and What is left
     out.
   - **Your effective rate** — the same premium, counted as the tax it works
     like, stacked on federal income tax: both as shares of household
     income, against the same axis. A grey wash for the tax, the cost
     chart's blue hatch for the premium, and an ink line along the top for
     the whole; the jump in that line at 400% is the chart. Four figures:
     All in, Federal income tax, Each extra $1 of income costs (tax and
     subsidy together), and The plan's share of income. Three notes: How the
     rate is figured, Why the premium counts as a tax, and What is left out,
     on both sides.

   Either way a "You" marker sits at your income — click the chart, drag
   the slider under it, or type a number to move it — and the button under
   the figures sends the household as a link.

## The rate

The premium under the 400% line is a set share of income that the statute
fixes and the return settles, and every extra dollar gives some of the
subsidy back — a tax in everything but the name. The second chart puts it
on the same side of the ledger as federal income tax.

`src/lib/tax/` prices the return with nothing unusual on it: the standard
deduction, the rate schedule and the child tax credit, for 2025 and 2026,
by filing status. The status is read off the household — two adults file
jointly, one adult with children is a head of household, one adult alone is
single — and the income is the subsidy's own, taken as all ordinary. The
child tax credit is taken only against tax owed, so the rate is never
negative, and its phase-out is drawn as the 5% line the statute's $50 steps
approximate. Payroll tax, state tax, refundable credits and every deduction
but the standard one are left out, and the last note says so. Under the
subsidy's floor the chart draws no premium at all — Medicaid has none, and
the full premium against an income under the poverty line is not a rate
anyone pays — so the line stops there and the tax runs on alone.

## What is priced

`src/lib/aca/` prices coverage years 2025 and 2026: the poverty guidelines on
their one-year lag, for the contiguous states and for Alaska and Hawaii; the
applicable-percentage table; the subsidy's floor at 138% or 100% of the
line; the 400% ceiling; and the benchmark premium
from KFF's average for the state, or the national one, scaled along CMS's
age curve. Choosing a state sets its average, its Medicaid status and, in
Alaska and Hawaii, its poverty line. New York and Vermont, which do not price
by age, are priced flat; Alabama, DC, Massachusetts, Minnesota, Mississippi,
Oregon and Utah, which rate on age curves of their own, are priced on them.

The 2025 table (ARPA section 9661, extended through 2025 by the Inflation
Reduction Act) owed nothing under 150% of the line, capped at 8.5%, with no
ceiling. The 2026 table, indexed by Rev. Proc. 2025-25, runs 2.10% under
133% to 9.96% from 300%–400% — and the 400% line is back: it expired at the
end of 2025, and a three-year extension passed the House in January 2026 but
the Senate did not act. The page prices one year, `PAGE_COVERAGE_YEAR` in
`src/lib/aca/years.ts`.

One deliberate departure from Form 8962. The form rounds household income
down to a whole percent of the poverty line, and the percentage to four
places, which puts steps of a few dollars in the subsidy. The page draws
the smooth line 26 CFR 1.36B-3(g) interpolates instead.

One change of law worth knowing: through 2025 a household under 400% of the
line repaid an underestimated advance subsidy only up to a cap; the One Big
Beautiful Bill Act repealed the cap for years after 2025. The first note
covers it.

## Sharing a household

The whole household lives in the query string, so a link survives a refresh
and can be sent to a spouse or a navigator: `adults`, `age`, `spouse`,
`income`, `deps`, `state`, `premium` — each written only when it differs
from what the page opens with. A link asking for something the page cannot
show — an age of
70, an income past the slider's edge, a state it does not know — is clamped
to what it can, and the page says on load what it changed. The chart is a
fragment, not a query parameter: choosing the rate chart writes `#step-rate`
into the address, in place, and a link that arrives at it opens on that
chart. It is where the reader is standing, not what the household is.

`index.html` also carries an Open Graph and Twitter card pointing at
`public/og-cover.png` — static, so it shows the opening household, not the
reader's own. The curve is real: `scripts/og-cover.mjs` bundles `costCurve`
out of `src/lib`, samples it for that household, and rasterises the result.

```bash
node scripts/og-cover.mjs   # rewrites public/og-cover.png and public/apple-touch-icon.png
```

Run by hand, not in CI — rasterising needs a browser and a network, to fetch
Newsreader and IBM Plex Mono while it draws.

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
| `src/App.tsx` | The composition root: the household from `useHousehold`, the chart chosen, and the sections it hands the derived figures to. |
| `src/components/` | The rail, the chart chooser, the cost chart, its tooltip, figures and notes, and what both charts share: the header, the income slider, the copy button, the chart frame. |
| `src/components/rate/` | The rate chart, its tooltip, step, figures and notes. |
| `src/hooks/` | The household in state, the address bar's debounce and the live region's. |
| `src/lib/aca/` | Every subsidy figure — the only place a percentage, threshold or premium is written down. One module per chapter, behind `index.ts`. |
| `src/lib/tax/` | The return: the schedule, the deduction and the child tax credit by year and status, and the tax and the premium added up. |
| `src/lib/scenarioUrl.ts`, `charts.ts` | The household, encoded into the address bar and clamped back out, and the two charts and the fragment that says which is showing. |
| `src/lib/format.ts`, `householdProse.ts`, `furtherReading.ts`, `readout.ts`, `rateReadout.ts` | Rendering a figure, describing a household, the reading list, the two readouts. |
| `src/styles/` | `index.css` and the palette subset the chart hands to SVG. |
| `src/guards/` | Tests holding down what nothing else reads: the link preview, this README, the stylesheet. |
| `src/test/` | Test setup and shared fixtures. |
| `docs/` | The published figures the engine is checked against, and their sources. |
| `public/` | The favicon, the touch icon and the link-preview card. |
| `scripts/og-cover.mjs` | Redraws the card from the page's own arithmetic; run by hand. |

## Deployment

The repo has one GitHub Pages site and one workflow that publishes it,
`.github/workflows/deploy.yml`, which runs on a push to either branch. Every
push to `main` tests, builds and publishes it at
https://ecao310.github.io/super-duper-broccoli/

Every push to `dev` publishes a preview nested under it, at
https://ecao310.github.io/super-duper-broccoli/preview/ .

Whichever branch pushed, the run builds `main` at the root and `dev` under
`/preview/`, then publishes the combined tree — a Pages deploy replaces the
whole site. A broken `dev` doesn't hold `main` back; a failing `dev` push
fails only itself.

`the front door` in `src/guards/meta.test.tsx` checks each "push to
`branch`" sentence above against the branches and URLs the workflow
declares, and fails if they disagree, or if **Live:** names a URL no branch
publishes.

---

Not insurance, tax or financial advice. Figures are modelled from published
HHS, IRS and CMS numbers and a national- or state-average premium unless you
enter your own.
