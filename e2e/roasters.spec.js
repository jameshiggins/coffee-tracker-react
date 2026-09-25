import { test, expect } from '@playwright/test';
import { installApi, ROASTERS } from './support/mockApi.js';
import { expectNoHorizontalOverflow, expectNoTextOverlap } from './support/layout.js';

/**
 * Roasters directory at phone and desktop widths. Each scenario renders the
 * page, waits for real data, then asserts geometry: nothing overlaps, nothing
 * overflows sideways. Runs for both Playwright projects (see the config).
 */

const MANY = ROASTERS.slice(0, 12).map((r) => r.id); // > collapse threshold
const FEW = [ROASTERS[4].id, ROASTERS[5].id]; // ≤ threshold: group always open

async function openRoasters(page) {
  await page.goto('/roasters');
  // The page renders a card list and a table and hides one per breakpoint,
  // so pick whichever copy is actually visible.
  await expect(page.getByText('JJ Bean').locator('visible=true').first()).toBeVisible();
}

async function checkLayout(page) {
  await expectNoHorizontalOverflow(page);
  await expectNoTextOverlap(page, '#root');
}

test.describe('roasters directory layout', () => {
  test('signed out', async ({ page }) => {
    await installApi(page);
    await openRoasters(page);
    await checkLayout(page);
  });

  test('signed in with a few pinned roasters (group open)', async ({ page }) => {
    await installApi(page, { signedIn: true, favoriteIds: FEW });
    await openRoasters(page);
    await expect(page.getByRole('heading', { name: 'Pinned roasters (2)' }).first()).toBeVisible();
    await checkLayout(page);
  });

  test('signed in with many pinned roasters (group collapsed, then expanded)', async ({ page }) => {
    await installApi(page, { signedIn: true, favoriteIds: MANY });
    await openRoasters(page);

    const toggle = page.getByRole('button', { name: /pinned roasters \(12\)/i }).first();
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await checkLayout(page);

    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(
      page.getByText('House of Funk Coffee Roasters').locator('visible=true').first(),
    ).toBeVisible();
    await checkLayout(page);
  });
});
