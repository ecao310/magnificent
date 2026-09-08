/**
 * The premium tax credit under IRC 36B, priced whole: the poverty line, the
 * applicable-percentage table, the floor under the credit, the 400% ceiling
 * over it, and — the subject of this page — the slope between them, which is
 * what the household pays for its plan at every income.
 */
import type { CoverageYear } from './types';
import { defaultCoverageYear } from './years';
import { householdSizeFor, resolveScenario } from './scenario';
import type { Scenario } from './scenario';
import { benchmarkAnnualFor, benchmarkMonthlyFor } from './premium';
import { toCents } from './money';

/**
 * The ceiling: household income over this multiple of the poverty line has
 * no row in the table to look a credit up in, so the credit is zero — not
 * tapered, gone, on the strength of the dollar that crossed the line.
 * 36B(c)(1)(A) reads "not more than 400 percent", so the line itself is
 * still inside and the dollar after it is the one that costs.
 */
export const PTC_CLIFF_PERCENT = 4;

/**
 * The floor in a state that expanded Medicaid: 133% of the poverty line plus
 * the 5% income disregard of 42 USC 1396a(e)(14)(I). Below it the household
 * is eligible for Medicaid, and 36B(c)(2)(B) makes anyone eligible for
 * Medicaid ineligible for the credit.
 */
export const EXPANSION_FLOOR_MULTIPLE = 1.38;

/**
 * The floor everywhere else: 36B(c)(1)(A)'s "at least 100 percent". In the
 * ten states that have not expanded, a household under the line gets neither
 * the credit nor Medicaid — the coverage gap.
 */
export const STATUTORY_FLOOR_MULTIPLE = 1;

/** Where the credit begins for this household, as a multiple of the line. */
export function creditFloorMultiple(expansionState: boolean): number {
  return expansionState ? EXPANSION_FLOOR_MULTIPLE : STATUTORY_FLOOR_MULTIPLE;
}

/**
 * The credit reads the poverty guidelines published *before* the plan year
 * opens: 26 CFR 1.36B-1(h) fixes the figure at the guidelines in effect on
 * the first day of open enrollment, the previous 1 November.
 */
export const FPL_GUIDELINE_LOOKBACK_YEARS = 1;

/** The calendar year whose poverty guidelines price a coverage year. */
export function fplGuidelineYear(coverageYear: CoverageYear = defaultCoverageYear()): number {
  return coverageYear - FPL_GUIDELINE_LOOKBACK_YEARS;
}

/**
 * One row of the applicable-percentage table: between `from` and `to` times
 * the poverty line, the household's share of the benchmark rises linearly
 * from `initial` to `final`.
 */
export interface ApplicableBand {
  from: number;
  to: number;
  initial: number;
  final: number;
}

/** One coverage year's poverty line and table. */
export interface PtcYearParams {
  source: string;
  /** The calendar year of the guidelines this coverage year is priced from. */
  guidelineYear: number;
  /**
   * The guideline for a one-person household in the 48 contiguous states and
   * DC. Alaska and Hawaii have their own, roughly 25% and 15% higher, so a
   * reader there meets every line here at more income than it is drawn at.
   */
  firstPerson: number;
  /** Added for each person past the first. The guidelines are that linear. */
  perAdditionalPerson: number;
  /** Whether income over 400% zeroes the credit. False 2021–2025, true from 2026. */
  cliff: boolean;
  /**
   * The table, ascending and contiguous. The last band's `to` is 4 in a year
   * with a cliff and Infinity in a year without one.
   */
  table: ApplicableBand[];
}

/**
 * The poverty line and the table by coverage year.
 *
 * The 2025 table is ARPA section 9661's, extended through 2025 by section
 * 12001 of the Inflation Reduction Act: nothing owed under 150% of the line,
 * 8.5% at the top, and no top. The 2026 table is the statute's own, indexed —
 * and the reason this page exists: the household's share roughly doubled at
 * every income, the slope under the line with it, and the line came back.
 * The House passed a three-year extension on 8 January 2026, 230–196; the
 * Senate has not taken it up, and 2026 coverage is priced under this table.
 */
