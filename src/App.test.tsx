import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import {
  chooseAdults,
  chooseChildren,
  expansionSwitch,
  incomeField,
  pinPageYear,
  premiumField,
  readout,
  slide,
  typeMoney,
} from './test/pageFixtures';

/**
 * The page as a reader meets it: its landmarks, the household in the rail,
 * the sentence under the slider, and the notes and the reading list under
 * everything else.
 */

pinPageYear();

describe('the page', () => {
  it('leads with what the page is for rather than with the settings', () => {
    render(<App />);
    const hero = screen.getByRole('heading', { name: /the aca subsidy slope/i, level: 1 });
    const subtitle = hero.nextElementSibling as HTMLElement;
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).toHaveTextContent(
      'On a Marketplace plan you pay a set share of your household income for the benchmark plan — the second-cheapest silver plan in your area — and the subsidy pays the rest. The share rises with income, and at 400% of the poverty line the subsidy is gone.',
    );
    expect(subtitle).not.toHaveTextContent(/2025|2026/);
    expect(subtitle).not.toHaveTextContent(/\btax\b/i);
  });

  it('has a main, a footer, and the household, the chart and the figures in order', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 3)).toEqual(['Your household', 'What you pay', 'Your numbers at $50,000']);
    expect(screen.queryByText(/Step \d of \d/)).not.toBeInTheDocument();
    expect(
      screen.getByText(
        'Monthly cost of the benchmark plan after the subsidy, at every household income. Tap or hover the curve for the subsidy at any income.',
      ),
    ).toHaveClass('step-deck');
  });

  it('offers a skip link to the chart', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to the chart/i });
    expect(skip).toHaveAttribute('href', '#step-cost');
    expect(document.getElementById('step-cost')).toHaveAttribute('tabindex', '-1');
  });

  it('opens on a couple of fifty-year-olds on $50,000, at the national-average premium', () => {
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Two adults' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '0 children' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveAttribute('aria-valuetext', '50 years old');
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: /household income/i })).toHaveValue('50000');
    expect(incomeField()).toHaveValue(50_000);
    expect(premiumField()).toHaveValue(1_747);
    expect(expansionSwitch()).toBeChecked();
    expect(screen.queryByRole('button', { name: 'Use the average' })).not.toBeInTheDocument();
  });

  it('prices the household’s own point in one sentence under the slider', () => {
    render(<App />);
    // 7.94% of $50,000 is $3,970 a year, $331 a month; the subsidy is the other $16,994.
    expect(readout()).toHaveTextContent(
      'At $50,000 — 236% of the poverty line — you pay $331/mo and the subsidy pays $1,416/mo.',
    );
    expect(Array.from(readout().querySelectorAll('strong')).map((s) => s.textContent)).toEqual([
      '$331/mo',
      '$1,416/mo',
    ]);
  });

  it('says so over the cliff, under the Medicaid line, and in the gap', () => {
    render(<App />);
    slide(/household income/i, 90_000);
    expect(readout()).toHaveTextContent(
      'At $90,000 — 426% of the poverty line — you are $5,400 over the 400% line: no subsidy, full premium $1,747/mo.',
    );
    slide(/household income/i, 25_000);
    expect(readout()).toHaveTextContent(
      'At $25,000 — 118% of the poverty line — you are under the Medicaid line; the subsidy starts at $29,187.',
    );
    fireEvent.click(expansionSwitch());
    chooseAdults('One adult');
    slide(/household income/i, 15_000);
    expect(readout()).toHaveTextContent(
      'At $15,000 — 96% of the poverty line — no subsidy and no Medicaid; the subsidy starts at $15,650.',
    );
  });

  it('takes a typed income, and holds a half-typed one until the field is left', () => {
    render(<App />);
    typeMoney(/household income/i, 65_000);
    expect(readout()).toHaveTextContent(/^At \$65,000 — 307% of the poverty line/);
    expect(screen.getByRole('slider', { name: /household income/i })).toHaveValue('65000');
    // Past the end of the field: not priced until the field is left, then clamped.
    fireEvent.change(incomeField(), { target: { value: '999999' } });
    expect(readout()).toHaveTextContent(/^At \$65,000/);
    fireEvent.blur(incomeField());
    expect(readout()).toHaveTextContent(/^At \$200,000/);
  });

  it('drops the second age for one adult and halves the household', () => {
    render(<App />);
    chooseAdults('One adult');
    expect(screen.queryByRole('slider', { name: "Spouse's age" })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('50');
    expect(premiumField()).toHaveValue(873);
    // The poverty line for one person is $15,650: $50,000 is 319% of it.
    expect(readout()).toHaveTextContent(/319% of the poverty line/);
    expect(screen.getByText(/one adult, aged 50/)).toHaveClass('answer-subline');
  });

  it('names the ages a couple has, and reprices the benchmark for them', () => {
    render(<App />);
    slide(/^spouse's age$/i, 62);
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveAttribute(
      'aria-valuetext',
      '62 years old',
    );
    // 1.786 + 2.873 = 4.659 units × $489.045 = $2,278.46.
    expect(premiumField()).toHaveValue(2_278);
    expect(screen.getByText(/a couple, aged 50 and 62/)).toHaveClass('answer-subline');
  });

  it('counts the children on the strip and moves the poverty line with them', () => {
    render(<App />);
    expect(screen.getAllByRole('radio', { name: /child/ })).toHaveLength(6);
    chooseChildren(2);
    expect(screen.getByRole('radio', { name: '2 children' })).toBeChecked();
    // Four people: $21,150 + 2 × $5,500 = $32,150, and $50,000 is 156% of it.
    expect(readout()).toHaveTextContent(/156% of the poverty line/);
    expect(premiumField().valueAsNumber).toBeGreaterThan(1_747);
    expect(
      screen.getByText('Each child raises the poverty line by about $5,500 and adds a child’s premium.'),
    ).toHaveClass('field-note');
  });

  it('takes a benchmark premium typed in, and offers the average back', () => {
    render(<App />);
    expect(premiumField()).toHaveAccessibleDescription(
      'Prefilled with the 2026 national average for these ages. Your Marketplace quotes your area’s figure.',
    );
    typeMoney(/benchmark plan premium/i, 1_000);
    expect(premiumField()).toHaveValue(1_000);
    // Under the line what you pay is a share of income, so it does not move; the subsidy does.
    expect(readout()).toHaveTextContent(/you pay \$331\/mo and the subsidy pays \$669\/mo/);
    const reset = screen.getByRole('button', { name: 'Use the average' });
    expect(reset).toHaveClass('reset-button');
    fireEvent.click(reset);
    expect(premiumField()).toHaveValue(1_747);
    expect(screen.queryByRole('button', { name: 'Use the average' })).not.toBeInTheDocument();
    // Past the top of the field: clamped when the field is left.
    typeMoney(/benchmark plan premium/i, 9_000);
    expect(premiumField()).toHaveValue(6_000);
  });

  it('moves the floor with the expansion switch', () => {
    render(<App />);
    expect(
      screen.getByText(
        '40 states and DC have. If yours has, the subsidy starts at 138% of the poverty line; otherwise at 100%.',
      ),
    ).toHaveClass('field-note');
    fireEvent.click(expansionSwitch());
    expect(expansionSwitch()).not.toBeChecked();
    slide(/household income/i, 25_000);
    expect(readout()).toHaveTextContent(/you pay \$/);
    expect(readout()).not.toHaveTextContent(/Medicaid/);
  });

  it('reads a household out of the link and notes what it adjusted', () => {
    window.history.replaceState(null, '', '/?adults=1&age=80&income=30000');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'One adult' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('64');
    expect(screen.getByRole('slider', { name: /household income/i })).toHaveValue('30000');
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent('Some settings in this link were out of range and were adjusted:');
    expect(
      within(note).getByText(
        'The link asked for an age of 80; the most is 64 — at 65 Medicare takes over and the subsidy ends. Set to 64.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(note).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists five notes after the figures, and five readings in the footer', () => {
    render(<App />);
    const notes = Array.from(document.querySelectorAll('.notes-section details.explainer'));
    expect(notes).toHaveLength(5);
    expect(notes.map((n) => n.querySelector('h3')?.textContent)).toEqual([
      'How the subsidy is figured',
      'The slope: why 8% of income costs 17% of the next dollar',
      'The 400% cliff, back since 2026',
      'The Medicaid line and the cost-sharing tiers',
      'What is left out',
    ]);
    const answer = document.getElementById('answer') as HTMLElement;
    expect(answer.compareDocumentPosition(notes[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const reading = screen.getByRole('contentinfo').querySelector('.reading') as HTMLElement;
    expect(within(reading).getAllByRole('link')).toHaveLength(5);
    expect(within(reading).queryByText(/r\/financialindependence/)).not.toBeInTheDocument();
  });

  it('closes on the disclaimer, and nothing about tax', () => {
    render(<App />);
    const footer = screen.getByRole('contentinfo');
    expect(footer).toHaveTextContent(
      'Educational only; not insurance, tax or financial advice. Figures are modelled from published HHS, IRS and CMS numbers and a national-average premium unless you enter your own.',
    );
    expect(document.body).not.toHaveTextContent(/this page|the curve above|see the note|MAGI|8962|1040/);
  });
});
