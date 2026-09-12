/**
 * The width under which the site is one column: the rail folds to a row
 * under the masthead, and the chart, the figures and the notes run under it.
 * The same 1100 as the stylesheet's collapse, and `the fold` in
 * guards/styles.test.tsx holds the two to one number.
 */
export const RAIL_COLLAPSES_AT = 1100;
export const RAIL_FOLD_QUERY = `(max-width: ${RAIL_COLLAPSES_AT}px)`;
