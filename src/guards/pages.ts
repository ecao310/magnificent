import type { ComponentType } from 'react';
import { fireEvent, screen } from '@testing-library/react';
import TorpedoApp from '../torpedo/App';
import { RAIL_COLLAPSES_AT as TORPEDO_RAIL_COLLAPSES_AT } from '../torpedo/components/BenefitStep';
import { NARROW_MAX_WIDTH as TORPEDO_NARROW_MAX_WIDTH } from '../torpedo/components/chartFrame';
import { CHART as TORPEDO_CHART, PALETTE as TORPEDO_PALETTE } from '../torpedo/styles/palette';
import AcaApp from '../aca/App';
import { RAIL_COLLAPSES_AT as ACA_RAIL_COLLAPSES_AT } from '../aca/components/HouseholdStep';
import { NARROW_MAX_WIDTH as ACA_NARROW_MAX_WIDTH } from '../aca/components/chartFrame';
import { CHART as ACA_CHART, PALETTE as ACA_PALETTE } from '../aca/styles/palette';

/**
 * The two pages, as the guards see them.
 *
 * Every guard in this directory is a claim about the site — its build, its
 * link previews, its stylesheet, its prose — and the site is two pages that
 * share a shell and keep their own subject. So each guard runs once per page,
 * reading the page's own files and rendering the page's own `App`, and this
 * is the one table that says which files and which `App` those are. A third
 * page is a third row here and nothing else.
 */
export interface GuardedPage {
  id: 'torpedo' | 'aca';
  /** What the page calls itself in a sentence. */
  name: string;
  /** The HTML entry, relative to the repo root. */
  html: string;
  /** The path under the site's base the page is served at: `''` or `'aca/'`. */
  prefix: '' | 'aca/';
  /** Where its icons and its link-preview card live. */
  publicDir: string;
  /** The page's own stylesheet, which `@import`s the site's first. */
  sheet: string;
  /** The script that draws its link-preview card. */
  cover: string;
  /** The directory whose `.tsx` writes this page's markup, besides `src/shared`. */
  source: string;
  App: ComponentType;
  PALETTE: Record<string, string>;
  CHART: { axis: number; axisNarrow?: number; label: number };
  RAIL_COLLAPSES_AT: number;
  NARROW_MAX_WIDTH: number;
  /**
   * The selectors under the plot whose text is set at `CHART.label`, if any
   * are set in CSS rather than in the SVG.
   */
  chartNotes: string[];
  /**
   * What a default render leaves closed that a reader can open without
   * changing the household: the ACA page's second chart. Called after a
   * default render has been checked, for the rules only that state reaches.
   */
  reveal?: () => void;
}

/** The stylesheet both pages begin with. */
export const SITE_SHEET = 'src/shared/styles/site.css';

export const GUARDED_PAGES: readonly GuardedPage[] = [
  {
    id: 'torpedo',
    name: 'the Tax Torpedo',
    html: 'index.html',
    prefix: '',
    publicDir: 'public',
    sheet: 'src/torpedo/styles/torpedo.css',
    cover: 'scripts/og-cover.mjs',
    source: 'src/torpedo',
    App: TorpedoApp,
    PALETTE: TORPEDO_PALETTE,
    CHART: TORPEDO_CHART,
    RAIL_COLLAPSES_AT: TORPEDO_RAIL_COLLAPSES_AT,
    NARROW_MAX_WIDTH: TORPEDO_NARROW_MAX_WIDTH,
    chartNotes: ['.chart-axis-label'],
  },
  {
    id: 'aca',
    name: 'the ACA Subsidy Slope',
    html: 'aca/index.html',
    prefix: 'aca/',
    publicDir: 'public/aca',
    sheet: 'src/aca/styles/aca.css',
    cover: 'scripts/og-cover-aca.mjs',
    source: 'src/aca',
    App: AcaApp,
    PALETTE: ACA_PALETTE,
    CHART: ACA_CHART,
    RAIL_COLLAPSES_AT: ACA_RAIL_COLLAPSES_AT,
    NARROW_MAX_WIDTH: ACA_NARROW_MAX_WIDTH,
    chartNotes: [],
    reveal: () => fireEvent.click(screen.getByRole('radio', { name: 'Your effective rate' })),
  },
];
