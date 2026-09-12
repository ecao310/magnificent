import { linkTo } from '../../shared/lib/pages';
import type { FilingStatus } from './tax';

/**
 * The Tax Torpedo's address for this household's return.
 *
 * The other page prices a retiree's return, where Social Security is most of
 * the income and the benefit's own phase-in does to the marginal rate what
 * the subsidy's slope does here. Only the filing status crosses: this
 * household's income is not that page's "other income" — it adds a benefit
 * on top — so carrying it would open the other page on a return nobody
 * asked for. That page files single or jointly, so a head of household
 * arrives as single, which is its default and its closest answer. Its key
 * is written here by name, `filing`, and `the links between the pages` in
 * src/guards/pages.test.tsx decodes this link with that page's own decoder.
 */
export const torpedoLink = (filingStatus: FilingStatus): string =>
  linkTo('torpedo', filingStatus === 'mfj' ? 'filing=mfj' : '');
