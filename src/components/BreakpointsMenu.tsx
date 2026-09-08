import { useRef, useState } from 'react';
import { PTC_CLIFF_PERCENT } from '../lib/tax';
import { useDismissable } from '../hooks/useDismissable';

export interface BreakpointsMenuProps {
  /** How many lines the plot is actually drawing: marks on the chart, not ticked boxes. */
  linesShown: number;
  showEdges: boolean;
  onShowEdges: (show: boolean) => void;
  showCsr: boolean;
  onShowCsr: (show: boolean) => void;
  /** What the floor is called for this household: "138% FPL" or "100% FPL". */
  floorLabel: string;
  /** Whether this year has a 400% line to offer at all. */
  hasCliff: boolean;
}

/**
 * The chart's own settings, and the only control here that changes what is
 * drawn rather than what is priced. It rides in the figure's top-right corner
 * rather than on a row above it, and not down among the sliders, because
 * those all move the household and this one does not touch it.
 */
export const BreakpointsMenu: React.FC<BreakpointsMenuProps> = ({
  linesShown,
  showEdges,
  onShowEdges,
  showCsr,
  onShowCsr,
  floorLabel,
  hasCliff,
}) => {
  const [open, setOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useDismissable(open, () => setOpen(false), container, trigger);

  return (
    <div className="chart-lines" ref={container}>
      <button
        type="button"
        ref={trigger}
        className="chart-lines-button"
        aria-expanded={open}
        aria-controls="slope-lines"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
      >
        Breakpoints
        {linesShown > 0 ? ` (${linesShown})` : ''}
      </button>
      {open && (
        <div className="chart-lines-panel" id="slope-lines">
          <fieldset className="chart-lines-group">
            <legend>Marketplace breakpoints</legend>
            <label className="checkbox-option chart-lines-option">
              <input
                type="checkbox"
                checked={showEdges}
                onChange={(e) => onShowEdges(e.target.checked)}
              />
              <span className="chart-key-swatch chart-lines-swatch" aria-hidden="true" />
              <span>
                The credit&apos;s edges: the {floorLabel} floor
                {hasCliff ? ` and the ${PTC_CLIFF_PERCENT * 100}% cliff` : ''}
              </span>
            </label>
            <label className="checkbox-option chart-lines-option">
              <input
                type="checkbox"
                checked={showCsr}
                onChange={(e) => onShowCsr(e.target.checked)}
              />
              <span
                className="chart-key-swatch chart-lines-swatch chart-key-swatch-csr"
                aria-hidden="true"
              />
              <span>Cost-sharing tiers at 150%, 200% and 250%</span>
            </label>
          </fieldset>
        </div>
      )}
    </div>
  );
};
