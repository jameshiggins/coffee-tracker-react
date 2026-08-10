import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { ThemeProvider, useThemeContext } from './ThemeContext.jsx';

function Probe() {
  const { isDark, toggleTheme } = useThemeContext();
  return (
    <button onClick={toggleTheme}>{isDark ? 'dark' : 'light'}</button>
  );
}

describe('ThemeContext', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
  });
  afterEach(() => cleanup());

  it('provides theme state and toggling flips the html.dark class', () => {
    render(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>
    );
    const btn = screen.getByRole('button');
    expect(btn).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);

    fireEvent.click(btn);
    expect(btn).toHaveTextContent('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    fireEvent.click(btn);
    expect(btn).toHaveTextContent('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('two consumers share ONE theme state (the useTheme single-consumer contract)', () => {
    function Second() {
      const { isDark } = useThemeContext();
      return <span data-testid="second">{isDark ? 'dark' : 'light'}</span>;
    }
    render(
      <ThemeProvider>
        <Probe />
        <Second />
      </ThemeProvider>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByTestId('second')).toHaveTextContent('dark');
  });

  it('throws outside the provider', () => {
    expect(() => render(<Probe />)).toThrow(/inside <ThemeProvider>/);
  });
});
