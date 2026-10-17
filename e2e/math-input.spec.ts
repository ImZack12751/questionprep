import { expect, test } from '@playwright/test';
import { focusMath, mathValues, patchAttempt, startSample, storedAnswers } from './helpers';

test.describe('multi-line maths answers', () => {
  test.beforeEach(async ({ page }) => {
    await startSample(page, 'Pure Mathematics');
    await expect(page.locator('#question-A1 math-field')).toBeVisible();
  });

  test('Enter starts a new line even when typing at full speed; spaces are kept', async ({ page }) => {
    await focusMath(page, '#question-A1 math-field');
    // No pauses between keys: the new line must have focus before the next keystroke.
    await page.keyboard.type('3x - 7 = 2x + 5');
    await page.keyboard.press('Enter');
    await page.keyboard.type('x - 7 = 5');
    await page.keyboard.press('Enter');
    await page.keyboard.type('x = 12');
    expect(await mathValues(page, 'A1')).toEqual(['3x\\,-\\,7\\,=\\,2x\\,+\\,5', 'x\\,-\\,7\\,=\\,5', 'x\\,=\\,12']);
  });

  test('arrows move between lines, Backspace on an empty line removes it', async ({ page }) => {
    await focusMath(page, '#question-A1 math-field');
    await page.keyboard.type('a');
    await page.keyboard.press('Enter');
    await page.keyboard.type('b');
    await page.keyboard.press('ArrowUp');
    await page.keyboard.type('1');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    expect(await mathValues(page, 'A1')).toEqual(['a1', 'b', '']);
    await page.keyboard.press('Backspace');
    expect(await mathValues(page, 'A1')).toEqual(['a1', 'b']);
    await page.keyboard.type('2');
    expect(await mathValues(page, 'A1')).toEqual(['a1', 'b2']);
  });

  test('Text mode lets words be typed without maths shortcuts', async ({ page }) => {
    await focusMath(page, '#question-A1 math-field');
    await page.locator('#question-A1').getByRole('button', { name: 'Text' }).click();
    await page.keyboard.type('so the integral');
    expect(await mathValues(page, 'A1')).toEqual(['\\text{so the integral}']);
  });

  test('every line is autosaved and restored after a reload', async ({ page }) => {
    await focusMath(page, '#question-A1 math-field');
    await page.keyboard.type('x=12');
    await page.keyboard.press('Enter');
    await page.keyboard.type('y=3');
    await expect
      .poll(() => storedAnswers(page))
      .toMatchObject({ A1: { type: 'math', latex: 'x=12 \\\\ y=3', lines: ['x=12', 'y=3'] } });
    await page.reload();
    await expect(page.locator('#question-A1 math-field')).toHaveCount(2);
    expect(await mathValues(page, 'A1')).toEqual(['x=12', 'y=3']);
  });

  test('a legacy single-line answer loads as one line and can be extended', async ({ page }) => {
    await patchAttempt(page, { answers: { A2: { type: 'math', latex: '(x-2)(x-3)' } }, currentSection: 0 });
    await page.reload();
    await expect(page.locator('#question-A2 math-field')).toHaveCount(1);
    expect(await mathValues(page, 'A2')).toEqual(['(x-2)(x-3)']);
    await focusMath(page, '#question-A2 math-field');
    await page.keyboard.press('End');
    await page.keyboard.press('Enter');
    await page.keyboard.type('x=2');
    await expect.poll(() => storedAnswers(page)).toMatchObject({ A2: { lines: ['(x-2)(x-3)', 'x=2'] } });
  });

  test('results show each line of working', async ({ page }) => {
    await focusMath(page, '#question-A1 math-field');
    await page.keyboard.type('x=12');
    await page.keyboard.press('Enter');
    await page.keyboard.type('y=3');
    await page.locator('.exam-actions').getByRole('button', { name: 'Submit' }).click();
    await page.locator('.dialog-actions').getByRole('button', { name: 'Submit now' }).click();
    await expect(page.locator('.review-group').first().locator('.review-math-line')).toHaveCount(2);
  });
});

test('@mobile maths lines work with the on-screen keyboard', async ({ page }) => {
  await startSample(page, 'Pure Mathematics');
  const first = page.locator('#question-A1 math-field').first();
  await first.tap();
  await expect.poll(() => page.evaluate(() => (window as unknown as { mathVirtualKeyboard: { visible: boolean } }).mathVirtualKeyboard.visible)).toBe(true);
  await page.keyboard.type('F=BIL');
  // The on-screen return key sends MathLive's "commit" command.
  await first.evaluate((m) => (m as unknown as { executeCommand: (c: string) => void }).executeCommand('commit'));
  await expect(page.locator('#question-A1 math-field')).toHaveCount(2);
  await page.keyboard.type('F=0.5');
  expect(await mathValues(page, 'A1')).toEqual(['F=BIL', 'F=0.5']);
  // The whole expression is visible: no icon buttons covering it, and no page overflow.
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(page.viewportSize()!.width);
  const menuShown = await first.evaluate((m) => getComputedStyle(m.shadowRoot!.querySelector('[part=menu-toggle]')!).display);
  expect(menuShown).toBe('none');
});
