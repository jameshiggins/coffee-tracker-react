import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import Snackbar from './Snackbar.jsx';

describe('Snackbar', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the message', () => {
    render(<Snackbar message="Added Region: Ethiopia" onDismiss={() => {}} />);
    expect(screen.getByText('Added Region: Ethiopia')).toBeInTheDocument();
  });

  it('is a polite live region (interactive — not aria-hidden)', () => {
    render(<Snackbar message="x" onDismiss={() => {}} />);
    const bar = screen.getByRole('status');
    expect(bar).toHaveAttribute('aria-live', 'polite');
    expect(bar.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('renders the action button and fires onAction, then dismisses', () => {
    const onAction = vi.fn();
    const onDismiss = vi.fn();
    render(
      <Snackbar message="Added x" actionLabel="Undo" onAction={onAction} onDismiss={onDismiss} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(onAction).toHaveBeenCalledTimes(1);
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('omits the action button when no actionLabel/onAction is given', () => {
    render(<Snackbar message="x" onDismiss={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument();
  });

  it('dismisses via the ✕ button', () => {
    const onDismiss = vi.fn();
    render(<Snackbar message="x" onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('auto-dismisses after the hold + exit window', () => {
    const onDismiss = vi.fn();
    const onAction = vi.fn();
    render(
      <Snackbar message="x" actionLabel="Undo" onAction={onAction} duration={2000} onDismiss={onDismiss} />
    );
    expect(onDismiss).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(2000 + 250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onAction).not.toHaveBeenCalled(); // auto-dismiss must NOT trigger Undo
  });

  it('pauses the countdown while hovered, resumes on leave', () => {
    const onDismiss = vi.fn();
    render(<Snackbar message="x" duration={2000} onDismiss={onDismiss} />);
    const bar = screen.getByRole('status');
    fireEvent.mouseEnter(bar);
    act(() => {
      vi.advanceTimersByTime(5000); // would have dismissed twice over
    });
    expect(onDismiss).not.toHaveBeenCalled();
    fireEvent.mouseLeave(bar);
    act(() => {
      vi.advanceTimersByTime(2000 + 250);
    });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('shows a check glyph for added and not for removed', () => {
    const added = render(<Snackbar kind="added" message="a" onDismiss={() => {}} />);
    expect(added.container.querySelector('svg polyline')).toBeTruthy();
    added.unmount();
    const removed = render(<Snackbar kind="removed" message="a" onDismiss={() => {}} />);
    expect(removed.container.querySelector('svg polyline')).toBeFalsy();
  });
});
