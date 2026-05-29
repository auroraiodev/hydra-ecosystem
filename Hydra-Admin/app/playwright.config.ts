// Skip Playwright's host validation checks for missing Media Foundation libraries on Windows N/Server
process.env.PLAYWRIGHT_SKIP_VALIDATE_HOST_REQUIREMENTS = '1';

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
    headless: false,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
      use: { 
        ...devices['Desktop Chrome'],
      },
    },
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Use prepared auth state
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],
  webServer: [
    {
      command: 'bun run dev',
      url: 'http://localhost:3001',
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000,
    },
    {
      command: 'bun run tests/e2e/mock-backend.ts',
      url: 'http://127.0.0.1:3002/api/health',
      reuseExistingServer: !process.env.CI,
      timeout: 30 * 1000,
    }
  ],
});




