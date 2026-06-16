import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Toast from './Toast.jsx';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message', () => {
    render(<Toast message="Added Region: Ethiopia" onDismiss={() => {}} />);
    expect(screen.getByText('Added Region: Ethiopia')).toBeInTheDocument();
  });

  it('is hidden from the a11y tree (decorative — the page owns the live region)', () => {
    const { container } = render(<Toast message="x" onDismiss={() => {}} />);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('uses inverse semantic tokens for the pill', () => {
    render(<Toast message="x" onDismiss={() => {}} />);
    const pill = screen.getByText('x').closest('div');
    expect(pill).toHaveClass('bg-fg');
    expect(pill).toHaveClass('text-surface');
  });

  it('shows a check glyph for added and an x glyph for removed', () => {
    const added = render(<Toast kind="added" message="a" onDismiss={() => {}} />);
    // check icon = one <polyline>; x icon = two <line>s.
    expect(added.container.querySelector('svg polyline')).toBeTruthy();
    added.unmount();

    const removed = render(<Toast kind="removed" message="a" onDismiss={() => {}} />);
    expect(removed.container.querySelectorAll('svg line').length).toBeGreaterThanOrEqual(2);
  });

  it('auto-dismisses after the hold + exit window', () => {
    const onDismiss = vi.fn();
    render(<Toast message="x" duration={2000} onDismiss={onDismiss} />);
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000 + 250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss before the duration elapses', () => {
    const onDismiss = vi.fn();
    render(<Toast message="x" duration={2000} onDismiss={onDismiss} />);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(onDismiss).not.toHaveBeenCalled();
  });
});
