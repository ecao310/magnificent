# The price of the next dollar

Two pages, one question: what one more dollar of income actually costs, for
the reader's own household — which is often nothing like the bracket it lands
in.

**Live:** https://ecao310.github.io/magnificent/

| Page | What it prices | Where |
| --- | --- | --- |
| **How Much Can You Take Out This Year?** — the Tax Torpedo | One more dollar out of an IRA can drag Social Security into the tax base behind it: 12% becomes 22.2% and 22% becomes 40.7%, and then the curve falls back down again. The marginal rate on the next dollar of retirement income, across every income level, for one reader's own return. | https://ecao310.github.io/magnificent/ |
| **How Much Subsidy Does the Next Dollar Cost?** — the ACA Subsidy Slope | A Marketplace household pays a set share of its income for the benchmark plan and the subsidy pays the rest, so every extra dollar gives some of it back — about 17 cents mid-table for a couple, and the whole subsidy at once at 400% of the poverty line. What you pay at every income, and the premium and income tax drawn as one rate. | https://ecao310.github.io/magnificent/aca/ |

The two pages are two HTML entries of one Vite build, and share a shell:
the masthead, the two-column layout with a household in a column that stays
put and a chart beside it, the figures under the chart, the numbered notes
under those, the reading list in the footer, the address bar as the link,
and the stylesheet's ground. Each keeps its own subject: its rail, its
chart, its engine, its notes, its card. A strip under the top rule names
both pages and marks the one showing, and two notes link across — the
torpedo's note on the 400% line opens the Subsidy Slope on the return's own
household income, and the Slope's note on the effective rate opens the
torpedo on the household's filing status.

## Income Tax in Retirement

### The two steps

The return in a column that stays put, and the curve, the figures and the
notes in a column that scrolls past it. Both steps have the same shape: the
chart first, then the one control that moves the reader along it. Step 1 is
the exception that sets the rule — it has no curve of its own, so the return
itself stands where the chart stands beside it.

1. **Your Social Security benefit** — the return everything after it prices:
   who files it, who on it has reached 65, and how much Social Security it
   collects. A joint return puts both spouses' benefits on one line, so the
   slider's ceiling and the average marked under it are a couple's there and
   one worker's everywhere else.
2. **The tax torpedo** — the marginal rate on the next dollar of other income,
   plotted against **total income**: the benefit set in step 1, which the
   slider cannot move, plus the other income it can. The slider is still in
   other income, so the axis and the control are in different units, and the
   marker, the tooltip and the caption under the plot all name both halves in
   dollars. The senior-deduction phaseout is in the curve, because it is tax.
   The IRMAA cliffs and the 400% poverty-line cliff are not: they are a
   Medicare premium and a Marketplace credit, so both are priced for the
   reader's own income in the chart's tooltip, and neither is drawn until the
   **Breakpoints** button in the corner of the plot is asked for it. Every
   figure under it is a federal one.

   A dashed amber marker stands at your income — click or tap the chart,
   drag a finger along it, or drag the slider under it to move it — and the
   sentence under the slider is its reading. The hover reading over the
   curve is drawn only for a pointer that can hover; a finger moves the
   marker instead.

Six figures follow the chart: total income, federal tax, effective rate, the
rate on the next dollar, the taxable share of the benefit, and the Medicare
surcharge that MAGI buys. Below them, the notes: four or five collapsed
explainers, numbered — the torpedo, how to mitigate it, the IRMAA cliffs, the
400% line when the return has one, and the senior deduction's phaseout.

### What is priced

`src/torpedo/lib/tax/` runs the whole 1040 chain for tax years 2025 and
2026: provisional income and the 50%/85% inclusion worksheet, the base
standard deduction plus the 65+ additional amount plus the OBBBA senior
deduction and its 6% phaseout, ordinary brackets, tax-exempt interest that
moves provisional income without moving the tax base, the IRMAA tiers on
their two-year MAGI lag, and the premium tax credit's 400% cliff under IRC
36B.

Two filing statuses, single and joint. The tax code has four, and this priced
all four for a long time; neither of the other two was ever offered on the
page, and each cost a branch in the engine and a paragraph of prose per
explainer. A link that still names one is answered on arrival rather than
read past, because a filing status moves every figure there is.

