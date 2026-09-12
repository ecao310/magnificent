/**
 * The two charts of the household, one of which is on the page at a time,
 * and the fragment that says which.
 *
 * One page, two curves of the same household: what it pays for the plan,
 * and what that comes to with income tax on top. The chooser above the
 * chart picks one, in place — nothing is fetched and nothing reloads — and
 * the choice is written into the address bar as the fragment, because the
 * fragment is where the reader is standing (see `scenarioUrl.ts`): a link
 * that arrives at `#step-rate` opens on the rate chart, and one with no
 * fragment opens on the cost chart, as the page always has.
 */
export type ChartId = 'cost' | 'rate';

export interface Chart {
  id: ChartId;
  /** The section element's id, and so the fragment that reaches it. */
  section: string;
  /** The section's heading, as the chooser names it. */
  name: string;
  /** What the chart draws, in a phrase. */
  gloss: string;
}

/** The two charts, in the order the chooser offers them: what you pay first, then what it adds up to. */
export const CHARTS: Chart[] = [
  { id: 'cost', section: 'step-cost', name: 'What you pay', gloss: 'The benchmark plan after the subsidy' },
  { id: 'rate', section: 'step-rate', name: 'Your effective rate', gloss: 'Income tax and premium as one rate' },
];

/** The chart the page opens on when the address says nothing. */
export const DEFAULT_CHART: ChartId = 'cost';

export const chartFor = (id: ChartId): Chart => CHARTS.find((chart) => chart.id === id) ?? CHARTS[0];

/** Which chart a fragment asks for: the one whose section it names, or the default. */
export function chartFromFragment(hash: string): ChartId {
  const section = hash.replace(/^#/, '');
  return CHARTS.find((chart) => chart.section === section)?.id ?? DEFAULT_CHART;
}

/**
 * The fragment to write for a chart: the section's, or none for the default,
 * so an address that says nothing still means what it always meant.
 */
export const fragmentFor = (id: ChartId): string =>
  id === DEFAULT_CHART ? '' : `#${chartFor(id).section}`;
