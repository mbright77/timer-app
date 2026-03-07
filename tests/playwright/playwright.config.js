// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL: 'http://localhost:5555',
    headless: true,
    screenshot: 'only-on-failure',
  },
  webServer: {
    // serve publish/wwwroot at /timer-app/ using a simple redirect at root
    command: 'node server.js',
    url: 'http://localhost:5555/timer-app/',
    reuseExistingServer: false,
    timeout: 15000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
