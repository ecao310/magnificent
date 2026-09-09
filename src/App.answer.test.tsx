import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import App from './App';
import { INCOME, pinPageYear, slide } from './test/pageFixtures';

/** The four figures the page is for, at the income the marker stands on, and the link that carries them. */

pinPageYear();

/** The line under the copy button that says whether the copy went. */
const shareStatus = (): HTMLElement => document.querySelector('.answer-share-status') as HTMLElement;

describe('the figures', () => {
  it('are headed by the income and the household they are priced for', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: 'Your numbers at $50,000', level: 2 });
    expect(heading.nextElementSibling).toHaveClass('answer-subline');
    expect(document.querySelectorAll('#answer .answer-figure')).toHaveLength(4);
  });

  it('copies the address, flushed first, and says so', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    slide(INCOME, 65_000);
    const button = screen.getByRole('button', { name: 'Copy link' });
    expect(shareStatus()).toBeEmptyDOMElement();
    fireEvent.click(button);
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText.mock.calls[0][0]).toMatch(/\?income=65000$/);
    await waitFor(() => expect(shareStatus()).not.toBeEmptyDOMElement());
    expect(shareStatus()).toHaveAttribute('aria-live', 'polite');
    expect(button.parentElement?.contains(shareStatus())).toBe(true);
  });

  it('says when the clipboard refuses', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.assign(navigator, { clipboard: { writeText } });
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(shareStatus()).not.toBeEmptyDOMElement());
  });
});
