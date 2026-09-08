import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { PAGE_TAX_YEAR } from './lib/tax';
import {
  chooseFilingStatus,
  chooseKind,
  pinPageYear,
  readout,
  scenarioRecap,
  slide,
} from './test/pageFixtures';

/**
 * The page as a reader meets it: its landmarks, its two steps, the recap that
 * names the household, and the sentence that prices the block.
 */

pinPageYear();

describe('the page', () => {
  it('leads with what the page is for rather than with the settings', () => {
    render(<App />);
    const hero = screen.getByRole('heading', { name: /income taxes in early retirement/i, level: 1 });
    const subtitle = hero.nextElementSibling as HTMLElement;
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).toHaveTextContent(/premium tax credit/);
    expect(subtitle).toHaveTextContent(/400% of the poverty line/);
    expect(subtitle).not.toHaveTextContent(/2025|2026/);
  });

  it('has a main, a footer, and two steps in order', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 3)).toEqual(['Your household', 'The subsidy slope', 'What this year costs']);
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('offers a skip link to the chart', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to the chart/i });
    expect(skip).toHaveAttribute('href', '#step-slope');
    expect(document.getElementById('step-slope')).toHaveAttribute('tabindex', '-1');
  });

  it('opens on the thread’s household: a couple of fifty-year-olds on $50,000, harvesting $10,000', () => {
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Married Filing Jointly' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Your age' })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: /ordinary income/i })).toHaveValue('10000');
    expect(screen.getByRole('slider', { name: /qualified dividends/i })).toHaveValue('40000');
    expect(screen.getByRole('slider', { name: /amount to add/i })).toHaveValue('10000');
    expect(screen.getByRole('radio', { name: 'Harvested gain' })).toBeChecked();
    expect(scenarioRecap()).toHaveTextContent(
      `One year’s household: ${PAGE_TAX_YEAR}, a married couple filing jointly, both 50, with $10,000 of ordinary income and $40,000 of qualified dividends and gains, on a benchmark silver plan at $1,747 a month. The poverty line for 2 people is $21,150.`,
    );
  });

  it('prices the thread’s example under the slider: about $1,709, 17%', () => {
    render(<App />);
    expect(readout()).toHaveTextContent(
      /Adding \$10,000 as a harvested gain, from \$50,000 to \$60,000 of household income \(284% of the poverty line\), costs 17\.09% of it — \$1,709, all of it premium tax credit given back and none of it federal tax\./,
    );
    expect(readout()).toHaveTextContent(/As a Roth conversion it would cost \$1,709, 17\.09%\./);
  });

  it('prices the next dollar when nothing is added', () => {
    render(<App />);
    slide(/amount to add/i, 0);
    expect(readout()).toHaveTextContent(
      /At \$50,000 of household income \(236% of the poverty line\) the next dollar as a harvested gain costs 16\.64%: 0% in federal tax and 16\.64% in credit given back\. As a Roth conversion, 16\.64%\./,
    );
  });

  it('re-prices the block when the kind changes and the deduction runs out', () => {
    render(<App />);
    slide(/ordinary income/i, 40_000);
    slide(/amount to add/i, 10_000);
    chooseKind('Roth conversion');
    // Ordinary $50,000: taxable $17,800 → 10% on the whole block, plus the credit.
    expect(readout()).toHaveTextContent(/Adding \$10,000 as a Roth conversion, from \$80,000 to \$90,000/);
    expect(readout()).toHaveTextContent(/\$1,000 of federal tax/);
    expect(readout()).toHaveTextContent(/The block crosses the 400% line/);
  });

  it('drops the spouse’s slider on a single return and halves the household', () => {
    render(<App />);
    chooseFilingStatus('Single');
    expect(screen.queryByRole('slider', { name: "Spouse's age" })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('50');
    expect(scenarioRecap()).toHaveTextContent(/a single filer, aged 50/);
    expect(scenarioRecap()).toHaveTextContent(/benchmark silver plan at \$873 a month/);
    expect(scenarioRecap()).toHaveTextContent(/The poverty line for one person is \$15,650/);
  });

  it('names the ages a couple has, and the premium they set', () => {
    render(<App />);
    slide(/^spouse's age$/i, 62);
    expect(scenarioRecap()).toHaveTextContent(/aged 50 and 62/);
    // 1.786 + 2.873 = 4.659 units × $489.045 = $2,278.46.
    expect(scenarioRecap()).toHaveTextContent(/\$2,278 a month/);
  });

  it('lets the reader set the benchmark premium, and says so twice', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: /set the benchmark premium myself/i }));
    const premium = screen.getByRole('slider', { name: /benchmark silver premium/i });
    expect(premium).toBeEnabled();
    expect(premium).toHaveValue('1747');
    slide(/benchmark silver premium/i, 1_000);
    expect(screen.getByText(/Premium \$1,000\/mo/)).toBeInTheDocument();
    expect(scenarioRecap()).toHaveTextContent(/Plus a benchmark premium of \$1,000 a month, set by hand/);
    fireEvent.click(screen.getByRole('checkbox', { name: /set the benchmark premium myself/i }));
    expect(screen.getByRole('slider', { name: /benchmark silver premium/i })).toBeDisabled();
    expect(screen.getByText('At the defaults')).toBeInTheDocument();
  });

  it('moves the floor with the expansion switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: /my state expanded medicaid/i }));
    expect(screen.getByText('No expansion')).toBeInTheDocument();
    expect(scenarioRecap()).toHaveTextContent(/a state that did not expand Medicaid/);
    const floor = document.querySelector('.explainer-content');
    expect(floor).toBeTruthy();
  });

  it('reads a household out of the link and notes what it could not honour', () => {
    window.history.replaceState(null, '', '/?filing=single&age=80&ordinary=30000&kind=conversion');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Single' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('64');
    expect(screen.getByRole('slider', { name: /ordinary income/i })).toHaveValue('30000');
    expect(screen.getByRole('radio', { name: 'Roth conversion' })).toBeChecked();
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent(/could not show/);
    expect(within(note).getByText(/Medicare takes over/)).toBeInTheDocument();
    fireEvent.click(within(note).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists eight notes under the chart and the reading list in the footer', () => {
    render(<App />);
    const notes = document.querySelectorAll('details.explainer');
    expect(notes).toHaveLength(8);
    expect(screen.getByRole('heading', { name: /the 400% cliff, back since 2026/i })).toBeInTheDocument();
    const reading = screen.getByRole('contentinfo').querySelector('.reading') as HTMLElement;
    expect(within(reading).getAllByRole('link')).toHaveLength(7);
    expect(within(reading).getByText(/r\/financialindependence/)).toBeInTheDocument();
  });
});
