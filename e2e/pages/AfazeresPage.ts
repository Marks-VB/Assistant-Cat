import { type Page, expect } from '@playwright/test';

export class AfazeresPage {
  constructor(readonly page: Page) {}

  async goto() {
    await this.page.goto('/prototipo/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.goto('/prototipo/');
    await this.page.getByRole('button', { name: 'Agenda' }).click();
    await this.page.getByRole('tab', { name: /afazeres/i }).click();
  }

  async createTask(title: string) {
    await this.page.getByLabel(/nova tarefa/i).fill(title);
    await this.page.locator('#task-form').evaluate((f: HTMLFormElement) =>
      f.requestSubmit(),
    );
  }

  async expectTaskVisible(title: string) {
    await expect(
      this.page.getByRole('checkbox', { name: new RegExp(`concluir ${title}`, 'i') }),
    ).toBeVisible();
  }
}
