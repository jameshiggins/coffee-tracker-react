// Vitest setup — runs before each test file.
//
// 1) jest-dom custom matchers (toBeInTheDocument, toHaveClass, etc.)
// 2) Manual `cleanup()` after each test, because we run vitest with
//    `globals: false` and @testing-library/react's auto-cleanup only fires
//    when the test globals are present. Without this, DOM from previous
//    tests leaks across tests and causes "found multiple elements" errors.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
