import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import { PAGE_COVERAGE_YEAR } from './lib/aca';
import { chooseAdults, pinPageYear, readout, scenarioRecap, slide } from './test/pageFixtures';

/** The page as a reader meets it: its landmarks, its two steps, the recap, and the sentence under the slider. */

pinPageYear();

describe('the page', () => {
  it('leads with what the page is for rather than with the settings', () => {
    render(<App />);
    const hero = screen.getByRole('heading', { name: /the aca subsidy slope/i, level: 1 });
    const subtitle = hero.nextElementSibling as HTMLElement;
    expect(subtitle).toHaveClass('subtitle');
    expect(subtitle).toHaveTextContent(/subsidy/);
    expect(subtitle).toHaveTextContent(/400% of the poverty line/);
    expect(subtitle).not.toHaveTextContent(/2025|2026/);
    expect(subtitle).not.toHaveTextContent(/\btax\b/i);
  });

  it('has a main, a footer, and two steps in order', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings.slice(0, 3)).toEqual(['Your household', 'What the plan costs', 'What this year costs']);
    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Step 2 of 2')).toBeInTheDocument();
  });

  it('offers a skip link to the chart', () => {
    render(<App />);
    const skip = screen.getByRole('link', { name: /skip to the chart/i });
    expect(skip).toHaveAttribute('href', '#step-cost');
    expect(document.getElementById('step-cost')).toHaveAttribute('tabindex', '-1');
  });

  it('opens on the thread’s household: a couple of fifty-year-olds on $50,000', () => {
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Two adults' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Your age' })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: /household income/i })).toHaveValue('50000');
    expect(scenarioRecap()).toHaveTextContent(
      `One year’s household: ${PAGE_COVERAGE_YEAR} coverage for a couple, both 50, on a benchmark silver plan at $1,747 a month. The poverty line for 2 people is $21,150.`,
    );
  });

  it('prices the household’s own point under the slider, with the thread’s $10,000', () => {
    render(<App />);
    // 7.94% of $50,000 is $3,970 a year, $331 a month; the subsidy is the other $16,994.
    expect(readout()).toHaveTextContent(
      /At \$50,000 of household income \(236% of the poverty line\) this household pays \$331 a month for the benchmark plan — 7\.94% of its income — and the subsidy pays the other \$1,416: \$16,994 a year\./,
    );
    expect(readout()).toHaveTextContent(
      /The next dollar of income costs 16\.64¢ of subsidy; the next \$10,000 costs \$1,709\./,
    );
  });

  it('says so when the household is over the line, and when it is on Medicaid', () => {
    render(<App />);
    slide(/household income/i, 90_000);
    expect(readout()).toHaveTextContent(/pays \$1,747 a month for the benchmark plan — the whole premium\./);
    expect(readout()).toHaveTextContent(/no subsidy over the 400% line, and coming back under it takes \$5,400 less income/);
    slide(/household income/i, 25_000);
    expect(readout()).toHaveTextContent(/under the floor: it is eligible for Medicaid, and the Marketplace subsidy begins at \$29,187\./);
  });

  it('names the cliff in the next $10,000 when it is crossed', () => {
    render(<App />);
    slide(/household income/i, 80_000);
    expect(readout()).toHaveTextContent(/the next \$10,000 costs \$[\d,]+, because it crosses the 400% line\./);
  });

  it('drops the second age for one adult and halves the household', () => {
    render(<App />);
    chooseAdults('One adult');
    expect(screen.queryByRole('slider', { name: "Spouse's age" })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('50');
    expect(scenarioRecap()).toHaveTextContent(/for one adult, aged 50/);
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
    // What the household pays under the line is a share of income, so it does not move.
    expect(readout()).toHaveTextContent(/pays \$331 a month/);
    fireEvent.click(screen.getByRole('checkbox', { name: /set the benchmark premium myself/i }));
    expect(screen.getByRole('slider', { name: /benchmark silver premium/i })).toBeDisabled();
    expect(screen.getByText('At the defaults')).toBeInTheDocument();
  });

  it('moves the floor with the expansion switch', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('checkbox', { name: /my state expanded medicaid/i }));
    expect(screen.getByText('No expansion')).toBeInTheDocument();
    expect(scenarioRecap()).toHaveTextContent(/a state that did not expand Medicaid/);
    slide(/household income/i, 25_000);
    expect(readout()).toHaveTextContent(/pays \$/);
    expect(readout()).not.toHaveTextContent(/Medicaid/);
  });

  it('reads a household out of the link and notes what it could not honour', () => {
    window.history.replaceState(null, '', '/?adults=1&age=80&income=30000');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'One adult' })).toBeChecked();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('64');
    expect(screen.getByRole('slider', { name: /household income/i })).toHaveValue('30000');
    const note = screen.getByRole('status');
    expect(note).toHaveTextContent(/could not show/);
    expect(within(note).getByText(/Medicare takes over/)).toBeInTheDocument();
    fireEvent.click(within(note).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists six notes under the chart and the reading list in the footer', () => {
    render(<App />);
    expect(document.querySelectorAll('details.explainer')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: /the 400% cliff, back since 2026/i })).toBeInTheDocument();
    const reading = screen.getByRole('contentinfo').querySelector('.reading') as HTMLElement;
    expect(within(reading).getAllByRole('link')).toHaveLength(6);
    expect(within(reading).getByText(/r\/financialindependence/)).toBeInTheDocument();
  });
});
