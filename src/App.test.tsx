import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import {
  INCOME,
  chooseAdults,
  chooseChart,
  chooseChildren,
  chooseState,
  incomeField,
  pinPageYear,
  premiumField,
  slide,
  typeMoney,
} from './test/pageFixtures';

/**
 * The page as a reader meets it: its landmarks, the household in the rail,
 * the controls under the chart, and the notes and the reading list under
 * everything else. What the page says is not asserted here — only what it
 * has, and what its controls hold.
 */

pinPageYear();

describe('the page', () => {
  it('leads with what the page is for rather than with the settings', () => {
    render(<App />);
    const hero = screen.getByRole('heading', { name: /the aca subsidy slope/i, level: 1 });
    const subtitle = hero.nextElementSibling as HTMLElement;
    expect(subtitle).toHaveClass('subtitle');
  });

  it('offers the two charts above the chart, the cost chart chosen, and swaps them in place', () => {
    render(<App />);
    const chooser = screen.getByRole('group', { name: 'Chart' });
    const choices = within(chooser).getAllByRole('radio');
    expect(choices.map((c) => c.getAttribute('aria-label'))).toEqual(['What you pay', 'Your effective rate']);
    expect(choices[0]).toBeChecked();
    expect(choices[0]).toHaveAccessibleDescription('The benchmark plan after the subsidy');
    expect(choices[1]).toHaveAccessibleDescription('Income tax and premium as one rate');
    // Directly above the chart it chooses, in the reading column.
    const flow = document.querySelector('.flow') as HTMLElement;
    expect(flow.firstElementChild).toBe(chooser);
    expect(chooser.nextElementSibling).toHaveAttribute('id', 'step-cost');
    expect(document.getElementById('step-rate')).toBeNull();
    expect(screen.getByRole('link', { name: /skip to the chart/i })).toHaveAttribute('href', '#step-cost');

    chooseChart('Your effective rate');
    expect(choices[1]).toBeChecked();
    expect(document.getElementById('step-cost')).toBeNull();
    expect(chooser.nextElementSibling).toHaveAttribute('id', 'step-rate');
    expect(screen.getByRole('heading', { name: 'Your effective rate', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /skip to the chart/i })).toHaveAttribute('href', '#step-rate');
    // The choice is where the reader is standing, so it goes in the fragment, without a reload.
    expect(window.location.hash).toBe('#step-rate');
    chooseChart('What you pay');
    expect(window.location.hash).toBe('');
    expect(document.getElementById('step-cost')).not.toBeNull();
  });

  it('opens on the chart the fragment names, and keeps the income across a swap', () => {
    window.history.replaceState(null, '', '/?income=65000#step-rate');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'Your effective rate' })).toBeChecked();
    expect(document.getElementById('step-rate')).not.toBeNull();
    expect(incomeField()).toHaveValue(65_000);
    slide(INCOME, 70_000);
    chooseChart('What you pay');
    expect(incomeField()).toHaveValue(70_000);
    expect(screen.getByRole('slider', { name: INCOME })).toHaveValue('70000');
    expect(window.location.search).toBe('?income=65000');
  });

  it('has a main, a footer, and the household, the chart and the figures in order', () => {
    render(<App />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThanOrEqual(3);
    const household = document.getElementById('step-household') as HTMLElement;
    const cost = document.getElementById('step-cost') as HTMLElement;
    const answer = document.getElementById('answer') as HTMLElement;
    expect(household.compareDocumentPosition(cost) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(cost.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveValue('50');
    expect(screen.getByRole('slider', { name: INCOME })).toHaveValue('50000');
    expect(incomeField()).toHaveValue(50_000);
    expect(premiumField()).toHaveValue(1_747);
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('');
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Use the average' })).not.toBeInTheDocument();
  });

  it('lists the fifty states and the District after the national average', () => {
    render(<App />);
    const options = within(screen.getByRole('combobox', { name: 'State' })).getAllByRole('option');
    expect(options).toHaveLength(52);
    expect(options[0]).toHaveValue('');
    expect(options[1]).toHaveValue('AL');
    expect(options[51]).toHaveValue('WY');
  });

  it('reprices the benchmark for a state, and back for the national average', () => {
    render(<App />);
    chooseState('TX');
    // Texas at 40 is $661; two fifty-year-olds are 2 × 1.786 / 1.278 of that.
    expect(premiumField()).toHaveValue(1_847);
    chooseState('');
    expect(premiumField()).toHaveValue(1_747);
  });

  it('prices a state with a curve of its own on that curve', () => {
    render(<App />);
    chooseState('MA');
    // Massachusetts at 40 is $494; two fifty-year-olds are 2 × 1.741 / 1.393 of that on its 2:1 curve.
    expect(premiumField()).toHaveValue(Math.round((494 / 1.393) * 2 * 1.741));
    expect(screen.getByText(/on Massachusetts’s own age curve/)).toBeInTheDocument();
  });

  it('prices a flat state flat', () => {
    render(<App />);
    chooseState('VT');
    expect(premiumField()).toHaveValue(2_598);
    slide(/^spouse's age$/i, 62);
    expect(premiumField()).toHaveValue(2_598);
  });

  it('keeps a typed premium across a change of state, and offers the state’s average back', () => {
    render(<App />);
    chooseState('TX');
    typeMoney(/benchmark plan premium/i, 1_000);
    chooseState('FL');
    expect(premiumField()).toHaveValue(1_000);
    fireEvent.click(screen.getByRole('button', { name: 'Use the average' }));
    // Florida at 40 is $683.
    expect(premiumField()).toHaveValue(Math.round((683 / 1.278) * 2 * 1.786));
  });

  it('takes a typed income, and holds a half-typed one until the field is left', () => {
    render(<App />);
    const slider = screen.getByRole('slider', { name: INCOME });
    typeMoney(INCOME, 65_000);
    expect(slider).toHaveValue('65000');
    // Past the end of the field: not priced until the field is left, then clamped.
    fireEvent.change(incomeField(), { target: { value: '999999' } });
    expect(slider).toHaveValue('65000');
    fireEvent.blur(incomeField());
    expect(slider).toHaveValue('200000');
  });

  it('drops the second age for one adult and halves the household', () => {
    render(<App />);
    chooseAdults('One adult');
    expect(screen.queryByRole('slider', { name: "Spouse's age" })).not.toBeInTheDocument();
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('50');
    expect(premiumField()).toHaveValue(873);
  });

  it('reprices the benchmark for a couple’s second age', () => {
    render(<App />);
    slide(/^spouse's age$/i, 62);
    expect(screen.getByRole('slider', { name: "Spouse's age" })).toHaveValue('62');
    // 1.786 + 2.873 = 4.659 units × $489.045 = $2,278.46.
    expect(premiumField()).toHaveValue(2_278);
  });

  it('counts the children on the strip and prices them into the benchmark', () => {
    render(<App />);
    expect(screen.getAllByRole('radio', { name: /child/ })).toHaveLength(6);
    chooseChildren(2);
    expect(screen.getByRole('radio', { name: '2 children' })).toBeChecked();
    expect(premiumField().valueAsNumber).toBeGreaterThan(1_747);
  });

  it('takes a benchmark premium typed in, and offers the average back', () => {
    render(<App />);
    typeMoney(/benchmark plan premium/i, 1_000);
    expect(premiumField()).toHaveValue(1_000);
    const reset = screen.getByRole('button', { name: 'Use the average' });
    expect(reset).toHaveClass('reset-button');
    fireEvent.click(reset);
    expect(premiumField()).toHaveValue(1_747);
    expect(screen.queryByRole('button', { name: 'Use the average' })).not.toBeInTheDocument();
    // Past the top of the field: clamped when the field is left.
    typeMoney(/benchmark plan premium/i, 9_000);
    expect(premiumField()).toHaveValue(6_000);
  });

  it('reads a household out of the link and notes what it adjusted', () => {
    window.history.replaceState(null, '', '/?adults=1&age=80&income=30000&state=tx');
    render(<App />);
    expect(screen.getByRole('radio', { name: 'One adult' })).toBeChecked();
    expect(screen.getByRole('combobox', { name: 'State' })).toHaveValue('TX');
    expect(screen.getByRole('slider', { name: 'Age' })).toHaveValue('64');
    expect(screen.getByRole('slider', { name: INCOME })).toHaveValue('30000');
    const note = screen.getByRole('status');
    expect(within(note).getAllByRole('listitem')).toHaveLength(1);
    fireEvent.click(within(note).getByRole('button', { name: 'Dismiss' }));
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('lists five notes after the figures, and five readings in the footer', () => {
    render(<App />);
    const notes = Array.from(document.querySelectorAll('.notes-section details.explainer'));
    expect(notes).toHaveLength(5);
    const answer = document.getElementById('answer') as HTMLElement;
    expect(answer.compareDocumentPosition(notes[0]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const reading = screen.getByRole('contentinfo').querySelector('.reading') as HTMLElement;
    expect(within(reading).getAllByRole('link')).toHaveLength(5);
  });
});
