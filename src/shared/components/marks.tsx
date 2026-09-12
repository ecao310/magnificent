import { CartesianGrid } from 'recharts';
import { SITE_CHART, SITE_PALETTE } from '../styles/palette';

/**
 * The two marks every plot on the site draws the same way, as plain
 * functions rather than components: recharts identifies its children by
 * element type, and a wrapper component would render as an unknown child.
 */

/**
 * The engraver's hatch under a curve: a diagonal hairline in the curve's own
 * blue, at `SITE_CHART.fill`. A pattern rather than a gradient because a
 * broadsheet's plot is drawn in lines, and because `the chart register` in
 * a page's chart suite reads the alpha back off it. Named by the caller, so
 * two hatches on one page — the cost page's and the rate page's — do not
 * share an id.
 */
export const hatch = (id: string) => (
  <defs>
    <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line
        x1="0"
        y1="0"
        x2="0"
        y2="6"
        stroke={SITE_PALETTE.accent}
        strokeWidth={SITE_CHART.hairline}
        strokeOpacity={SITE_CHART.fill}
      />
    </pattern>
  </defs>
);

/** The mesh behind the plot: hairlines across, in `--edge`, and none down. */
export const grid = () => (
  <CartesianGrid stroke={SITE_PALETTE.edge} strokeWidth={SITE_CHART.hairline} vertical={false} />
);
