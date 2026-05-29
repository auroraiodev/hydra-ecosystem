import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In CI load .env.ci; locally load .env
const IS_CI = !!process.env.CI;
dotenv.config({
  path: path.resolve(__dirname, IS_CI ? '.env.ci' : '.env'),
});

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : 4,

  reporter: IS_CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:3003',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: IS_CI,
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    // CI: build once then serve via `next start` (stable, production-like).
    // Local dev: use dev server (fast, HMR).
    command: IS_CI ? 'bun run build && bun run start' : 'bun run dev',
    url: 'http://localhost:3003',
    reuseExistingServer: !IS_CI,
    // CI needs longer timeout because `next build` runs first
    timeout: IS_CI ? 300_000 : 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
