import { test as setup, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const authFile = 'playwright/.auth/user.json';
declare const __dirname: string;
const logFile = path.resolve(__dirname, 'debug.log');

function writeLog(msg: string) {
  fs.appendFileSync(logFile, `${new Date().toISOString()} - ${msg}\n`);
}

setup('authenticate', async ({ page }) => {
  // Clear log at start of run
  if (fs.existsSync(logFile)) fs.unlinkSync(logFile);
  writeLog('Test run started!');

  page.on('console', msg => writeLog(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', err => writeLog(`[BROWSER ERROR] ${err.message}`));
  page.on('requestfailed', req => writeLog(`[BROWSER REQ FAIL] ${req.url()} - ${req.failure()?.errorText}`));

  writeLog('Navigating to /login...');
  await page.goto('/login');
  writeLog('Navigated to /login');
  
  // Fill credentials and submit
  writeLog('Filling email...');
  await page.fill('input[type="email"], input#email', 'admin@hydracollect.com');
  writeLog('Filling password...');
  await page.fill('input[type="password"], input#password', 'adminpassword');
  writeLog('Clicking submit...');
  await page.click('button[type="submit"]');

  // Wait for dashboard redirection and check layout is loaded
  writeLog('Waiting for URL redirection to dashboard...');
  await page.waitForURL(/.*dashboard/, { waitUntil: 'domcontentloaded' });
  writeLog('Redirected! Checking main layout...');
  await expect(page.locator('main')).toBeAttached();

  // Save storage state containing session cookies
  writeLog('Saving storage state...');
  await page.context().storageState({ path: authFile });
  writeLog('Authentication setup complete!');
});



