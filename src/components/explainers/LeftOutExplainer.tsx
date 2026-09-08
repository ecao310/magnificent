/** What the figures do not price, so a reader knows what to add back. */
export const LeftOutExplainer: React.FC = () => (
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
          <strong>Where you live.</strong> The benchmark is a national average until you
          enter your own. New York and Vermont do not price by age; Alaska and Hawaii have
          higher poverty lines; Georgia&rsquo;s partial expansion and states with their own
          age curves are not modelled.
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
    </div>
  </details>
);
