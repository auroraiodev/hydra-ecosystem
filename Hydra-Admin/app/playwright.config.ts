import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const baseURL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /* Limit workers to avoid overwhelming the Next.js dev server */
  workers: process.env.CI ? 1 : 4,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Admin dashboard usually desktop only
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    */
  ],
  webServer: {
    command: 'bun run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