export const FPL_YEAR_PARAMS: Record<CoverageYear, PtcYearParams> = {
  2025: {
    source:
      'HHS poverty guidelines, January 2024 (2024 guidelines price 2025 coverage); ARPA 9661 table as extended by IRA 12001',
    guidelineYear: 2024,
    firstPerson: 15_060,
    perAdditionalPerson: 5_380,
    cliff: false,
    table: [
      { from: 0, to: 1.5, initial: 0, final: 0 },
      { from: 1.5, to: 2, initial: 0, final: 0.02 },
      { from: 2, to: 2.5, initial: 0.02, final: 0.04 },
      { from: 2.5, to: 3, initial: 0.04, final: 0.06 },
      { from: 3, to: 4, initial: 0.06, final: 0.085 },
      { from: 4, to: Infinity, initial: 0.085, final: 0.085 },
    ],
  },
  2026: {
    source:
      'HHS poverty guidelines, 90 Fed. Reg. 5917 (January 17 2025); applicable percentage table, Rev. Proc. 2025-25 section 3.01',
    guidelineYear: 2025,
    firstPerson: 15_650,
    perAdditionalPerson: 5_500,
    cliff: true,
    table: [
      { from: 0, to: 1.33, initial: 0.021, final: 0.021 },
      { from: 1.33, to: 1.5, initial: 0.0314, final: 0.0419 },
      { from: 1.5, to: 2, initial: 0.0419, final: 0.066 },
      { from: 2, to: 2.5, initial: 0.066, final: 0.0844 },
      { from: 2.5, to: 3, initial: 0.0844, final: 0.0996 },
      { from: 3, to: 4, initial: 0.0996, final: 0.0996 },
    ],
  },
};

/** The poverty line for a household of `householdSize`, for a coverage year. */
export function povertyLine(householdSize: number, year: CoverageYear = defaultCoverageYear()): number {
  const { firstPerson, perAdditionalPerson } = FPL_YEAR_PARAMS[year];
  return firstPerson + perAdditionalPerson * (Math.max(1, householdSize) - 1);
}

/** The poverty line this scenario's household is measured against. */
export function povertyLineFor(scenario: Scenario = {}): number {
  const { year } = resolveScenario(scenario);
  return povertyLine(householdSizeFor(scenario), year);
}

/** A household income as a multiple of the poverty line: 4 is 400% of it. */
export function fplMultipleOf(magi: number, scenario: Scenario = {}): number {
  const line = povertyLineFor(scenario);
  return line > 0 ? magi / line : 0;
}

/**
 * The applicable percentage at a multiple of the poverty line: the share of
 * household income the household pays for the benchmark before the credit
 * picks up the rest.
 *
 * Interpolated linearly inside its band, which is what 26 CFR 1.36B-3(g)
 * prescribes. Two things Form 8962 does that this does not: it rounds the
 * multiple down to a whole percent before the lookup, and it rounds the
 * result to four places. Both are steps of a few dollars, and the page is
 * about the slope, so the smooth line is drawn and the rounding is left to
 * the form.
 *
 * Past the table's last band the last percentage is carried on flat. That is
 * what ARPA's table did in law, and in a year with a cliff it is how the
 * slope is read *at* the line — see `creditSlopeAt`.
 */
export function applicablePercentage(
  fplMultiple: number,
  year: CoverageYear = defaultCoverageYear(),
): number {
  const { table } = FPL_YEAR_PARAMS[year];
  const last = table[table.length - 1];
  if (fplMultiple >= last.to) return last.final;
  const band = table.find((b) => fplMultiple >= b.from && fplMultiple < b.to) ?? table[0];
  const width = band.to - band.from;
  const progress = Number.isFinite(width) && width > 0 ? (fplMultiple - band.from) / width : 0;
  return band.initial + (band.final - band.initial) * progress;
}

/** The floor under the credit, in dollars of household income. */
export function creditFloorMagi(scenario: Scenario = {}): number {
  const { expansionState } = resolveScenario(scenario);
  return creditFloorMultiple(expansionState) * povertyLineFor(scenario);
}

/** The household income at which the credit disappears, or null in a year without a cliff. */
export function ptcCliffMagi(scenario: Scenario = {}): number | null {
  const { year } = resolveScenario(scenario);
  return FPL_YEAR_PARAMS[year].cliff ? PTC_CLIFF_PERCENT * povertyLineFor(scenario) : null;
}

/**
 * What the household is asked to pay for the benchmark at a household income:
 * the applicable percentage of that income. Not capped at the benchmark — the
 * cap is the credit's, in `premiumTaxCredit`.
 */
export function expectedContribution(magi: number, scenario: Scenario = {}): number {
  const { year } = resolveScenario(scenario);
  return applicablePercentage(fplMultipleOf(magi, scenario), year) * Math.max(0, magi);
}

