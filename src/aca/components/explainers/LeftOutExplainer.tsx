import { Explainer } from '../../../shared/components/Explainer';

/** What the figures do not price, so a reader knows what to add back. */
export const LeftOutExplainer: React.FC = () => (
  <Explainer id="left-out-heading" title="Out of Scope">
    <ul>
      <li>
        <strong>Twelve identical months.</strong> The subsidy is calculated per month and changes
        for coverage that starts mid-year, a plan change, or someone turning 65.
      </li>
      <li>
        <strong>Rounding.</strong> The ACA rounds income down to a whole percent of the poverty line
        and your share to four places, so the settled figure differs from the smooth line by a few
        dollars.
      </li>
      <li>
        <strong>Where you live.</strong> The benchmark plan in the tool is a state average: your
        figure may differ.
      </li>
      <li>
        <strong>Other plans.</strong> The subsidy is the same whichever plan you buy: a bronze plan
        costs less and a gold plan costs more.
      </li>
      <li>
        <strong>Other coverage.</strong> An affordable employer plan, a spouse&rsquo;s plan,
        Medicare or Medicaid removes the subsidy.
      </li>
    </ul>
  </Explainer>
);
