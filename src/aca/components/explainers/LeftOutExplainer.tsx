export interface LeftOutExplainerProps {
  /** Whether the rate chart is showing, and so whether the return's side is on the page. */
  tax?: boolean;
}

/**
 * What the figures do not price, so a reader knows what to add back: the
 * subsidy's side, and — under the rate chart, which adds the return — the
 * return's side after it.
 */
export const LeftOutExplainer: React.FC<LeftOutExplainerProps> = ({ tax = false }) => (
  <details className="explainer">
    <summary>
      <h3 id="left-out-heading">What is left out</h3>
    </summary>
    <div className="explainer-content">
      <ul>
        <li>
          <strong>Twelve identical months.</strong> The subsidy is figured month by month;
          coverage that starts mid-year, a plan change, or someone turning 65 changes it by
          the month.
        </li>
        <li>
          <strong>Rounding.</strong> The Marketplace rounds income down to a whole percent of
          the poverty line and your share to four places, so the settled figure differs from
          the smooth line by a few dollars.
        </li>
        <li>
          <strong>Where you live.</strong> The benchmark is a state average: your county&rsquo;s figure differs. New York and
          Vermont are priced flat, since they do not price by age. Georgia&rsquo;s partial
          expansion is not modelled.
        </li>
        <li>
          <strong>Other plans.</strong> The subsidy is the same whichever plan you buy: a
          bronze plan costs less than the figures here, a gold plan more.
        </li>
        <li>
          <strong>Other coverage.</strong> An affordable employer plan, a spouse&rsquo;s
          plan, Medicare or Medicaid removes the subsidy.
        </li>
      </ul>
      {tax && (
        <>
          <p>
            <strong>On the return&rsquo;s side</strong>, the tax in the chart is the federal
            return with nothing unusual on it, and the income is taken as all ordinary.
          </p>
          <ul>
            <li>
              <strong>Payroll and self-employment tax.</strong> Wages carry 7.65% in Social
              Security and Medicare tax, and self-employment income about twice that. Neither
              is in the figure; a wage earner can add 7.65 points, a freelancer more.
            </li>
            <li>
              <strong>State and local income tax</strong>, which runs from nothing to over 10%.
            </li>
            <li>
              <strong>Refundable credits.</strong> The child tax credit is taken only against tax
              owed; the refundable part of it, and the earned income credit, are left out, so
              the rate is never negative. A family with children and a low income gets more
              back than the chart shows.
            </li>
            <li>
              <strong>Anything but the standard deduction.</strong> Itemized deductions, the
              deduction for self-employed health insurance premiums, retirement and HSA
              contributions and the rest all lower taxable income &mdash; and some of them lower
              the income the subsidy is measured on too, which moves the premium as well.
            </li>
            <li>
              <strong>Capital gains and qualified dividends</strong>, which are taxed at their own
              lower rates; every dollar here is taxed as ordinary income.
            </li>
            <li>
              <strong>The return itself.</strong> Two adults file jointly, one adult with
              children files as head of household, and every child on the plan is under 17
              and at home. A household that files differently has a different deduction and
              different brackets.
            </li>
          </ul>
        </>
      )}
    </div>
  </details>
);
