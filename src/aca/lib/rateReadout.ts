import type { AllInAssessment } from './tax';
import { formatCurrency, formatFpl, formatPercent } from './format';
import type { ReadoutPart } from './readout';

/**
 * The one sentence that prices where the reader is standing on the rate
 * page, in pieces — see `readoutParts` for why pieces. The first figure is
 * the all-in rate, which the stylesheet sets in the marker's amber.
 */
export function rateReadoutParts(here: AllInAssessment): ReadoutPart[] {
  const { ptc } = here;
  const head = `At ${formatCurrency(Math.round(here.magi))} — ${formatFpl(
    ptc.fplMultiple,
  )} of the poverty line — `;
  const tax = formatPercent(here.incomeTaxShare);

  if (here.allInShare === null || here.premiumShare === null) {
    return [
      {
        text: `${head}${
          ptc.floorMultiple > 1
            ? 'you are under the Medicaid line, so there is no premium; '
            : 'there is no subsidy and no Medicaid; '
        }income tax alone is `,
      },
      { text: tax, strong: true },
      { text: ' of income.' },
    ];
  }
  const premium = formatPercent(here.premiumShare);
  return [
    { text: `${head}you pay ` },
    { text: formatPercent(here.allInShare), strong: true },
    { text: ' all in: ' },
    { text: tax, strong: true },
    { text: ' in income tax and ' },
    { text: premium, strong: true },
    {
      text: ptc.overCliff
        ? ' for the plan, with no subsidy over the 400% line.'
        : ptc.credit === 0
          ? ' for the plan, the full premium.'
          : ' for the plan after the subsidy.',
    },
  ];
}

/** The same sentence flat, for the region that reads it aloud. */
export const rateReadoutText = (here: AllInAssessment): string =>
  rateReadoutParts(here)
    .map((part) => part.text)
    .join('');
