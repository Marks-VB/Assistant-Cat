import { type Page, type Locator, expect } from '@playwright/test';

export class AgendaPage {
  readonly page: Page;
  readonly newEventButton: Locator;
  readonly dialog: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newEventButton = page.getByRole('button', { name: 'Criar novo evento' }).first();
    this.dialog = page.locator('#editor');
  }

  async goto() {
    await this.page.goto('/prototipo/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.goto('/prototipo/');
    await this.page.getByRole('button', { name: 'Agenda' }).click();
  }

  async createEvent(input: { title: string; date: string; time: string; duration: string }) {
    await this.newEventButton.click();
    await expect(this.dialog).toBeVisible();
    await this.page.getByLabel(/título/i).fill(input.title);
    await this.page.locator('#event-date').fill(input.date);
    await this.page.locator('#event-time').fill(input.time);
    await this.page.locator('#event-duration').fill(input.duration);
    await this.page.getByRole('button', { name: 'Salvar evento' }).click();
  }

  async expectEventVisible(title: string) {
    await expect(this.page.getByRole('heading', { name: title }).first()).toBeVisible();
  }
}