The 400% cliff is a credit the government stops paying rather than a tax it
charges, and it has a MAGI of its own: 36B(d)(2)(B) counts AGI plus
tax-exempt interest plus *the untaxed part of the benefit*, which undoes the
torpedo and puts the whole benefit in household income at every income
level. So it rises a flat dollar per dollar of other income where Medicare's
rises by up to $1.85, and the two cliffs on the chart travel at different
speeds. It also has a year in it: ARPA section 9661, extended through 2025
by the Inflation Reduction Act, replaced the applicable-percentage table
with one that ran past 400% and capped a household's own share at 8.5% of
income, so there is no cliff to draw on a 2025 return and there is one on a
2026 return. What crossing it costs is the benchmark premium for the
household's age and county, which this page has no way to know — so the line
is drawn where it falls, and the note under it hands the household to the
Subsidy Slope, which does.

The Social Security thresholds — $25,000/$34,000 and $32,000/$44,000 — are
not indexed and stay frozen across both years while everything around them
moves. The page states that in prose and prices one year: `PAGE_TAX_YEAR` in
`src/torpedo/lib/tax/params.ts`. Everything below that constant stays
parameterized by year — the engine prices any year on file, the tests
exercise all of them — so moving the page to a new year is one line.

### Sharing a return

The whole return lives in the query string, so a link survives a refresh and
can be sent to a spouse or an advisor: `filing`, `ss`, `income`, `muni`,
`senior`, `spouse`. A key appears only when it differs from what the page
opens with, so an untouched page has no query string at all. A link asking
for something the page cannot show — an income past the slider's bound, a
benefit past the year's maximum — is clamped to what it can, and the page
says on load what it changed. `year`, `ltcg`, `ceiling` and `qcd` in an
older link are read past in silence: each named a step that is no longer on
the page. The step is a fragment (`#step-torpedo`), not a query parameter:
it is where the reader is standing, not what the return holds.

## The ACA Subsidy Slope

### The two steps

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
     All in, Federal income tax, Each extra $1 of income costs, and The
     plan's share of income. Three notes: How the rate is figured, Why the
     premium counts as a tax, and What is left out, on both sides.

   Either way a "You" marker sits at your income — click or tap the chart,
   drag a finger along it, drag the slider under it, or type a number to
   move it — and the button under the figures sends the household as a
   link.

### The rate

The premium under the 400% line is a set share of income that the statute
fixes and the return settles, and every extra dollar gives some of the
subsidy back — a tax in everything but the name. The second chart puts it
on the same side of the ledger as federal income tax. `src/aca/lib/tax/`
prices the return with nothing unusual on it: the standard deduction, the
rate schedule and the child tax credit, for 2025 and 2026, by filing status.
The status is read off the household — two adults file jointly, one adult
with children is a head of household, one adult alone is single — and the
income is the subsidy's own, taken as all ordinary. Payroll tax, state tax,
refundable credits and every deduction but the standard one are left out,
and the last note says so.

### What is priced

`src/aca/lib/aca/` prices coverage years 2025 and 2026: the poverty
guidelines on their one-year lag, for the contiguous states and for Alaska
and Hawaii; the applicable-percentage table; the subsidy's floor at 138% or
100% of the line; the 400% ceiling; and the benchmark premium from KFF's
average for the state, or the national one, scaled along CMS's age curve.
Choosing a state sets its average, its Medicaid status and, in Alaska and
Hawaii, its poverty line. New York and Vermont, which do not price by age,
are priced flat; Alabama, DC, Massachusetts, Minnesota, Mississippi, Oregon
and Utah, which rate on age curves of their own, are priced on them.

The 2025 table (ARPA section 9661, extended through 2025 by the Inflation
Reduction Act) owed nothing under 150% of the line, capped at 8.5%, with no
ceiling. The 2026 table, indexed by Rev. Proc. 2025-25, runs 2.10% under
133% to 9.96% from 300%–400% — and the 400% line is back: it expired at the
end of 2025. The page prices one year, `PAGE_COVERAGE_YEAR` in
`src/aca/lib/aca/years.ts`.

