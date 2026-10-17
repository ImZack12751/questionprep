import { expect, test } from '@playwright/test';
import { startSample } from './helpers';

test.describe('context cards', () => {
  test.beforeEach(async ({ page }) => {
    await startSample(page, 'Urbanisation');
  });

  test('a shared source is expanded on the first question and collapsed on the next ones', async ({ page }) => {
    const cards = page.locator('#section-panel .context-card');
    await expect(cards).toHaveCount(3);
    await expect(page.locator('#question-1 .context-toggle')).toHaveAttribute('aria-expanded', 'true');
    await expect(page.locator('#question-2 .context-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#question-3 .context-toggle')).toHaveAttribute('aria-expanded', 'false');
    await expect(page.locator('#question-2 .context-toggle')).toContainText('also used by question 1');
    // Each question is described by its source card.
    await expect(page.locator('#question-2 article')).toHaveAttribute('aria-describedby', 'ctx-2-sourceA');
    await expect(page.getByRole('region', { name: 'Source A' }).first()).toBeVisible();
    // One click away.
    await page.locator('#question-3 .context-toggle').click();
    await expect(page.locator('#question-3 .context-body')).toBeVisible();
  });

  test('multiple sources show in the listed order and tables render', async ({ page }) => {
    await page.getByRole('tab', { name: /Section B/ }).click();
    await expect(page.locator('#question-4 .context-label')).toHaveText(['Source B']);
    await expect(page.locator('#question-5 .context-label')).toHaveText(['Source A', 'Source B']);
    await expect(page.locator('#question-4 .context-text table th').first()).toHaveText('Year');
    await expect(page.locator('#question-4 .context-text .katex').first()).toBeVisible();
  });

  test('sources appear in the results too', async ({ page }) => {
    await page.locator('.exam-actions').getByRole('button', { name: 'Submit' }).click();
    await page.locator('.dialog-actions').getByRole('button', { name: 'Submit now' }).click();
    await expect(page.locator('.review .context-card')).toHaveCount(6);
  });
});

test('@mobile wide context tables scroll inside their card', async ({ page }) => {
  await startSample(page, 'Urbanisation');
  await page.getByRole('tab', { name: /Section B/ }).click();
  const wrap = page.locator('#question-4 .table-wrap');
  const { client, scroll } = await wrap.evaluate((el) => ({ client: el.clientWidth, scroll: el.scrollWidth }));
  expect(scroll).toBeGreaterThan(client);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
});
