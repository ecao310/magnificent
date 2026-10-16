# Adding a year

The site prices two years — 2025 and 2026 — and both engines are parameterized
so that a new one is a table entry rather than a code change. This is the
checklist for landing one. Each step is here because the compiler, a guard, or
a publisher will not catch it on its own.

The two engines have a year list each. **Add the year to the list and let the
compiler report the rest**: every `Record<Year, …>` table below fails to build
until it carries a row for the new year.

## 1. Declare the year

- `src/aca/lib/aca/types.ts` — add it to `COVERAGE_YEARS`. The `CoverageYear`
  type is read off that list, and `TaxYear` in `src/aca/lib/tax/types.ts` is an
  alias of it, so this one line covers the whole ACA page.
- `src/torpedo/lib/tax/types.ts` — add it to `TAX_YEARS`. The `TaxYear` type is
  read off that list.

## 2. Fill every table the compiler now reports

ACA page:

- `FPL_YEAR_PARAMS` — `src/aca/lib/aca/ptc.ts`: the poverty guideline (first
  person, each additional, Alaska and Hawaii) and the applicable-percentage
  table, plus the `cliff` flag.
- `BENCHMARK_YEAR_PARAMS` — `src/aca/lib/aca/premium.ts`: the national
  benchmark premium.
- `BENCHMARK_AT_40` — `src/aca/lib/aca/states.ts`: the fifty-one state
  benchmarks, one block per year.
- `TAX_YEAR_PARAMS` — `src/aca/lib/tax/params.ts`: the standard deduction, the
  rate schedule and the child tax credit.

Torpedo page:

- `TAX_YEAR_PARAMS` — `src/torpedo/lib/tax/params.ts`: the standard deduction,
  its age-65 addition, the rate schedule, the capital-gain bands, the Social
  Security benefit figures and the COLA.
- `IRMAA_YEAR_PARAMS` — `src/torpedo/lib/tax/irmaa.ts`: Medicare's standard
  Part B premium and its six tiers.
- `FPL_YEAR_PARAMS` — `src/torpedo/lib/tax/ptc.ts`: the poverty guideline, the
  `cliff` flag and the top applicable percentage.

## 3. Move the year the page prices, if that is the intent

Each page names one year to render, on purpose a hand-edited constant rather
than the latest on file — see the comment on each. Move it only when the new
year's figures are checked and the copy below is rewritten.

- `PAGE_COVERAGE_YEAR` — `src/aca/lib/aca/years.ts`.
- `PAGE_TAX_YEAR` — `src/torpedo/lib/tax/params.ts`.

## 4. Update the paper trail and the guards

- `docs/irs-published-figures.md` and `docs/aca-published-figures.md` — the
  published figures each table is transcribed from.
- The figure guards: `src/torpedo/lib/tax/params.test.ts`, `irmaa.test.ts` and
  `ptc.test.ts`; `src/aca/lib/aca/states.test.ts`, `ptc.test.ts` and
  `premium.test.ts`; `src/aca/lib/tax/incomeTax.test.ts`.

## 5. Rewrite the prose and the cards

The year is named in copy a test cannot derive from the tables:

- `src/aca/components/explainers/CliffExplainer.tsx`,
  `src/aca/components/explainers/CreditExplainer.tsx`,
  `src/aca/lib/furtherReading.ts`.
- `src/torpedo/App.tsx`, `src/torpedo/components/Notes.tsx`,
  `src/torpedo/components/explainers/SubsidyCliffExplainer.tsx`,
  `src/torpedo/lib/furtherReading.ts`.
- `index.html` and `aca/index.html` — the meta descriptions — then redraw the
  preview cards with `node scripts/og-cover.mjs` and
  `node scripts/og-cover-aca.mjs`.
- `README.md`, if it quotes a year.

## Keeping this list honest

`src/guards/years.test.ts` holds every `Record<Year, …>` table above to every
year on file, and holds this file to naming each one. If a table is added and
this page is not updated, that guard fails.
