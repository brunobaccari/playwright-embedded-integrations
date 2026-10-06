import { test, expect } from '@playwright/test';

const interactive = 'iframe[src="/frame-includes/iframe-interactive.html"]';
const list = 'iframe[src="/frame-includes/iframe-list.html"]';

test('interage com o frame correto mesmo com IDs duplicados no host', async ({ page }) => {
  await page.goto('/pages/embedded-pages/iframes/');
  const form = page.frameLocator(interactive);
  const sibling = page.frameLocator(list);
  await expect(page.locator('iframe#alist')).toHaveCount(2);
  await form.locator('#numField').fill('12');
  await form.locator('#incField').fill('7');
  await form.getByRole('button', { name: 'Add Amount' }).click();
  await expect(form.locator('#numField')).toHaveValue('19');
  await expect(sibling.locator('li')).toHaveCount(100);
  await expect(sibling.locator('#iframe0')).toHaveText('iFrame List Item 0');
  await expect(sibling.locator('#iframe99')).toHaveText('iFrame List Item 99');
  await expect(page.locator('#numField')).toHaveCount(0);
  await expect(page.locator('main h1')).toHaveText('iFrames');
});

test('recupera o contexto após recarregar somente o iframe', async ({ page }) => {
  await page.goto('/pages/embedded-pages/iframes/');
  const form = page.frameLocator(interactive);
  await form.locator('#numField').fill('40');
  await form.getByRole('button', { name: 'Add Amount' }).click();
  await expect(form.locator('#numField')).toHaveValue('45');
  const child = page.frame({ url: /\/iframe-interactive\.html$/ });
  expect(child).not.toBeNull();
  await child!.goto(child!.url());
  await expect(form.locator('#numField')).toHaveValue('0');
  await form.getByRole('button', { name: 'Add Amount' }).click();
  await expect(form.locator('#numField')).toHaveValue('5');
  await expect(page.frameLocator(list).locator('#iframe99')).toHaveText('iFrame List Item 99');
  await expect(page).toHaveURL(/\/embedded-pages\/iframes\/$/);
});

test('reconstrói os frames após recarregar a página hospedeira', async ({ page }) => {
  await page.goto('/pages/embedded-pages/iframes/');
  const form = page.frameLocator(interactive);
  await form.locator('#numField').fill('80');
  await page.reload();
  await expect(form.locator('#numField')).toHaveValue('0');
  await form.locator('#incField').fill('-2');
  await form.getByRole('button', { name: 'Add Amount' }).click();
  await expect(form.locator('#numField')).toHaveValue('-2');
  await expect(page.frameLocator(list).locator('li')).toHaveCount(100);
});

test('lê as três regiões do frameset legado sem misturar documentos', async ({ page }) => {
  await page.goto('/pages/embedded-pages/frames/');
  for (const [name, heading, count] of [
    ['left', 'Left', 30], ['middle', 'Middle', 40], ['right', 'Right', 50],
  ] as const) {
    const frame = page.frameLocator(`frame[name="${name}"]`);
    await expect(frame.getByRole('heading', { name: heading, exact: true })).toBeVisible();
    await expect(frame.locator('li')).toHaveCount(count);
    await expect(frame.locator(`#${name}${count - 1}`)).toHaveText(`${heading} List Item ${count - 1}`);
  }
  await expect(page.locator('frame')).toHaveCount(5);
  await expect(page.locator('li')).toHaveCount(0);
});

test('link com target top sai do frameset e permite entrar em novos iframes', async ({ page }) => {
  await page.goto('/pages/embedded-pages/frames/');
  const top = page.frameLocator('frame[name="top"]');
  const link = top.getByRole('link', { name: 'iFrames', exact: true });
  await expect(link).toHaveAttribute('target', '_top');
  await link.click();
  await expect(page).toHaveURL(/\/embedded-pages\/iframes\/$/);
  await expect(page.locator('frame')).toHaveCount(0);
  const form = page.frameLocator(interactive);
  await form.getByRole('button', { name: 'Add Amount' }).click();
  await expect(form.locator('#numField')).toHaveValue('5');
});