One deliberate departure from Form 8962. The form rounds household income
down to a whole percent of the poverty line, and the percentage to four
places, which puts steps of a few dollars in the subsidy. The page draws
the smooth line 26 CFR 1.36B-3(g) interpolates instead. And one change of
law worth knowing: through 2025 a household under 400% of the line repaid
an underestimated advance subsidy only up to a cap; the One Big Beautiful
Bill Act repealed the cap for years after 2025.

### Sharing a household

The whole household lives in the query string: `adults`, `age`, `spouse`,
`income`, `deps`, `state`, `premium` — each written only when it differs
from what the page opens with. A link asking for something the page cannot
show — an age of 70, an income past the slider's edge, a state it does not
know — is clamped to what it can, and the page says on load what it changed.
The chart is a fragment, not a query parameter: choosing the rate chart
writes `#step-rate` into the address, in place, and a link that arrives at
it opens on that chart.

## The two pages together

On a wide screen each page's household is a column beside its chart. On one
column — a phone, or a window under 1100px — it folds to a row under the
title that names the household in a phrase with a *Change* button; tapping
it opens the same controls in place, directly above the chart they move. The
plot itself takes a narrower frame under 640px, its margins closed up around
the curve, and the slider's track stays inset to it so the thumb still
stands under the marker. Under each page's footer rule, one more note,
closed like the rest: the page's own reading list, and then the disclaimer.

The strip in the masthead and the two notes that link across are built on
the base the build was made for — `/` on Netlify, `/magnificent/` on GitHub
Pages — never on a bare `/`. `src/guards/pages.test.tsx` renders both pages
and holds every rooted link to that, and decodes each cross-link with the
other page's own decoder, so a key one page writes for the other cannot
drift.

### The cards

What a link looks like before it is opened is each page's HTML: an Open
Graph and Twitter card block, pointing at `public/og-cover.png` for the
torpedo and `public/aca/og-cover.png` for the Subsidy Slope. A card is not
the reader's own scenario and cannot be — this is static files, so no server
ever sees the query string. It says what the page is; the figures stay on
the page.

The curve on each card is the real one. `scripts/og-cover.mjs` bundles
`marginalRateCurve` out of `src/torpedo/lib`, and `scripts/og-cover-aca.mjs`
bundles `costCurve` out of `src/aca/lib`; each samples it for the scenario
its page opens on, draws its plot inside the frame `scripts/card.mjs` holds
— the kicker and the rule, the headline, the hook at the right, the site's
faces and tokens — and rasterises the result:

```bash
node scripts/og-cover.mjs       # rewrites public/og-cover.png and public/apple-touch-icon.png
node scripts/og-cover-aca.mjs   # rewrites public/aca/og-cover.png and public/aca/apple-touch-icon.png
```

Both run by hand rather than in CI, because rasterising needs a browser and
neither deploy workflow installs one — so the PNGs are committed. Each needs
a network too: the card is set in the site's own faces, Newsreader and IBM
Plex Mono, and fetches them from Google Fonts while it draws. `the cover` in
`src/guards/meta.test.ts` is what notices when one goes stale: it reads the
image's size back out of the file, checks the mark and the card are still
painted in `:root`'s own colours, and — for the torpedo — fails if the rate
the description quotes is no longer the rate the arithmetic reaches.

## Development

```bash
npm install
npm run dev      # start dev server: /magnificent/ and /magnificent/aca/
npm run test     # vitest: both pages' suites and the guards
npm run lint     # eslint
npm run build    # tsc -b && vite build
```

## Layout

