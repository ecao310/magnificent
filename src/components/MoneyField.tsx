import { useEffect, useState } from 'react';
import type { KeyboardEvent } from 'react';

export interface MoneyFieldProps {
  id: string;
  /** The figure as the page holds it: what the field shows when nobody is typing. */
  value: number;
  min: number;
  max: number;
  /** What an arrow key moves the figure by. */
  step: number;
  /** Called with every in-range figure typed, and with the clamped one on blur. */
  onCommit: (next: number) => void;
  /** The colour the figure takes, as a class. */
  className?: string;
  describedBy?: string;
}

/** The digits of whatever was typed, as a number, or null where there were none. */
const parse = (raw: string): number | null => {
  const digits = raw.replace(/[^\d]/g, '');
  return digits === '' ? null : Number(digits);
};

/** A figure with its thousands separated, the way every other figure on the page is set. */
const withSeparators = (value: number): string => value.toLocaleString('en-US');

/**
 * A dollar figure the reader can type, set as the page sets every other
 * figure: mono, right-aligned, with the sign in front of it, and its
 * thousands separated once it is settled.
 *
 * A text field rather than a number one, because a number field cannot
 * show a separator, and the one figure the reader types should not be the
 * one figure on the page without them. It still asks a phone for the
 * numeric keypad, and the arrow keys still step it.
 *
 * Typing commits on every keystroke that parses inside the bounds, so the
 * chart follows the field the way it follows a slider. A half-typed figure —
 * an empty field, a number past the end of the axis — is held as a draft and
 * clamped when the field is left, so the page never jumps to a value the
 * reader was passing through.
 */
export const MoneyField: React.FC<MoneyFieldProps> = ({
  id,
  value,
  min,
  max,
  step,
  onCommit,
  className,
  describedBy,
}) => {
  const [draft, setDraft] = useState<string | null>(null);

  /* Anything that moves the figure — this field, a slider, a link — ends the
     draft, so the field shows what the page is actually pricing. */
  useEffect(() => setDraft(null), [value]);

  const commit = (raw: string): void => {
    setDraft(raw);
    const next = parse(raw);
    if (next === null) return;
    if (next < min || next > max) return;
    onCommit(Math.round(next));
  };

  const settle = (): void => {
    if (draft === null) return;
    const next = parse(draft);
    setDraft(null);
    if (next === null) return;
    onCommit(Math.round(Math.min(max, Math.max(min, next))));
  };

  /* The arrow keys walk the figure a step at a time, as they would on a
     number field, and never past either end. */
  const stepBy = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const from = parse(draft ?? String(value)) ?? value;
    const next = e.key === 'ArrowUp' ? from + step : from - step;
    setDraft(null);
    onCommit(Math.round(Math.min(max, Math.max(min, next))));
  };

  /* The box is as wide as the biggest figure it can hold, separators and
     all, so the sign in front of it stands against the digits rather than
     across a gap. */
  const digits = { '--digits': withSeparators(max).length } as React.CSSProperties;

  return (
    <span className={className ? `money-field ${className}` : 'money-field'} style={digits}>
      <span className="money-field-sign" aria-hidden="true">
        $
      </span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        enterKeyHint="done"
        value={draft ?? withSeparators(value)}
        aria-describedby={describedBy}
        onChange={(e) => commit(e.target.value)}
        onBlur={settle}
        onKeyDown={stepBy}
      />
    </span>
  );
};
