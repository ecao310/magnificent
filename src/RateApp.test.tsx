import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import RateApp from './RateApp';
import {
  chooseAdults,
  chooseChildren,
  chooseState,
  incomeField,
  pinPageYear,
  premiumField,
  slide,
  typeMoney,
} from './test/pageFixtures';

/**
 * The rate page as a reader meets it: the same rail and the same slider as
 * the cost page, and its own chart, figures and notes on top of them.
 */

pinPageYear();

const figure = (name: string): HTMLElement => {
  const dt = screen.getByText(name, { selector: '.answer-figure dt' });
  return dt.parentElement as HTMLElement;
};

describe('the rate page', () => {
  it('leads with its title and a way back to the cost page, household in hand', () => {
    render(<RateApp />);
    const hero = screen.getByRole('heading', { name: /the all-in rate/i, level: 1 });
    expect(hero.nextElementSibling).toHaveClass('subtitle');
    const back = screen.getByRole('link', { name: /back to the subsidy slope/i });
    expect(back).toHaveAttribute('href', '/');
    slide(/household income/i, 65_000);
    chooseState('TX');
    expect(back).toHaveAttribute('href', '/?income=65000&state=TX');
  });

  it('has a main, a footer, and the household, the chart and the figures in order', () => {
    render(<RateApp />);
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    const household = document.getElementById('step-household') as HTMLElement;
    const rate = document.getElementById('step-rate') as HTMLElement;
    const answer = document.getElementById('answer') as HTMLElement;
    expect(household.compareDocumentPosition(rate) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(rate.compareDocumentPosition(answer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole('link', { name: /skip to the chart/i })).toHaveAttribute('href', '#step-rate');
  });

  it('opens on the cost page’s household, priced as a joint return', () => {
    render(<RateApp />);
    expect(screen.getByRole('radio', { name: 'Two adults' })).toBeChecked();
    expect(incomeField()).toHaveValue(50_000);
    expect(premiumField()).toHaveValue(1_747);
    expect(screen.getByRole('heading', { name: 'Your numbers at $50,000', level: 2 })).toBeInTheDocument();
    expect(document.querySelector('.answer-subline')).toHaveTextContent('married filing jointly');
    expect(document.querySelectorAll('.answer-figure')).toHaveLength(4);
    // $1,780 of tax and $3,970 of premium on $50,000.
    expect(figure('All in')).toHaveTextContent('11.5%');
    expect(figure('Federal income tax')).toHaveTextContent('$1,780');
    expect(figure('Federal income tax')).toHaveTextContent('$32,200 standard deduction');
    expect(figure('Premium after subsidy')).toHaveTextContent('$331');
    expect(figure('Each extra $1 of income costs')).toHaveTextContent('10.0¢ in income tax');
  });

  it('reads the sentence under the slider in the page’s own terms', () => {
    render(<RateApp />);
    const readout = document.querySelector('.slider-readout') as HTMLElement;
    expect(readout).toHaveTextContent(/you pay 11\.5% all in: 3\.6% in income tax and 7\.9% for the plan/);
    slide(/household income/i, 25_000);
    expect(readout).toHaveTextContent(/under the Medicaid line/);
    expect(figure('All in')).toHaveTextContent('tax alone');
    expect(figure('Premium after subsidy')).toHaveTextContent('Medicaid');
  });

  it('files one adult single, and one adult with children as head of household', () => {
    render(<RateApp />);
    chooseAdults('One adult');
    expect(document.querySelector('.answer-subline')).toHaveTextContent('filing single');
    expect(figure('Federal income tax')).toHaveTextContent('$16,100 standard deduction');
    chooseChildren(2);
    expect(document.querySelector('.answer-subline')).toHaveTextContent('head of household');
    expect(figure('Federal income tax')).toHaveTextContent('$24,150 standard deduction');
    expect(figure('Federal income tax')).toHaveTextContent('child tax credit');
  });

  it('prices the full premium over the 400% line', () => {
    render(<RateApp />);
    typeMoney(/household income/i, 90_000);
    expect(figure('Premium after subsidy')).toHaveTextContent('$1,747');
    expect(figure('Premium after subsidy')).toHaveTextContent('over the 400% line');
    expect(figure('Each extra $1 of income costs')).toHaveTextContent('no subsidy left to lose');
    // $20,964 of premium and $6,440 of tax on $90,000.
    expect(figure('All in')).toHaveTextContent('30.4%');
  });

  it('leaves the coverage gap as a gap', () => {
    render(<RateApp />);
    chooseState('TX');
    typeMoney(/household income/i, 15_000);
    expect(document.querySelector('.slider-readout')).toHaveTextContent(/no subsidy and no Medicaid/);
    expect(figure('Premium after subsidy')).toHaveTextContent('None');
    expect(figure('Premium after subsidy')).toHaveTextContent('full premium would be');
  });

  it('carries three notes, each priced at the reader’s income', () => {
    render(<RateApp />);
    const notes = document.querySelectorAll('.notes-section .explainer');
    expect(notes).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'How the rate is figured', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Why the premium counts as a tax', level: 3 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'What is left out', level: 3 })).toBeInTheDocument();
    fireEvent.click(screen.getByText('How the rate is figured'));
    expect(notes[0]).toHaveTextContent('$17,800');
  });
});
