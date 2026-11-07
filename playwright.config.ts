import { defineConfig, devices } from '@playwright/test';
const port = Number(process.env.E2E_PORT ?? 3100);
export default defineConfig({
  outputDir: `test-results/${process.env.E2E_SCENARIO ?? 'success'}`,
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 10000 },
  reporter: [
    ['list'],
    [
      'html',
      { open: 'never', outputFolder: `playwright-report/${process.env.E2E_SCENARIO ?? 'success'}` },
    ],
  ],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH },
      },
    },
  ],
  webServer: {
    command: `npm run start -- --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 60000,
    env: {
      HOTEL_MOCK_SCENARIO: process.env.E2E_SCENARIO ?? 'success',
      HOTEL_MOCK_DELAY_MS: '1000',
    },
  },
});
