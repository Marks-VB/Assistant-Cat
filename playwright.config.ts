import { defineConfig, devices } from '@playwright/test';

export const PROTOTIPO_URL = process.env.PROTOTIPO_URL || 'http://localhost:3001/prototipo/';
export const APP_URL = process.env.APP_URL || 'http://localhost:5173';

const ALL_PROJECTS = [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
  { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
];

// Em CI o workflow instala apenas o Chromium (mais mobile-chrome, mesmo engine).
// Defina PLAYWRIGHT_ALL_BROWSERS=1 para rodar a matriz completa (exige os 3 engines).
const CI_CHROMIUM_ONLY = !!process.env.CI && process.env.PLAYWRIGHT_ALL_BROWSERS !== '1';

export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: PROTOTIPO_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: CI_CHROMIUM_ONLY
    ? ALL_PROJECTS.filter((p) => p.name === 'chromium' || p.name === 'mobile-chrome')
    : ALL_PROJECTS,
  webServer: [
    {
      command: 'node server.cjs',
      url: 'http://localhost:3001/prototipo/',
      reuseExistingServer: !process.env.CI,
      timeout: 60 * 1000,
    },
    {
      command: 'npm --prefix app run dev -- --port 5173',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
  ],
});
