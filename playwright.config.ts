import { defineConfig, devices } from '@playwright/test';

for (const key of ['BASE_URL', 'PODCAST_URL']) {
  const value = process.env[key];
  if (!value) throw new Error(`Configure ${key} em .env ou no ambiente`);
  if (!['https:', 'http:'].includes(new URL(value).protocol)) {
    throw new Error(`${key} deve ser uma URL HTTP ou HTTPS`);
  }
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  retries: 0,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'on',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
