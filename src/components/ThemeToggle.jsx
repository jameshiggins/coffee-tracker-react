import { useTheme } from '../hooks/useTheme.js';
import Icon from './Icon.jsx';

/**
 * Header light/dark toggle. Styled with semantic tokens so it reads correctly
 * on the themed (light/dark) surface header.
 */
export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center w-10 h-10 rounded-lg text-fg-muted hover:text-fg hover:bg-surface-muted focus-visible:bg-surface-muted transition-colors flex-shrink-0 ${className}`}
    >
      <Icon name={isDark ? 'sun' : 'moon'} size={18} />
    </button>
  );
}
