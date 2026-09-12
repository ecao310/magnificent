/**
 * Which return the household files, read off the household rather than
 * asked for.
 *
 * The page asks who is on the plan and nothing about the return, because
 * for a household this page can describe the answer follows: two adults on
 * one Marketplace plan are a married couple, and a married couple that
 * wants the subsidy files jointly — 36B(c)(1)(C) denies the credit to a
 * separate return. One adult with a child at home is a head of household,
 * and one adult alone is single.
 */
import { resolveScenario } from '../aca';
import type { Scenario } from '../aca';
import type { FilingStatus } from './types';

/** Every filing status the engine prices, in the order the tables list them. */
export const FILING_STATUSES: FilingStatus[] = ['single', 'hoh', 'mfj'];

/** How each status reads inside a sentence. */
export const FILING_STATUS_PROSE: Record<FilingStatus, string> = {
  single: 'filing single',
  hoh: 'filing as head of household',
  mfj: 'married filing jointly',
};

/** The return this household files. */
export function filingStatusFor(scenario: Scenario = {}): FilingStatus {
  const { adults, dependents } = resolveScenario(scenario);
  if (adults === 2) return 'mfj';
  return dependents > 0 ? 'hoh' : 'single';
}
