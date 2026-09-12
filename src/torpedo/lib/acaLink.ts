import { linkTo } from '../../shared/lib/pages';
import type { FilingStatus } from './tax';

/**
 * The Subsidy Slope's address for this return's household.
 *
 * The other page prices the Marketplace plan at a household income, and this
 * page already computes that income — 36B(d)(2)(B)'s, the benefit counted
 * whole — to place the 400% line. So the link carries it, and carries one
 * adult where the return is one person's; the other page's default is a
 * couple, which is what a joint return implies. Its keys are written here by
 * name, `income` and `adults`, and `the links between the pages` in
 * src/guards/pages.test.tsx decodes this link with that page's own decoder
 * to hold the two pages to one contract. Nothing is clamped here: a
 * household income past what the other page prices arrives as its link
 * note, which is the honest answer.
 */
export const acaLink = ({ magi, filingStatus }: { magi: number; filingStatus: FilingStatus }): string =>
  linkTo('aca', `income=${Math.round(magi)}${filingStatus === 'single' ? '&adults=1' : ''}`);
