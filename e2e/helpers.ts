import { expect, type Page } from '@playwright/test';

/** Load a built-in sample paper from the library and start a fresh attempt. */
export async function startSample(page: Page, sampleName: string) {
  await page.goto('./');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByRole('menuitem', { name: new RegExp(sampleName) }).click();
  await page.locator('.paper-card-link').first().click();
  await page.locator('.panel .btn-primary').click();
  await expect(page.locator('.exam-sheet')).toBeVisible();
}

/** Every math field's LaTeX inside a question. */
export const mathValues = (page: Page, questionId: string) =>
  page.locator(`#question-${questionId} math-field`).evaluateAll((els) => els.map((m) => (m as HTMLElement & { value: string }).value));

/** The answers saved in IndexedDB for the (single) attempt. */
export const storedAnswers = (page: Page) =>
  page.evaluate(async () => {
    const req = indexedDB.open('questionprep');
    await new Promise((r) => (req.onsuccess = r));
    const get = req.result.transaction('attempts').objectStore('attempts').getAll();
    await new Promise((r) => (get.onsuccess = r));
    return (get.result[0] as { answers: Record<string, unknown> }).answers;
  });

/** Overwrite part of the stored attempt, e.g. to plant a legacy-format answer. */
export const patchAttempt = (page: Page, patch: { answers?: Record<string, unknown>; currentSection?: number }) =>
  page.evaluate(async (p) => {
    const req = indexedDB.open('questionprep');
    await new Promise((r) => (req.onsuccess = r));
    const store = req.result.transaction('attempts', 'readwrite').objectStore('attempts');
    const get = store.getAll();
    await new Promise((r) => (get.onsuccess = r));
    const a = get.result[0];
    Object.assign(a.answers, p.answers ?? {});
    if (p.currentSection !== undefined) a.currentSection = p.currentSection;
    store.put(a);
    await new Promise((r) => (store.transaction.oncomplete = r));
  }, patch);

/** Click a math field and wait until it really has keyboard focus. */
export async function focusMath(page: Page, selector: string) {
  const field = page.locator(selector);
  await field.click();
  await expect.poll(() => field.evaluate((m) => document.activeElement === m)).toBe(true);
}
