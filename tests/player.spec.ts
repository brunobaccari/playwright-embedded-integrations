import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/pages/embedded-pages/external-content/', { waitUntil: 'domcontentloaded' });
});

test('inicia, pausa e retoma áudio real dentro de iframe de outra origem', async ({ page }) => {
  const player = page.frameLocator(`iframe[src="${process.env.PODCAST_URL}"]`);
  const audio = player.locator('audio');
  expect(new URL(process.env.PODCAST_URL!).origin).not.toBe(new URL(page.url()).origin);
  await expect(audio).toHaveJSProperty('paused', true);
  const [download] = await Promise.all([
    page.waitForResponse(response => response.request().resourceType() === 'media'
      && /\.mp3(?:\?|$)/.test(response.url())
      && !(response.status() >= 300 && response.status() < 400)),
    player.locator('#episode-play').click(),
  ]);
  expect([200, 206]).toContain(download.status());
  expect(download.headers()['content-type']).toContain('audio/');
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await expect(audio).toHaveJSProperty('paused', false);
  await expect(audio).toHaveJSProperty('error', null);
  await player.locator('#episode-play-controls').click();
  await expect(audio).toHaveJSProperty('paused', true);
  const pausedAt = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await player.locator('#episode-play-controls').click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThan(pausedAt + 1);
  await player.locator('#episode-play-controls').click();
  await expect(audio).toHaveJSProperty('paused', true);
  await expect(page.locator('main h1')).toHaveText('iFrames With External Content');
});

test('avança pelo controle do player preservando o estado pausado', async ({ page }) => {
  const player = page.frameLocator(`iframe[src="${process.env.PODCAST_URL}"]`);
  const audio = player.locator('audio');
  await player.locator('#episode-play').click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime), { timeout: 20000 }).toBeGreaterThan(1);
  await player.locator('#episode-play-controls').click();
  await expect(audio).toHaveJSProperty('paused', true);
  const before = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  await player.locator('button:has(.pco-icon--FastForward)').click();
  await expect.poll(() => audio.evaluate((element: HTMLAudioElement) => element.currentTime)).toBeGreaterThanOrEqual(before + 14);
  const after = await audio.evaluate((element: HTMLAudioElement) => element.currentTime);
  expect(after).toBeLessThan(before + 16);
  await expect(audio).toHaveJSProperty('paused', true);
  await expect(audio).toHaveJSProperty('error', null);
});