| Path | What it is |
| --- | --- |
| `index.html`, `aca/index.html` | The two entries, one per page, each with its own card. |
| `src/shared/` | What the pages share. `components/`: the page shell (`Page`), the masthead and the strip between the pages, the rail and its fold, the figures and one figure, the notes section and one note, the hover reading's card, the plot's box and the marks every plot draws, the reading list, the copy button. `hooks/`: the address bar, the plot as a cursor and what a plot asks the window, the live reading's settle. `lib/`: the frame every plot is drawn in and how its axis is drawn, the fold's width, whole dollars and whole cents, the pages' addresses, how a page mounts. `styles/`: `site.css` and the palette every chart paints with. |
| `src/torpedo/` | The Tax Torpedo: `App.tsx`, its rail, chart, figures, notes and explainers under `components/`, its engine under `lib/tax/`, the return in the address bar in `lib/scenarioUrl.ts`, its hues and gutter in `styles/`, and its page suites beside `App.tsx`. |
| `src/aca/` | The ACA Subsidy Slope: the same shape — `App.tsx`, the household in `hooks/useHousehold.ts`, the cost and rate charts under `components/`, the subsidy under `lib/aca/`, the return under `lib/tax/`, the two charts and the fragment that chooses one in `lib/charts.ts`, its gutter in `styles/`, and its page suites. |
| `src/guards/` | The suites that hold down what no other test reads, each run once per page: the build's chunking and entries, the link previews and this README, the rendered prose, the stylesheets, the pages and the links between them, the reading lists. `pages.ts` is the table they iterate. |
| `src/test/` | Test setup, and the fixtures both pages' suites build on: the stopped clock, a strip's radio, a slider. Each page keeps its own under `src/<page>/test/`. |
| `docs/` | The published figures each engine is checked against, and their sources. |
| `public/`, `public/aca/` | Each page's favicon, touch icon and link-preview card. |
| `scripts/` | Redraws each card from its page's own arithmetic, on the frame, faces and tokens in `card.mjs`. Run by hand; see above. |

Tests sit beside what they test: `src/torpedo/lib/tax/irmaa.test.ts` next to
`irmaa.ts`, and each page's `App.*.test.tsx` suites next to its `App.tsx`,
each rendering the whole page and asking about one subject.

## Deployment

The repo has one GitHub Pages site and one workflow that publishes it,
`.github/workflows/deploy.yml`, which runs on a push to either branch. Every
push to `main` tests, builds and publishes both pages, at
https://ecao310.github.io/magnificent/ and
https://ecao310.github.io/magnificent/aca/ .

Every push to `dev` publishes a preview nested under it, at
https://ecao310.github.io/magnificent/preview/ and
https://ecao310.github.io/magnificent/preview/aca/ .

Whichever branch pushed, the run checks out both, builds `main` at the root
and `dev` under `/preview/`, and publishes the combined tree. It has to: a
Pages deploy replaces the whole site, and when each branch had a workflow of
its own, every push to `main` took the preview down until `dev` was next
pushed. The production URL therefore always serves `main`, and `dev` never
needs to be merged to be seen. A broken `dev` does not hold `main` back —
pushed from `main`, a preview that fails its tests or build is logged and
production ships without it; pushed from `dev`, it fails the run and nothing
is published.

`main` is also built by Netlify, from `netlify.toml`, and served at the root
of its own domain: https://magnificent-fi.netlify.app , with the Subsidy
Slope at `/aca/` under it. That build is the Pages one with one difference.
A Pages site lives under `/magnificent/`, and `vite.config.ts`'s `base` says
so; a Netlify site is the whole domain, so the build there is passed
`--base=/` on the command line, and each page's link-preview card is
addressed to Netlify's own `URL` rather than the GitHub Pages origin that
`.env` gives `VITE_SITE_ORIGIN`. Tests run first there too, so a `main` that
fails them publishes nowhere. `the Netlify build` in
`src/guards/meta.test.ts` reads `netlify.toml` and holds it to that. What the
file cannot say — which branches Netlify builds, and whether the site is
public — lives in its dashboard.

`the front door` in `src/guards/meta.test.ts` holds this section to that
file: it reads each "push to `branch`" sentence above and the URLs it gives,
the branches the workflow fires on and the branch→base pairs its `env`
declares, and fails if any of them stop agreeing — if a page goes unnamed
under a branch, or if **Live:** at the top names a URL no branch here
publishes. What it cannot see is which branch is ahead of which: moving the
front door is a README edit, and noticing that nobody made it is still a
human job.

---

Not tax, insurance or financial advice. Every figure here is a model of
published IRS, HHS and CMS numbers, and a real return or a real household has
facts a page like this never asks for.
