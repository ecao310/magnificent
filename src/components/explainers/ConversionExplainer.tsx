import type { BlockCost, PtcAssessment } from '../../lib/tax';
import { formatCurrency, formatPercent } from '../../lib/format';

export interface ConversionExplainerProps {
  /** The reader's block, priced as a Roth conversion whatever the strip says. */
  block: BlockCost;
  here: PtcAssessment;
  /** What the dollar past the line costs this household, or null without a line. */
  cliffCost: number | null;
}

/** A Roth conversion against the credit: the rate to beat, and when to cross the line on purpose. */
export const ConversionExplainer: React.FC<ConversionExplainerProps> = ({ block, here, cliffCost }) => (
  <details className="explainer">
    <summary>
      <h3 id="conversion-heading">Roth conversions against the credit</h3>
    </summary>
    <div className="explainer-content">
      <p>
        <strong>The comparison.</strong> A conversion pays tax now so that the same
        dollars, and everything they earn, come out untaxed later. It is worth doing
        when the rate paid now is under the rate those dollars would face later
        &mdash; and &ldquo;the rate paid now&rdquo; is everything the conversion costs,
        not the bracket it lands in. On the Marketplace that means the bracket plus
        the credit given back.
      </p>
      <p>
        <strong>What it costs this year.</strong>{' '}
        {block.added > 0 ? (
          <>
            Converting {formatCurrency(block.added)} on top of {formatCurrency(block.from)}{' '}
            costs <strong>{formatCurrency(block.total)}</strong>: {formatCurrency(block.tax)}{' '}
            of federal tax and {formatCurrency(block.credit)} of premium tax credit given
            back &mdash; <strong>{block.rate !== null ? formatPercent(block.rate) : '—'}</strong>{' '}
            all in. That is the rate to beat: the conversion comes out ahead only if these
            dollars would otherwise be taxed above it when withdrawn.
            {block.crossesCliff &&
              ' The block crosses the 400% line, so the whole credit is in that figure.'}
          </>
        ) : (
          <>
            Move the slider under the chart to size a conversion; at{' '}
            {formatCurrency(Math.round(here.magi))} the next dollar costs{' '}
            {formatPercent(here.slope)} in credit before any tax.
          </>
        )}
      </p>
      <p>
        <strong>What &ldquo;later&rdquo; looks like.</strong> After 72 or so, required
        minimum distributions set the withdrawal rate whether the household wants the
        income or not, and they land on top of Social Security &mdash; where each dollar
        of ordinary income can drag up to 85 cents of the benefit into the tax base
        behind it and turn a 12% bracket into 22.2%. Medicare&apos;s income-related
        premiums start two years after income crosses their first line, and a
        surviving spouse files single on the same accounts. A household with a large
        IRA and a modest pension often finds its later rate is well above 20%, and a
        conversion at 17% all in is cheap by comparison. The page this one follows
        draws that later rate for the same reader, at the foot of this page.
      </p>
      <p>
        <strong>Crossing the line on purpose.</strong> The cliff makes the marginal
        cost of the dollar past 400% enormous and the cost of every dollar after it
        zero in credit. So a household that means to convert a great deal is better
        off doing it in one year than in several: give up the credit once &mdash;{' '}
        {cliffCost !== null && cliffCost > 0
          ? `${formatCurrency(cliffCost)} at the line for this household, or the whole ${formatCurrency(
              Math.round(here.credit),
            )} from where it stands`
          : 'the year’s credit'}{' '}
        &mdash; and convert up through the 22% or 24% bracket while it is gone, then
        come back under the line the next year. Two years of a small conversion each
        cost the slope twice; one large year and one quiet year cost the credit once
        and the slope not at all.
      </p>
      <p>
        <strong>Stay under the standard deduction if you can.</strong> A household
        whose ordinary income is under the deduction pays no federal tax on a
        conversion up to it. The credit still takes its slice, but that is the whole
        price, and it is the cheapest conversion the household will ever make.
      </p>
    </div>
  </details>
);
