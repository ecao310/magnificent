import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';
import {
  INCOME,
  chooseAdults,
  chooseChart,
  chooseChildren,
  chooseState,
  pinPageYear,
  slide,
  typeMoney,
} from './test/pageFixtures';

/**
 * The rate chart's section as a reader meets it, once chosen: its own
 * figures and its own notes.
 */

pinPageYear();

/** The page, with the rate chart chosen. */
const renderRate = (): void => {
  render(<App />);
  chooseChart('Your effective rate');
};

/** One of the four figures under the rate chart, by its label. */
const figure = (name: string): HTMLElement => {
  const block = document.getElementById('answer') as HTMLElement;
  const dt = within(block).getByText(name, { selector: '.answer-figure dt' });
  return dt.parentElement as HTMLElement;
};

describe('the rate section', () => {
  it('takes the cost chart’s place, headed by its own figures for the same household', () => {
    renderRate();
    expect(screen.getByRole('heading', { name: 'Your effective rate', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'What you pay', level: 2 })).not.toBeInTheDocument();
    const heading = screen.getByRole('heading', { name: 'Your numbers at $50,000', level: 2 });
    expect(heading.nextElementSibling).toHaveClass('answer-subline');
    expect(heading.nextElementSibling).toHaveTextContent('married filing jointly');
    expect(document.querySelectorAll('#answer .answer-figure')).toHaveLength(4);
    expect(document.querySelector('#answer .answer-share')).not.toBeNull();
  });

  it('prices the opening household as a joint return', () => {
    renderRate();
    // $1,780 of tax and $3,970 of premium on $50,000.
    expect(figure('All in')).toHaveTextContent('11.5%');
    expect(figure('Federal income tax')).toHaveTextContent('$1,780');
    expect(figure('The plan’s share of income')).toHaveTextContent('7.9%');
    expect(figure('The plan’s share of income')).toHaveTextContent('$331/mo');
    expect(figure('Each extra $1 of income costs')).toHaveTextContent('10.0¢ in income tax');
  });

  it('says under the Medicaid line that income tax is all there is', () => {
    renderRate();
    slide(INCOME, 25_000);
    expect(figure('All in')).toHaveTextContent('tax alone');
    expect(figure('The plan’s share of income')).toHaveTextContent('Medicaid');
  });

  it('files one adult single, and one adult with children as head of household', () => {
    renderRate();
    chooseAdults('One adult');
    expect(document.querySelector('#answer .answer-subline')).toHaveTextContent('filing single');
    chooseChildren(2);
    expect(document.querySelector('#answer .answer-subline')).toHaveTextContent('head of household');
  });

  it('prices the full premium over the 400% line', () => {
    renderRate();
    typeMoney(INCOME, 90_000);
    expect(figure('The plan’s share of income')).toHaveTextContent('23.3%');
    expect(figure('The plan’s share of income')).toHaveTextContent('over the 400% line');
    expect(figure('Each extra $1 of income costs')).toHaveTextContent('no subsidy left to lose');
    // $20,964 of premium and $6,440 of tax on $90,000.
    expect(figure('All in')).toHaveTextContent('30.4%');
  });

  it('leaves the coverage gap as a gap', () => {
    renderRate();
    chooseState('TX');
    typeMoney(INCOME, 15_000);
    expect(figure('The plan’s share of income')).toHaveTextContent('None');
    expect(figure('The plan’s share of income')).toHaveTextContent('full premium would be');
  });

  it('brings its own notes: how the rate is figured, the effective rate, and what is left out on both sides', () => {
    renderRate();
    const headings = (): string[] =>
      Array.from(document.querySelectorAll('.notes-section .explainer h3')).map((h) => h.textContent ?? '');
    expect(headings()).toEqual([
      'How the rate is figured',
      'Effective Rate',
      'What is left out',
    ]);
    fireEvent.click(screen.getByText('How the rate is figured'));
    expect(document.querySelectorAll('.notes-section .explainer')[0]).toHaveTextContent('$17,800');
    fireEvent.click(screen.getByText('What is left out'));
    const leftOut = document.querySelectorAll('.notes-section .explainer')[2];
    expect(leftOut).toHaveTextContent('Payroll and self-employment tax');
    expect(leftOut).toHaveTextContent('Twelve identical months');
    // Back on the cost chart, the same note keeps to the subsidy's side.
    chooseChart('What you pay');
    expect(headings()).toHaveLength(5);
    fireEvent.click(screen.getByText('What is left out'));
    const costLeftOut = document.querySelectorAll('.notes-section .explainer')[4];
    expect(costLeftOut).toHaveTextContent('Twelve identical months');
    expect(costLeftOut).not.toHaveTextContent('Payroll');
  });
});
