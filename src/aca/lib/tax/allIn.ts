/**
 * The two things a household on the Marketplace hands over as a share of
 * its income, added together: federal income tax, and the premium it pays
 * for the benchmark plan after the subsidy.
 *
 * The premium is on this side of the ledger because the subsidy makes it a
 * share of income — the table says what percentage of income the household
 * pays, the subsidy covers the rest, and every extra dollar earned gives
 * some of the subsidy back. That is a tax in everything but the name, and
 * the return is where it is settled (Form 8962). So the page draws the two
 * as one rate, and the split under it.
 */
import { ptcFor, resolveScenario, creditFloorMagi, ptcCliffMagi, toCents } from '../aca';
import type { PtcAssessment, Scenario } from '../aca';
import { filingStatusFor } from './filing';
import {
  bracketRateAt,
  bracketTax,
  childTaxCreditFor,
  incomeTaxFor,
  incomeTaxSlopeAt,
  standardDeductionFor,
  taxableIncomeFor,
} from './incomeTax';
import type { FilingStatus } from './types';

/** A figure as a share of a household income, or zero where there is no income to share. */
const shareOf = (amount: number, magi: number): number => (magi > 0 ? amount / magi : 0);

/**
 * What the household pays for the benchmark for the year, on this page's
 * reading: null wherever the household is under the subsidy's floor.
 *
 * Under the floor in a state that expanded Medicaid there is no premium at
 * all, which is the cost chart's reading too. Under 100% of the poverty line
 * in a state that did not, the cost chart draws the full premium; this one
 * does not, because the full premium as a share of an income under the
 * poverty line is not a rate anyone pays — it is the coverage gap, and the
 * plot leaves it as a gap.
 */
export function premiumForRate(ptc: PtcAssessment): number | null {
  return ptc.belowFloor ? null : ptc.netPremiumAnnual;
}

/** Where a household income stands against tax and premium together, in every figure the page quotes. */
export interface AllInAssessment {
  magi: number;
  filingStatus: FilingStatus;
  standardDeduction: number;
  taxableIncome: number;
  /** The schedule's own answer, before the child tax credit. */
  bracketTax: number;
  /** The child tax credit taken: never more than the tax it offsets. */
  childTaxCredit: number;
  /** Federal income tax for the year, to the cent. */
  incomeTax: number;
  /** The same as a share of income. */
  incomeTaxShare: number;
  /** The rate of the band the last dollar of taxable income falls in. */
  bracketRate: number;
  /** Income tax on the next dollar, as a fraction of it. */
  incomeTaxSlope: number;
  /** What the household pays for the benchmark for the year; null under the floor. */
  premium: number | null;
  premiumShare: number | null;
  /** The subsidy given back on the next dollar, as a fraction of it. */
  premiumSlope: number;
  /** Tax and premium together for the year; null where there is no premium to add. */
  allIn: number | null;
  allInShare: number | null;
  /** What the next dollar costs in tax and subsidy together. */
  allInSlope: number;
  /** The subsidy side, whole: the floor, the cliff, the credit. */
  ptc: PtcAssessment;
}

/** Where a household income stands against tax and premium together. */
export function allInFor(magi: number, scenario: Scenario = {}): AllInAssessment {
  const { year } = resolveScenario(scenario);
  const ptc = ptcFor(magi, scenario);
  const filingStatus = filingStatusFor(scenario);
  const taxableIncome = taxableIncomeFor(magi, scenario);
  const schedule = bracketTax(taxableIncome, year, filingStatus);
  const credit = Math.min(schedule, childTaxCreditFor(magi, scenario));
  const incomeTax = incomeTaxFor(magi, scenario);
  const premium = premiumForRate(ptc);
  const allIn = premium === null ? null : incomeTax + premium;
  const incomeTaxSlope = incomeTaxSlopeAt(magi, scenario);
  return {
    magi,
    filingStatus,
    standardDeduction: standardDeductionFor(scenario),
    taxableIncome,
    bracketTax: toCents(schedule),
    childTaxCredit: toCents(credit),
    incomeTax: toCents(incomeTax),
    incomeTaxShare: shareOf(incomeTax, magi),
    bracketRate: bracketRateAt(magi, scenario),
    incomeTaxSlope,
    premium: premium === null ? null : toCents(premium),
    premiumShare: premium === null ? null : shareOf(premium, magi),
    premiumSlope: ptc.slope,
    allIn: allIn === null ? null : toCents(allIn),
    allInShare: allIn === null ? null : shareOf(allIn, magi),
    allInSlope: incomeTaxSlope + ptc.slope,
    ptc,
  };
}

/** One sample of the swept curve, in the units the chart plots and the hover quotes. */
export interface RatePoint {
  magi: number;
  /** Federal income tax as a share of income. */
  incomeTaxShare: number;
  /** The premium after the subsidy as a share of income; null under the floor. */
  premiumShare: number | null;
  /** The two together; null wherever `premiumShare` is. */
  allInShare: number | null;
  /** The same three in dollars for the year, for the hover. */
  incomeTax: number;
  premium: number | null;
  fplMultiple: number;
}

/** How far the sweep runs and how finely. */
export interface RateCurveRange {
  maxMagi?: number;
  step?: number;
}

/**
 * The curve, sampled every `step` dollars from $0 to `maxMagi`, with the
 * subsidy's edges inserted exactly, as `costCurve` inserts them: the floor
 * and the dollar before it, the cliff and the dollar after it. The income
 * tax is continuous everywhere — a bracket edge changes the slope, not the
 * figure — so it needs no edges of its own.
 */
export function rateCurve(
  scenario: Scenario = {},
  { maxMagi = 150_000, step = 250 }: RateCurveRange = {},
): RatePoint[] {
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
      const here = allInFor(magi, scenario);
      return {
        magi,
        incomeTaxShare: here.incomeTaxShare,
        premiumShare: here.premiumShare,
        allInShare: here.allInShare,
        incomeTax: Math.round(here.incomeTax),
        premium: here.premium === null ? null : Math.round(here.premium),
        fplMultiple: here.ptc.fplMultiple,
      };
    });
}

/** The narrowest the rate axis is ever drawn: the first tick past nothing. */
export const MIN_RATE_AXIS = 0.1;

/**
 * The top of the rate axis: the curve's highest point, and the reader's own,
 * rounded up to the next tick — every 10 points, or every 20 once the curve
 * runs past 60%, so the axis never carries more than eight labels. A
 * hair of headroom, so a peak that lands on a tick is not drawn on the
 * frame.
 */
export function rateAxis(
  curve: RatePoint[],
  hereShare: number | null = null,
): { max: number; ticks: number[] } {
  const peak = Math.max(
    hereShare ?? 0,
    ...curve.map((point) => point.allInShare ?? point.incomeTaxShare),
  );
  const step = peak > 0.6 ? 0.2 : 0.1;
  const max = Math.max(MIN_RATE_AXIS, Math.ceil((peak + 0.005) / step) * step);
  const ticks: number[] = [];
  for (let tick = 0; tick <= max + 1e-9; tick += step) ticks.push(Math.round(tick * 100) / 100);
  return { max: Math.round(max * 100) / 100, ticks };
}
