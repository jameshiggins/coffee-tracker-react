import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

// Flat config (ESLint 9). The repo is mid-migration: 90 JS/JSX files plus a
// growing set of TS. The TypeScript rules are scoped to *.ts/*.tsx so the
// legacy JS isn't run through the TS parser, while the React / hooks / a11y
// rules apply everywhere. Severities lean on "warn" for stylistic or
// adoption-friction rules so `npm run lint` stays green-with-signal; only
// genuine bugs (hook misuse, missing keys, undefined refs) are errors.
export default tseslint.config(
  {
    ignores: ['dist', 'coverage', 'public', 'node_modules', '_showcase.html'],
  },

  js.configs.recommended,

  // TypeScript-only: the recommended (non-type-checked) preset is fast and
  // doesn't require a parser project. Scoped so it never touches *.jsx.
  {
    files: ['**/*.{ts,tsx}'],
    extends: [...tseslint.configs.recommended],
  },

  // Shared language options + React/a11y rules for the whole source tree.
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'jsx-a11y': jsxA11y,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Genuine bugs — errors.
      'react-hooks/rules-of-hooks': 'error',
      'react/jsx-key': 'error',
      'react/jsx-no-undef': 'error',
      'react/jsx-no-duplicate-props': 'error',
      // Count identifiers referenced in JSX as "used" so no-unused-vars
      // doesn't false-flag components rendered only as <Foo />.
      'react/jsx-uses-vars': 'error',
      // Empty catch blocks are a deliberate idiom here (swallow JSON.parse /
      // localStorage failures); still flag empty if/for/while as real bugs.
      'no-empty': ['error', { allowEmptyCatch: true }],

      // Modern JSX transform: no React import or prop-types required.
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/no-unescaped-entities': 'off',
      'react/display-name': 'off',

      // Adoption-friction / stylistic — warnings keep the gate green.
      'react-hooks/exhaustive-deps': 'warn',
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // A handful of high-value a11y checks (Epic #3 already hardened the app;
      // these guard against regressions). Warnings, not errors.
      'jsx-a11y/alt-text': 'warn',
      'jsx-a11y/anchor-has-content': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
    },
  },

  // TS files: let the TS compiler own unused-var detection (noUnusedLocals)
  // so the two linters don't double-report; defer to the typed rule.
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Test files run under Vitest's explicit imports (globals: false), so they
  // only need Node globals on top of the browser set above.
  {
    files: ['**/*.{test,spec}.{js,jsx,ts,tsx}', 'src/test/**/*'],
    languageOptions: { globals: { ...globals.node } },
  },

  // Turn off rules that conflict with Prettier. Must stay last.
  prettier,
);
