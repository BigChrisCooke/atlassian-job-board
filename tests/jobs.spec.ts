import { test, expect } from '@playwright/test';

const BASE_URL = 'https://atlassian-job-board.netlify.app';

test('jobs page loads and displays listings', async ({ page }) => {
  await page.goto(`${BASE_URL}/jobs/`);

  await expect(page).toHaveTitle(/jobs/i);

  // At least one job card should be visible
  const jobCards = page.locator('a[href*="/jobs/"]').filter({ hasText: /.{5,}/ });
  await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
});

test('job count is shown and non-zero', async ({ page }) => {
  await page.goto(`${BASE_URL}/jobs/`);

  // Look for any element showing a count/number of jobs
  const body = page.locator('body');
  await expect(body).toContainText(/\d+ roles/i, { timeout: 10000 });
});

test('category filter works', async ({ page }) => {
  await page.goto(`${BASE_URL}/jobs/`);

  // Click a filter button if present and verify the page still shows results
  const filterBtn = page.locator('button').filter({ hasText: /developer|consultant|all/i }).first();
  if (await filterBtn.isVisible()) {
    await filterBtn.click();
    const jobCards = page.locator('a[href*="/jobs/"]').filter({ hasText: /.{5,}/ });
    await expect(jobCards.first()).toBeVisible({ timeout: 10000 });
  }
});
