/**
 * The one curve the page draws: what the household pays for the benchmark
 * plan, month by month, swept across a household-income axis.
 */
import { resolveScenario } from './scenario';
import type { Scenario } from './scenario';
import { benchmarkMonthlyFor } from './premium';
import {
  applicablePercentage,
  creditFloorMagi,
  fplMultipleOf,
  netPremiumAt,
  premiumTaxCredit,
  ptcCliffMagi,
} from './ptc';

/** One sample of the swept curve, in the units the chart plots and the hover quotes. */
export interface CostPoint {
  magi: number;
  /** What the household pays for the benchmark, per month; null on Medicaid. */
  cost: number | null;
  /** The same, for the year. */
  costAnnual: number | null;
  /**
   * The benchmark's own monthly premium, drawn as the ceiling the subsidy
   * fills up to: the same figure at every income, and null wherever `cost` is
   * — on Medicaid there is no premium to draw a ceiling over.
   */
  fullPremium: number | null;
  /** The year's credit at this income, in dollars. */
  credit: number;
  /** The share of income the table asks for here. */
  share: number;
  fplMultiple: number;
}

/** How far the sweep runs and how finely. */
export interface CostCurveRange {
  /** Right edge of the swept household-income axis. */
  maxMagi?: number;
  /** Sampling interval, in dollars. */
  step?: number;
}

/**
 * The curve, sampled every `step` dollars from $0 to `maxMagi`, with the
 * household's own edges inserted exactly.
 *
 * The regular samples alone would draw the cliff as a slope across one
 * interval and start the credit a sample late, so the floor, the line, and
 * the dollar after the line are added wherever they fall. The list stays
 * ascending and free of duplicates, which is all the plot needs of it.
 */
export function costCurve(
  scenario: Scenario = {},
  { maxMagi = 150_000, step = 250 }: CostCurveRange = {},
): CostPoint[] {
  const { year } = resolveScenario(scenario);
  const monthly = benchmarkMonthlyFor(scenario);
  const xs = new Set<number>();
  for (let magi = 0; magi <= maxMagi; magi += step) xs.add(magi);
  const floor = Math.round(creditFloorMagi(scenario));
  const cliff = ptcCliffMagi(scenario);
  for (const edge of [floor - 1, floor, cliff, cliff === null ? null : cliff + 1]) {
    if (edge !== null && edge >= 0 && edge <= maxMagi) xs.add(edge);
  }
  return Array.from(xs)
    .sort((a, b) => a - b)
    .map((magi) => {
      const net = netPremiumAt(magi, scenario);
      const fplMultiple = fplMultipleOf(magi, scenario);
      return {
        magi,
        cost: net === null ? null : Math.round(net / 12),
        costAnnual: net === null ? null : Math.round(net),
        fullPremium: net === null ? null : monthly,
        credit: Math.round(premiumTaxCredit(magi, scenario)),
        share: applicablePercentage(fplMultiple, year),
        fplMultiple,
      };
    });
}
