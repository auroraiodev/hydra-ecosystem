// Skip Playwright's host validation checks for missing Media Foundation libraries on Windows N/Server
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';

import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In CI load .env.ci; locally load .env.local then .env
const IS_CI = !!process.env.CI;
if (IS_CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env.ci') });
} else {
  dotenv.config({ path: path.resolve(__dirname, '.env.local') });
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

export default defineConfig({
  testDir: './tests/e2e',
  timeout: IS_CI ? 60_000 : 90_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: 1,

  reporter: IS_CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: IS_CI,
    actionTimeout: 20_000,
    navigationTimeout: 45_000,
    launchOptions: {
      args: [
        '--disable-gpu',
        '--no-sandbox',
        '--disable-renderer-backgrounding',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
      ],
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: [
    {
      // CI: build once then serve via `next start` (stable, production-like).
      // Local dev: use dev server (fast, HMR).
      command: IS_CI ? 'bun run build && bun run start' : 'bun run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !IS_CI,
      // CI needs longer timeout because `next build` runs first
      timeout: IS_CI ? 300_000 : 120_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
    {
      command: 'bun run tests/e2e/mock-backend.ts',
      url: 'http://127.0.0.1:3002/api/health',
      reuseExistingServer: !IS_CI,
      timeout: 30_000,
      stdout: 'pipe',
      stderr: 'pipe',
    },
  ],
});
