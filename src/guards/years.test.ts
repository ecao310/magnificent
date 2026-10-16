import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  BENCHMARK_AT_40,
  BENCHMARK_YEAR_PARAMS,
  COVERAGE_YEARS,
  FPL_YEAR_PARAMS as ACA_FPL_YEAR_PARAMS,
  STATE_CODES,
} from '../aca/lib/aca';
import { TAX_YEAR_PARAMS as ACA_TAX_YEAR_PARAMS } from '../aca/lib/tax';
import {
  FPL_YEAR_PARAMS as TORPEDO_FPL_YEAR_PARAMS,
  IRMAA_YEAR_PARAMS,
  TAX_YEAR_PARAMS as TORPEDO_TAX_YEAR_PARAMS,
  TAX_YEARS,
} from '../torpedo/lib/tax';

/**
 * The years on file, held to the shape adding one is promised to have.
 *
 * Two promises about a year-keyed table, neither of which any single test of
 * the arithmetic makes. The first is that the table carries every year on
 * file: `Record<CoverageYear, …>` and `Record<TaxYear, …>` already make that a
 * compile error, and this states it where the compiler is not looking — a
 * table typed by a widening annotation, or a year list that drifts from the
 * type it was read off. The second is that `docs/adding-a-year.md` names every
 * table, so the checklist a person follows and the tables the code has cannot
 * come apart.
 *
 * The year lists themselves are read off a `const` tuple in `types.ts`, so the
 * list and the type are one declaration. This holds them ascending and unique
 * because `defaultTaxYear` and `defaultCoverageYear` read their ends as the
 * oldest and newest year on file.
 */

/** The years a table is keyed by, in the order its integer keys read them. */
const yearsOf = (table: object): number[] => Object.keys(table).map(Number);

/** A year keyed table, with the identifier the checklist is held to name. */
type YearTable = [string, object];

const BY_COVERAGE_YEAR: YearTable[] = [
  ['BENCHMARK_YEAR_PARAMS', BENCHMARK_YEAR_PARAMS],
  ['BENCHMARK_AT_40', BENCHMARK_AT_40],
  ['FPL_YEAR_PARAMS', ACA_FPL_YEAR_PARAMS],
  ['TAX_YEAR_PARAMS', ACA_TAX_YEAR_PARAMS],
];

const BY_TAX_YEAR: YearTable[] = [
  ['TAX_YEAR_PARAMS', TORPEDO_TAX_YEAR_PARAMS],
  ['IRMAA_YEAR_PARAMS', IRMAA_YEAR_PARAMS],
  ['FPL_YEAR_PARAMS', TORPEDO_FPL_YEAR_PARAMS],
];

describe('the years on file', () => {
  it('declares each list once, ascending and without a gap', () => {
    for (const [name, years] of [
      ['COVERAGE_YEARS', COVERAGE_YEARS],
      ['TAX_YEARS', TAX_YEARS],
    ] as const) {
      expect(new Set(years).size, name).toBe(years.length);
      expect([...years], name).toEqual([...years].sort((a, b) => a - b));
    }
  });

  it.each(BY_COVERAGE_YEAR)(
    '%s carries a row for every coverage year on file',
    (_name, table) => {
      expect(yearsOf(table)).toEqual([...COVERAGE_YEARS]);
    },
  );

  it.each(BY_TAX_YEAR)('%s carries a row for every tax year on file', (_name, table) => {
    expect(yearsOf(table)).toEqual([...TAX_YEARS]);
  });

  it('gives every state a benchmark in every coverage year', () => {
    expect(yearsOf(BENCHMARK_AT_40)).toEqual([...COVERAGE_YEARS]);
    for (const year of COVERAGE_YEARS) {
      expect(Object.keys(BENCHMARK_AT_40[year]).sort()).toEqual([...STATE_CODES].sort());
    }
  });
});

/**
 * The checklist, held to the tables it is a checklist for. A table added to
 * the site and not to `docs/adding-a-year.md` fails here; so does a checklist
 * that drops a table the code still has. The file paths are the paper trail
 * and the prose the compiler cannot reach — the published figures, the preview
 * cards and the front door.
 */
describe('the update checklist', () => {
  const checklist = readFileSync(resolve(process.cwd(), 'docs/adding-a-year.md'), 'utf8');

  const NAMED = [
    'COVERAGE_YEARS',
    'TAX_YEARS',
    ...BY_COVERAGE_YEAR.map(([name]) => name),
    ...BY_TAX_YEAR.map(([name]) => name),
    'PAGE_COVERAGE_YEAR',
    'PAGE_TAX_YEAR',
    'docs/irs-published-figures.md',
    'docs/aca-published-figures.md',
    'scripts/og-cover.mjs',
    'scripts/og-cover-aca.mjs',
    'README.md',
  ];

  it.each([...new Set(NAMED)])('names %s', (name) => {
    expect(checklist).toContain(name);
  });
});
