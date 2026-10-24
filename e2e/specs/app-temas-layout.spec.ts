import { test, expect } from '@playwright/test';

const APP = process.env.APP_URL || 'http://localhost:5173';

const dialogBoasVindas = (page) =>
  page.getByRole('dialog', { name: 'Boas-vindas do Assistant Cat' });

/** Espera o app carregar; se as boas-vindas estiverem abertas, conclui com "Pular". */
async function pularOnboarding(page) {
  const dialog = dialogBoasVindas(page);
  // Espera o fim do carregamento: o diálogo só aparece quando loading termina.
  await expect(dialog).toBeVisible();
  await page.getByRole('button', { name: 'Começar' }).click();
  await page.getByRole('button', { name: 'Pular' }).click();
  await expect(dialog).toBeHidden();
}

async function irParaMe(page) {
  await page.getByRole('tab', { name: 'Eu' }).first().click();
  await expect(page.getByText('Tema do aplicativo')).toBeVisible();
}

test.describe('App: boas-vindas, temas, avatar e navegação', () => {
  test('primeiro acesso abre as boas-vindas e conclui no app', async ({ page }) => {
    await page.goto(APP);
    const dialog = dialogBoasVindas(page);
    await expect(dialog).toBeVisible();
    await page.getByRole('button', { name: 'Começar' }).click();
    await expect(page.getByText('Como você quer ser chamado?')).toBeVisible();
    await page.getByRole('button', { name: 'Pular' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByRole('tab', { name: 'Chat' }).first()).toBeVisible();
    // Persistiu: recarregar não mostra de novo
    await page.reload();
    await expect(dialog).toBeHidden();
  });

  test('troca de tema muda cores e efeitos (vidro tem blur e fundo gradiente)', async ({ page }) => {
    await page.goto(APP);
    await pularOnboarding(page);
    await irParaMe(page);

    // Identidade: tema padrão usa o verde-gato do produto
    const accentMidnight = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );
    expect(accentMidnight).toBe('#7ecfb6');

    await page.getByRole('button', { name: /Vidro/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'glass');
    // Espera a transição de cor (260ms) terminar antes de ler o valor final.
    await page.waitForTimeout(450);

    const glass = await page.evaluate(() => {
      const card = document.querySelector('[class~="bg-[var(--surface-card)]"]');
      const cs = getComputedStyle(card);
      return {
        blur: cs.backdropFilter || (cs as any).webkitBackdropFilter,
        bodyBg: getComputedStyle(document.body).backgroundImage,
        cardBg: cs.backgroundColor
      };
    });
    expect(glass.blur).toContain('blur');
    expect(glass.bodyBg).toContain('gradient');
    expect(glass.cardBg).toContain('rgba');

    // Minimalista não tem sombra nem gradiente
    await page.getByRole('button', { name: /Minimalista/ }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'minimal');
    await page.waitForTimeout(450);
    const minimal = await page.evaluate(() => {
      const card = document.querySelector('[class~="bg-[var(--surface-card)]"]');
      return {
        shadow: getComputedStyle(card).boxShadow,
        bodyBg: getComputedStyle(document.body).backgroundImage
      };
    });
    expect(minimal.shadow).toBe('none');
    expect(minimal.bodyBg).toBe('none');
  });

  test('nome do assistente não cobre o avatar do cabeçalho', async ({ page }) => {
    await page.goto(APP);
    await pularOnboarding(page);
    await irParaMe(page);

    const header = page.locator('header.app-header');
    const center = header.locator('[title="Personalizar Assistente"]');
    const avatar = center.locator('div').first();
    const pill = center.locator('span[title]');

    const avatarBox = await avatar.boundingBox();
    const pillBox = await pill.boundingBox();
    expect(avatarBox).toBeTruthy();
    expect(pillBox).toBeTruthy();

    // O rótulo fica em linha única (sem quebrar em cima do avatar)
    expect(pillBox.height).toBeLessThanOrEqual(22);
    // Sobreposição intencional mínima: no máximo 10px no rodapé do avatar
    expect(pillBox.y).toBeGreaterThanOrEqual(avatarBox.y + avatarBox.height - 10);
  });

  test('layout lateral aparece no desktop e a preferência persiste', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto(APP);
    await pularOnboarding(page);

    const barraInferior = page.getByRole('tablist', { name: 'Navegação Principal' });

    // Automático: lateral no desktop, inferior escondida
    await expect(page.locator('aside.app-sidenav')).toBeVisible();
    await expect(barraInferior).toBeHidden();

    // Troca para inferior: some a lateral, volta a barra
    await irParaMe(page);
    await page.getByRole('button', { name: /^Inferior/ }).click();
    await expect(page.locator('aside.app-sidenav')).toBeHidden();
    await expect(barraInferior).toBeVisible();

    // De volta para lateral e persiste após reload
    await page.getByRole('button', { name: /^Lateral/ }).click();
    await expect(page.locator('aside.app-sidenav')).toBeVisible();
    await page.waitForTimeout(400); // dá tempo do save no IndexedDB
    await page.reload();
    await expect(page.locator('aside.app-sidenav')).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('data-nav', 'side');
  });

  test('botão "Nova tarefa" abre o modal de criação manual', async ({ page }) => {
    await page.goto(APP);
    await pularOnboarding(page);
    await page.getByRole('tab', { name: 'Agenda' }).first().click();
    await page.getByRole('button', { name: 'Afazeres' }).click();

    const nova = page.getByRole('button', { name: /nova tarefa/i });
    await expect(nova).toBeVisible();
    await nova.click();
    await expect(page.getByRole('button', { name: 'Salvar' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancelar' }).click();
  });
});