/**
 * The year's credit at a household income: the benchmark less the household's
 * share, never below zero, and zero outright below the floor or — in a year
 * with one — over the cliff.
 *
 * Unrounded on purpose: `creditSlopeAt` reads a one-dollar difference off
 * this. Round it where it is quoted. `cliff` can be switched off to read the
 * table as if it had no top.
 */
export function premiumTaxCredit(
  magi: number,
  scenario: Scenario = {},
  { cliff }: { cliff?: boolean } = {},
): number {
  const { year, expansionState } = resolveScenario(scenario);
  const applyCliff = cliff ?? FPL_YEAR_PARAMS[year].cliff;
  const multiple = fplMultipleOf(magi, scenario);
  if (multiple < creditFloorMultiple(expansionState)) return 0;
  if (applyCliff && multiple > PTC_CLIFF_PERCENT) return 0;
  return Math.max(0, benchmarkAnnualFor(scenario) - expectedContribution(magi, scenario));
}

/**
 * What the household pays for the benchmark plan for the year at a household
 * income, or null where the Marketplace is not where it buys coverage.
 *
 * Three regimes. Under the floor in a state that expanded Medicaid the
 * household is on Medicaid, which has no premium and is not a Marketplace
 * plan, so there is no benchmark cost to quote: null, and the chart draws a
 * gap. Under 100% in a state that did not expand, there is no credit and no
 * Medicaid, so the household pays the whole benchmark. Everywhere else it
 * pays the benchmark less the credit — its own share of income under the
 * line, the whole premium over it.
 */
export function netPremiumAt(magi: number, scenario: Scenario = {}): number | null {
  const { expansionState } = resolveScenario(scenario);
  const multiple = fplMultipleOf(magi, scenario);
  if (expansionState && multiple < EXPANSION_FLOOR_MULTIPLE) return null;
  return benchmarkAnnualFor(scenario) - premiumTaxCredit(magi, scenario);
}

/**
 * The credit given back on the next dollar of household income, in dollars
 * per dollar — the slope this page is named for.
 *
 * Two things move at once when income rises by a dollar: the applicable
 * percentage, because the household is further up its band, and the income
 * that percentage is applied to. So the household's share rises faster than
 * the percentage alone says — 7.9% of income becomes around 17 cents on the
 * next dollar for a couple in the middle of the table — and the credit falls
 * by exactly that much.
 *
 * Zero below the floor, where there is no credit to give back, and zero past
 * the cliff for the same reason. *At* the cliff the slope is read with the
 * cliff suspended, so the plateau runs up to the line and the line itself is
 * priced as what it is: one dollar that costs the whole credit. See
 * `cliffCost`.
 */
export function creditSlopeAt(magi: number, scenario: Scenario = {}): number {
  const cliffMagi = ptcCliffMagi(scenario);
  if (cliffMagi !== null && magi > cliffMagi) return 0;
  const here = premiumTaxCredit(magi, scenario);
  if (here <= 0) return 0;
  const next = premiumTaxCredit(magi + 1, scenario, { cliff: false });
  return Math.max(0, here - next);
}

/** The credit given back between two household incomes, in dollars — the cliff included if it is crossed. */
export function creditLostBetween(from: number, to: number, scenario: Scenario = {}): number {
  return premiumTaxCredit(from, scenario) - premiumTaxCredit(to, scenario);
}

/**
 * What the dollar past the line costs: the credit still allowed at exactly
 * 400% of the poverty line. Null in a year without a cliff, and zero when the
 * household's share has already reached the benchmark before the line.
 */
export function cliffCost(scenario: Scenario = {}): number | null {
  const cliffMagi = ptcCliffMagi(scenario);
  if (cliffMagi === null) return null;
  return toCents(premiumTaxCredit(cliffMagi, scenario));
}

/** One cost-sharing reduction tier under section 1402 of the ACA. */
export interface CsrTier {
  upTo: number;
  actuarialValue: number;
}

/**
 * The three tiers, ascending. A standard silver plan is 70%; these turn it
 * into 94%, 87% and 73% — a deductible of a few hundred dollars instead of a
 * few thousand — and each step down is lost whole on the dollar that crosses
 * it. Drawn as lines rather than priced, because what a deductible is worth
 * depends on how ill the household gets.
 */
export const CSR_TIERS: readonly CsrTier[] = [
  { upTo: 1.5, actuarialValue: 94 },
  { upTo: 2, actuarialValue: 87 },
  { upTo: 2.5, actuarialValue: 73 },
];

