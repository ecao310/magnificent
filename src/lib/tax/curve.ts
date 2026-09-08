/**
 * The two curves the page draws — the all-in rate on the next dollar as a
 * conversion and as a harvested gain — swept across a household-income axis,
 * and the cost of the one block the reader is actually deciding about.
 */
import type { AddedKind } from './types';
import { resolveScenario } from './scenario';
import type { Scenario } from './scenario';
import { baseIncomeFor, householdIncomeFor, taxOnSplit, totalTax } from './income';
import type { IncomeSplit } from './income';
import { creditSlopeAt, premiumTaxCredit, ptcCliffMagi } from './ptc';

/**
 * How a household income on the axis is made up.
 *
 * The reader sets a base — ordinary income and qualified income they have
 * regardless — and a block on top of it of one kind. Every point on the axis
 * past the base is the base plus that much of the block; every point short
 * of it is the base scaled down in the same proportions, because the axis has
 * to start at $0 and a household with less than its base is most plausibly
 * the same household with less of everything.
 *
 * Both curves read the same composition at every point. What they ask is
 * different: given this income, made up this way, what does one more dollar
 * of *each* kind cost? So switching the kind moves both curves to the right
 * of the base — the block under them changes — and neither to the left.
 */
export function splitAt(magi: number, scenario: Scenario = {}): IncomeSplit {
  const { ordinaryIncome, qualifiedIncome, addedKind } = resolveScenario(scenario);
  const base = ordinaryIncome + qualifiedIncome;
  const income = Math.max(0, magi);
  if (income <= base) {
    const share = base > 0 ? income / base : 0;
    return { ordinary: ordinaryIncome * share, gains: qualifiedIncome * share };
  }
  const block = income - base;
  return {
    ordinary: ordinaryIncome + (addedKind === 'conversion' ? block : 0),
    gains: qualifiedIncome + (addedKind === 'harvest' ? block : 0),
  };
}

/** What the next dollar costs at one household income, both ways, as fractions. */
export interface NextDollar {
  magi: number;
  /** Federal tax on the next dollar as a conversion, and as a gain. */
  conversionTax: number;
  harvestTax: number;
  /** The credit given back on the next dollar — the same for both. */
  credit: number;
  /** The year's federal tax and credit at this income. */
  tax: number;
  creditHere: number;
}

/**
 * The next dollar at one point on the axis, priced by a one-dollar difference
 * rather than from the bracket it lands in, because the bracket is not the
 * whole price: an ordinary dollar under a stack of gains pushes the stack's
 * top dollar out of the 0% band, and the difference sees that where a bracket
 * lookup would not.
 */
export function nextDollarAt(magi: number, scenario: Scenario = {}): NextDollar {
  const split = splitAt(magi, scenario);
  const tax = taxOnSplit(split, scenario);
  return {
    magi,
    conversionTax: taxOnSplit({ ...split, ordinary: split.ordinary + 1 }, scenario) - tax,
    harvestTax: taxOnSplit({ ...split, gains: split.gains + 1 }, scenario) - tax,
    credit: creditSlopeAt(magi, scenario),
    tax,
    creditHere: premiumTaxCredit(magi, scenario),
  };
}

/** One sample of the swept curves, in the units the chart plots. */
export interface SlopePoint {
  magi: number;
  /** All-in rate on the next dollar as a conversion, in percent. */
  conversionRate: number;
  /** All-in rate on the next dollar as a harvested gain, in percent. */
  harvestRate: number;
  /** The credit's share of either, in percent. */
  creditRate: number;
  /** Total federal income tax at this point, whole dollars. */
  tax: number;
  /** The year's premium tax credit at this point, whole dollars. */
  credit: number;
}

/** How far the sweep runs and how finely. */
export interface SlopeCurveRange {
  /** Right edge of the swept household-income axis. */
  maxMagi?: number;
  /** Sampling interval, in dollars. */
  step?: number;
}

const percent = (fraction: number): number => Math.round(fraction * 10_000) / 100;

/**
 * Both curves, sampled from $0 to `maxMagi`.
 *
 * Neither the base nor the block moves the sweep: the axis is every household
 * income from nothing to the right edge, and the scenario's own income only
 * says how each point on it is composed. See `splitAt`.
 */
export function slopeCurve(
  scenario: Scenario = {},
  { maxMagi = 150_000, step = 250 }: SlopeCurveRange = {},
): SlopePoint[] {
  const data: SlopePoint[] = [];
  for (let magi = 0; magi <= maxMagi; magi += step) {
    const next = nextDollarAt(magi, scenario);
    data.push({
      magi,
      conversionRate: percent(next.conversionTax + next.credit),
      harvestRate: percent(next.harvestTax + next.credit),
      creditRate: percent(next.credit),
      tax: Math.round(next.tax),
      credit: Math.round(next.creditHere),
    });
  }
  return data;
}

/** What the block costs, and what of. */
export interface BlockCost {
  kind: AddedKind;
  /** Household income before and after the block. */
  from: number;
  to: number;
  added: number;
  /** More federal tax, in dollars. */
  tax: number;
  /** Less premium tax credit, in dollars. */
  credit: number;
  total: number;
  /** Each as a share of the block; null when nothing was added. */
  taxRate: number | null;
  creditRate: number | null;
  rate: number | null;
  /** Whether the block carries the household over the 400% line. */
  crossesCliff: boolean;
}

/**
 * The cost of the reader's own block, from the base to the base plus the
 * block, with the cliff in it: if the block crosses the line the whole
 * credit is in `credit`, which is the point.
 *
 * `kind` defaults to the scenario's own and can name the other, so the
 * readout can price the block both ways from one scenario.
 */
export function blockCost(scenario: Scenario = {}, kind?: AddedKind): BlockCost {
  const resolved = resolveScenario(scenario);
  const addedKind = kind ?? resolved.addedKind;
  const before: Scenario = { ...resolved, added: 0 };
  const after: Scenario = { ...resolved, addedKind };
  const from = baseIncomeFor(before);
  const to = householdIncomeFor(after);
  const added = to - from;
  const tax = totalTax(after) - totalTax(before);
  const credit = premiumTaxCredit(from, before) - premiumTaxCredit(to, after);
  const total = tax + credit;
  const cliff = ptcCliffMagi(after);
  return {
    kind: addedKind,
    from,
    to,
    added,
    tax: Math.round(tax),
    credit: Math.round(credit),
    total: Math.round(total),
    taxRate: added > 0 ? tax / added : null,
    creditRate: added > 0 ? credit / added : null,
    rate: added > 0 ? total / added : null,
    crossesCliff: cliff !== null && from <= cliff && to > cliff,
  };
}
