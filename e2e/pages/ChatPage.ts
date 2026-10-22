import { type Page, type Locator, expect } from '@playwright/test';

export class ChatPage {
  readonly page: Page;
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly chatList: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.messageInput = page.getByLabel('Mensagem para o assistente');
    this.sendButton = page.getByRole('button', { name: /enviar/i });
    this.chatList = page.getByRole('log', { name: /Histórico de mensagens/i });
    this.toast = page.getByRole('status');
  }

  async goto() {
    await this.page.goto('/prototipo/');
    await this.page.evaluate(() => localStorage.clear());
    await this.page.goto('/prototipo/');
    await this.page.getByRole('button', { name: 'Chat' }).click();
  }

  /** Força o fallback local (parseCommand) em vez do Gemini. */
  async forceLocalFallback() {
    await this.page.route('**/api/gemini', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
  }

  async sendMessage(text: string) {
    await this.messageInput.fill(text);
    await this.page.locator('#chat-form').evaluate((f: HTMLFormElement) =>
      f.requestSubmit(),
    );
  }

  async confirmProposal(title: string) {
    await this.page
      .getByRole('button', { name: new RegExp(`Confirmar proposta: ${title}`, 'i') })
      .click();
  }

  async expectProposalExecuted() {
    await expect(this.page.getByText('Ação salva')).toBeVisible();
  }
}
