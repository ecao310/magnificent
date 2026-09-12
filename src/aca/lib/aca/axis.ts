/**
 * How wide the chart is: far enough right to show the cliff with room past
 * it, and never so narrow that the reader's own point falls off the edge.
 */
import { resolveScenario } from './scenario';
import type { Scenario } from './scenario';
import { PTC_CLIFF_PERCENT, povertyLineFor, ptcCliffMagi } from './ptc';

/** The narrowest the axis is ever drawn. */
export const MIN_AXIS_MAGI = 100_000;

/** The axis is sized in these, so its right edge is a round figure. */
export const AXIS_ROUNDING = 10_000;

/** How far past the 400% line the axis runs, as a multiple of the line's own income. */
export const PAST_CLIFF = 1.5;

/** The headroom the reader's own point is given past itself. */
export const PAST_HERE = 10_000;

/**
 * The right edge of the axis for this household: half again past the 400%
 * line (or where it would be, in a year without one), and always past where
 * the reader is standing.
 */
export function axisMax(scenario: Scenario = {}, { minimum = MIN_AXIS_MAGI } = {}): number {
  const { income } = resolveScenario(scenario);
  const cliff = ptcCliffMagi(scenario) ?? PTC_CLIFF_PERCENT * povertyLineFor(scenario);
  const wanted = Math.max(minimum, cliff * PAST_CLIFF, income + PAST_HERE);
  return Math.ceil(wanted / AXIS_ROUNDING) * AXIS_ROUNDING;
}
