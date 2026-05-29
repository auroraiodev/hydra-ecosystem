import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In CI load .env.ci; locally load .env
dotenv.config({
  path: path.resolve(__dirname, process.env.CI ? '.env.ci' : '.env'),
});

const IS_CI = !!process.env.CI;

export default defineConfig({
  testDir: './tests/e2e',

  // Run all tests in parallel — CI uses 1 worker to avoid port conflicts
  fullyParallel: true,
  forbidOnly: IS_CI,
  retries: IS_CI ? 2 : 0,
  workers: IS_CI ? 2 : 4,

  reporter: IS_CI
    ? [['github'], ['html', { open: 'never' }], ['list']]
    : [['html', { open: 'on-failure' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    headless: IS_CI,
    // Generous timeouts for CI
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  // Only run Chromium in CI to keep the pipeline fast.
  // Locally we also run Mobile Chrome for responsive tests.
  projects: IS_CI
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] },
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] },
        },
      ],

  webServer: {
    // CI: build once then serve via `next start` (stable, production-like).
    // Local dev: use Turbopack dev server (fast, HMR).
    command: IS_CI ? 'bun run build && bun run start' : 'bun run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !IS_CI,
    // CI needs longer timeout because `next build` runs first
    timeout: IS_CI ? 300_000 : 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
  },
});
