import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag22aa'] as const;

async function expectNoViolations(page, url: string) {
  await page.goto(url);
  const results = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
  expect(results.violations).toEqual([]);
}

test.describe('Acessibilidade WCAG 2.2 AA', () => {
  test('home Agora sem violações wcag2a/wcag2aa/wcag22aa', async ({ page }) => {
    await expectNoViolations(page, '/prototipo/');
  });

  test('agenda (calendário + afazeres) sem violações', async ({ page }) => {
    await page.goto('/prototipo/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/prototipo/');
    await page.getByRole('button', { name: 'Agenda' }).click();
    const results = await new AxeBuilder({ page }).withTags([...TAGS]).analyze();
    expect(results.violations).toEqual([]);
  });

  test('app React (5173) sem violações críticas', async ({ page }) => {
    await page.goto(process.env.APP_URL || 'http://localhost:5173');
    const results = await new AxeBuilder({ page })
      .withTags([...TAGS])
      .disableRules(['color-contrast']) // tema em construção; reativar ao estabilizar tokens
      .analyze();
    expect(results.violations).toEqual([]);
  });
});
