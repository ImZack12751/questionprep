import { expect, test } from '@playwright/test';
import { startSample, storedAnswers } from './helpers';

test('Ctrl+↑ / Ctrl+↓ toggle superscript and subscript in written answers', async ({ page }) => {
  await startSample(page, 'Science & English');
  const editor = page.locator('#question-S4 .typed-input');
  await editor.click();
  await page.keyboard.type('Water is H');
  await page.keyboard.press('Control+ArrowDown');
  await page.keyboard.type('2');
  await page.keyboard.press('Control+ArrowDown');
  await page.keyboard.type('O and area is 4 m');
  await page.keyboard.press('Control+ArrowUp');
  await page.keyboard.type('2');
  // Switching straight from superscript to subscript.
  await page.keyboard.press('Control+ArrowDown');
  await page.keyboard.type('n');
  await page.keyboard.press('Control+ArrowDown');
  await page.keyboard.type(' done');

  await expect(editor.locator('sub')).toHaveText(['2', 'n']);
  await expect(editor.locator('sup')).toHaveText(['2']);
  await expect(page.locator('#question-S4').getByRole('button', { name: 'Subscript' })).toHaveAttribute('aria-pressed', 'false');

  await expect
    .poll(() => storedAnswers(page))
    .toMatchObject({ S4: { type: 'typed', text: 'Water is H₂O and area is 4 m²ₙ done' } });

  // Shown formatted in the results.
  await page.locator('.exam-actions').getByRole('button', { name: 'Submit' }).click();
  await page.locator('.dialog-actions').getByRole('button', { name: 'Submit now' }).click();
  await expect(page.locator('.review-typed sub').first()).toHaveText('2');
});

test('toolbar buttons show and toggle the current script state', async ({ page }) => {
  await startSample(page, 'Science & English');
  await page.locator('#question-S4 .typed-input').click();
  await page.keyboard.type('CO');
  const sub = page.locator('#question-S4').getByRole('button', { name: 'Subscript' });
  await sub.click();
  await expect(sub).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.type('2');
  await sub.click();
  await expect(sub).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#question-S4 .typed-input')).toContainText('CO2');
  await expect(page.locator('#question-S4 .typed-input sub')).toHaveText('2');
});
