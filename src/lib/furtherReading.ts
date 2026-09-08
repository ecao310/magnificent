/**
 * Where to read on, in the one place the footer and the test that reads the
 * footer back can both look.
 *
 * Six pieces, in the order a reader who has just walked both steps would want
 * them: the thread this page answers, the piece that works the same problem
 * in prose, the table and the calculator the figures come from, what counts
 * as household income, and the curve the default premium is drawn on. Each
 * is a title and its publisher, nothing more: a publisher refreshes an
 * article and a date or a summary on the page would go stale while the link
 * did not.
 */
export interface Reading {
  href: string;
  title: string;
  /** Who published it, as a reader would name them. */
  source: string;
}

export const FURTHER_READING: readonly Reading[] = [
  {
    href: 'https://www.reddit.com/r/financialindependence/comments/1w8a2nz/tax_optimization_in_early_retirement_maximizing/',
    title: 'Maximizing ACA subsidies vs. tax-gain harvesting or Roth conversions',
    source: 'r/financialindependence',
  },
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
