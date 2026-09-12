/**
 * Where to read on, in the one place the footer and the test that reads the
 * footer back can both look.
 *
 * Five pieces, in the order a reader who has just read the page would want
 * them: the piece that works the same problem in prose, the table and the
 * calculator the figures come from, what counts as household income, and the
 * curve the default premium is drawn on. Each
 * is a title and its publisher, nothing more: a publisher refreshes an
 * article and a date or a summary on the page would go stale while the link
 * did not.
 */
import type { Reading } from '../../shared/lib/reading';

export type { Reading };

export const FURTHER_READING: readonly Reading[] = [
  {
    href: 'https://www.kitces.com/blog/reducing-aca-health-insurance-premiums-after-the-expiration-of-the-enhanced-premium-tax-credit-expiration-affordable-care-act-ptc/',
    title: 'Reducing ACA Health Insurance Premiums After ‘Enhanced’ Premium Tax Credit Expiration',
    source: 'Kitces',
  },
  {
    href: 'https://thefinancebuff.com/aca-premium-tax-credit-percentages.html',
    title: '2026 2027 ACA Health Insurance Premium Tax Credit Percentages',
    source: 'The Finance Buff',
  },
  {
    href: 'https://www.kff.org/interactive/subsidy-calculator/',
    title: 'Health Insurance Marketplace Calculator',
    source: 'KFF',
  },
  {
    href: 'https://www.healthcare.gov/income-and-household-information/income/',
    title: 'What’s included as income',
    source: 'HealthCare.gov',
  },
  {
    href: 'https://www.cms.gov/CCIIO/Resources/Regulations-and-Guidance/Downloads/Final-Guidance-Regarding-Age-Curves-and-State-Reporting-12-16-16.pdf',
    title: 'Final Guidance Regarding Age Curves and State Reporting',
    source: 'CMS',
  },
];
