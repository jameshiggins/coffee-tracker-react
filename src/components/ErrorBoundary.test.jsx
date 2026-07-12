import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary.jsx';

function Boom({ message }) {
  throw new Error(message);
}

let reloadMock;
let originalLocation;

beforeEach(() => {
  try { window.sessionStorage.clear(); } catch { /* ignore */ }
  originalLocation = window.location;
  reloadMock = vi.fn();
  // jsdom marks location.reload non-configurable, so replace the whole
  // window.location (which IS redefinable) with a stub exposing reload.
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...originalLocation, reload: reloadMock, href: originalLocation.href, assign: () => {} },
  });
});

afterEach(() => {
  Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  vi.restoreAllMocks();
});

describe('ErrorBoundary', () => {
  it('renders the fallback on a child render error while siblings stay mounted', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <div>
        <span>sibling-content</span>
        <ErrorBoundary fallback={<div>recover-card</div>}>
          <Boom message="kaboom" />
        </ErrorBoundary>
      </div>
    );
    expect(screen.getByText('recover-card')).toBeInTheDocument();
    expect(screen.getByText('sibling-content')).toBeInTheDocument();
    expect(reloadMock).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('auto-reloads exactly once on a stale-chunk error and sets the guard', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary fallback={<div>recover-card</div>}>
        <Boom message="Failed to fetch dynamically imported module: https://x/assets/Page-abc.js" />
      </ErrorBoundary>
    );
    expect(reloadMock).toHaveBeenCalledTimes(1);
    expect(window.sessionStorage.getItem('rm_chunk_reload')).toBe('1');
    spy.mockRestore();
  });

  it('does not reload a second time once the guard is set — shows the fallback instead', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.sessionStorage.setItem('rm_chunk_reload', '1');
    render(
      <ErrorBoundary fallback={<div>recover-card</div>}>
        <Boom message="Importing a module script failed." />
      </ErrorBoundary>
    );
    expect(reloadMock).not.toHaveBeenCalled();
    expect(screen.getByText('recover-card')).toBeInTheDocument();
    spy.mockRestore();
  });
});
