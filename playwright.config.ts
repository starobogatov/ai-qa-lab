import { defineConfig, devices } from '@playwright/test';
import { authFile } from './tests/support/auth';

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: [['html'], ['allure-playwright', { resultsDir: 'allure-results' }]],

  use: {
    baseURL: 'https://www.saucedemo.com',
    testIdAttribute: 'data-test',
    headless: process.env.HEADED !== '1',
    trace: 'on-first-retry',
  },

  projects: [
    // Logs each SauceDemo user in once and saves the session to playwright/.auth/
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: authFile('standard_user') },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: authFile('standard_user') },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: authFile('standard_user') },
      dependencies: ['setup'],
    },
  ],
});
