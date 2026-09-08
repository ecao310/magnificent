import type { PtcAssessment } from './aca';
import { formatCurrency, formatFpl } from './format';

/**
 * The one sentence that prices where the reader is standing, in pieces: the
 * prose, and the figures inside it that are set in mono.
 *
 * Pieces rather than a string because the sentence is said twice — under the
 * slider, where the figures are marked, and in the live region, where it is
 * read out flat — and two hand-written copies would eventually say two
 * different things.
 */
export interface ReadoutPart {
  text: string;
  /** A figure: set in mono on the page, and the first of them takes the amber. */
  strong?: boolean;
}

/** Where the household stands, as the sentence under the slider says it. */
export function readoutParts(here: PtcAssessment): ReadoutPart[] {
  const head = `At ${formatCurrency(Math.round(here.magi))} — ${formatFpl(
    here.fplMultiple,
  )} of the poverty line — `;
  const monthly = here.netPremiumAnnual === null ? null : Math.round(here.netPremiumAnnual / 12);
  const floor = formatCurrency(Math.round(here.floorMagi));

  if (monthly === null) {
    return [
      { text: `${head}you are under the Medicaid line; the subsidy starts at ` },
      { text: floor, strong: true },
      { text: '.' },
    ];
  }
  if (here.belowFloor) {
    return [
      { text: `${head}no subsidy and no Medicaid; the subsidy starts at ` },
      { text: floor, strong: true },
      { text: '.' },
    ];
  }
  if (here.overCliff) {
    return [
      { text: `${head}you are ` },
      { text: formatCurrency(Math.round(here.magi - (here.cliffMagi ?? 0))), strong: true },
      { text: ' over the 400% line: no subsidy, full premium ' },
      { text: `${formatCurrency(here.benchmarkMonthly)}/mo`, strong: true },
      { text: '.' },
    ];
  }
  if (here.credit === 0) {
    return [
      { text: `${head}your share of income already covers the full premium: ` },
      { text: `${formatCurrency(monthly)}/mo`, strong: true },
      { text: '.' },
    ];
  }
  return [
    { text: `${head}you pay ` },
    { text: `${formatCurrency(monthly)}/mo`, strong: true },
    { text: ' and the subsidy pays ' },
    { text: `${formatCurrency(Math.round(here.credit / 12))}/mo`, strong: true },
    { text: '.' },
  ];
}

/** The same sentence flat, for the region that reads it aloud. */
export const readoutText = (here: PtcAssessment): string =>
  readoutParts(here)
    .map((part) => part.text)
    .join('');
