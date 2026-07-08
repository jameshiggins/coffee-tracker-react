import { describe, it, expect } from 'vitest';
import { formatDate, formatCAD } from './format.js';

describe('formatDate', () => {
  it('renders ISO dates as medium en-CA dates', () => {
    expect(formatDate('2026-06-17')).toBe('Jun 17, 2026');
    expect(formatDate('2026-01-05')).toBe('Jan 5, 2026');
  });

  it('parses as LOCAL date — no UTC off-by-one', () => {
    // new Date('2026-06-17') is UTC midnight = Jun 16 in western timezones;
    // the formatter must not fall into that.
    expect(formatDate('2026-06-17')).toContain('17');
  });

  it('tolerates datetime strings by using the date part', () => {
    expect(formatDate('2026-06-17T08:30:00Z')).toBe('Jun 17, 2026');
  });

  it('passes through non-date input and blanks empties', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate(null)).toBe('');
    expect(formatDate('yesterday')).toBe('yesterday');
  });
});

describe('formatCAD', () => {
  it('formats cents by default', () => {
    expect(formatCAD(24.5)).toBe('$24.50');
    expect(formatCAD('58')).toBe('$58.00');
  });

  it('formats whole dollars on request', () => {
    expect(formatCAD(60, { cents: false })).toBe('$60');
  });

  it('blanks non-numeric input', () => {
    expect(formatCAD(null)).toBe('');
    expect(formatCAD('n/a')).toBe('');
  });
});