/** The tier a household income lands in, or null above them all or below the floor. */
export function csrTierFor(magi: number, scenario: Scenario = {}): CsrTier | null {
  const { expansionState } = resolveScenario(scenario);
  const multiple = fplMultipleOf(magi, scenario);
  if (multiple < creditFloorMultiple(expansionState)) return null;
  return CSR_TIERS.find((tier) => multiple <= tier.upTo) ?? null;
}

/** One vertical line the chart can draw: an edge of the credit, or a tier boundary. */
export interface SubsidyLine {
  id: 'floor' | 'csr-150' | 'csr-200' | 'csr-250' | 'cliff';
  /** Which family of line it belongs to, which is which switch draws it. */
  kind: 'edge' | 'csr';
  multiple: number;
  magi: number;
  label: string;
}

/**
 * Every line the credit puts on an income axis for this household, ascending:
 * the floor, the three cost-sharing boundaries, and — in a year with one —
 * the cliff.
 */
export function subsidyLines(scenario: Scenario = {}): SubsidyLine[] {
  const { expansionState } = resolveScenario(scenario);
  const line = povertyLineFor(scenario);
  const floor = creditFloorMultiple(expansionState);
  const lines: SubsidyLine[] = [
    {
      id: 'floor',
      kind: 'edge',
      multiple: floor,
      magi: floor * line,
      label: `${Math.round(floor * 100)}% FPL`,
    },
    ...CSR_TIERS.map(
      (tier): SubsidyLine => ({
        id: `csr-${Math.round(tier.upTo * 100)}` as SubsidyLine['id'],
        kind: 'csr',
        multiple: tier.upTo,
        magi: tier.upTo * line,
        label: `CSR ${tier.actuarialValue}%`,
      }),
    ),
  ];
  const cliff = ptcCliffMagi(scenario);
  if (cliff !== null) {
    lines.push({
      id: 'cliff',
      kind: 'edge',
      multiple: PTC_CLIFF_PERCENT,
      magi: cliff,
      label: `${PTC_CLIFF_PERCENT * 100}% FPL`,
    });
  }
  return lines;
}

/** Where a household income stands against the credit, in every figure the page quotes. */
export interface PtcAssessment {
  magi: number;
  householdSize: number;
  povertyLine: number;
  /** `magi` as a multiple of the line: 2.36 is 236% of it. */
  fplMultiple: number;
  floorMultiple: number;
  floorMagi: number;
  /** Under the floor: Medicaid in an expansion state, the gap elsewhere. */
  belowFloor: boolean;
  cliffApplies: boolean;
  cliffMagi: number | null;
  overCliff: boolean;
  /** Household income still available before the line; 0 once over; null without a cliff. */
  headroom: number | null;
  /** The share of income the table asks for at this point. */
  applicablePercentage: number;
  benchmarkMonthly: number;
  benchmarkAnnual: number;
  /** What the household pays for the benchmark for the year, to the cent; null on Medicaid. */
  netPremiumAnnual: number | null;
  /** The year's credit, to the cent. */
  credit: number;
  /** The credit given back on the next dollar, as a fraction of it. */
  slope: number;
  csrTier: CsrTier | null;
}

/** Where a given household income stands against this year's credit. */
export function ptcFor(magi: number, scenario: Scenario = {}): PtcAssessment {
  const { year, expansionState } = resolveScenario(scenario);
  const cliffApplies = FPL_YEAR_PARAMS[year].cliff;
  const cliffMagi = ptcCliffMagi(scenario);
  const floorMultiple = creditFloorMultiple(expansionState);
  const fplMultiple = fplMultipleOf(magi, scenario);
  const net = netPremiumAt(magi, scenario);
  return {
    magi,
    householdSize: householdSizeFor(scenario),
    povertyLine: povertyLineFor(scenario),
    fplMultiple,
    floorMultiple,
    floorMagi: creditFloorMagi(scenario),
    belowFloor: fplMultiple < floorMultiple,
    cliffApplies,
    cliffMagi,
    overCliff: cliffMagi !== null && magi > cliffMagi,
    headroom: cliffMagi === null ? null : Math.max(0, cliffMagi - magi),
    applicablePercentage: applicablePercentage(fplMultiple, year),
    benchmarkMonthly: benchmarkMonthlyFor(scenario),
    benchmarkAnnual: benchmarkAnnualFor(scenario),
    netPremiumAnnual: net === null ? null : toCents(net),
    credit: toCents(premiumTaxCredit(magi, scenario)),
    slope: creditSlopeAt(magi, scenario),
    csrTier: csrTierFor(magi, scenario),
  };
}
