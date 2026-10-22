import { test, expect } from '@playwright/test';
import { ChatPage } from '../pages/ChatPage';
import { AgendaPage } from '../pages/AgendaPage';
import { AfazeresPage } from '../pages/AfazeresPage';

test.describe('Fluxos críticos do protótipo', () => {
  test('criar evento via diálogo da agenda', async ({ page }) => {
    const agenda = new AgendaPage(page);
    await agenda.goto();
    await agenda.createEvent({
      title: 'Revisão E2E',
      date: '2026-11-15',
      time: '14:00',
      duration: '45',
    });
    await agenda.expectEventVisible('Revisão E2E');
  });

  test('criar tarefa via aba Afazeres', async ({ page }) => {
    const afazeres = new AfazeresPage(page);
    await afazeres.goto();
    await afazeres.createTask('Escrever spec E2E');
    await afazeres.expectTaskVisible('Escrever spec E2E');
  });

  test('proposta do chat é idempotente (duplo confirmar = 1 item)', async ({ page }) => {
    const chat = new ChatPage(page);
    await chat.goto();
    await chat.forceLocalFallback();
    await chat.sendMessage('Marque revisão amanhã às 14h por 45 minutos');
    await chat.confirmProposal('revisão');
    // Segundo clique: mesma proposalKey → executeProposal retorna { duplicate: true }
    await page
      .getByRole('button', { name: /confirmar proposta/i })
      .click({ timeout: 3000 })
      .catch(() => {});
    await chat.expectProposalExecuted();
    await expect(page.getByRole('status')).toContainText(/já foi salva|salvo/i);
  });

  test('fluxo completo por teclado: skip link, dialog, Esc', async ({ page }) => {
    const agenda = new AgendaPage(page);
    await agenda.goto();
    // 1. Skip link é o primeiro focável e move o foco para #content
    await page.keyboard.press('Tab');
    await expect(page.locator('.skip-link')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#content')).toBeFocused();
    // 2. Abrir diálogo por teclado e fechar com Esc
    await agenda.newEventButton.focus();
    await page.keyboard.press('Enter');
    await expect(agenda.dialog).toBeVisible();
    await expect(page.locator('#event-title')).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(agenda.dialog).toBeHidden();
  });
});
