import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'off',
  },
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  projects: [
    {
      name: 'chromium-1440',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'chromium-768',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'chromium-390',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'chromium-320',
      use: {
        browserName: 'chromium',
        viewport: { width: 320, height: 568 },
      },
    },
    {
      name: 'webkit-1440',
      use: {
        browserName: 'webkit',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'webkit-768',
      use: {
        browserName: 'webkit',
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'webkit-390',
      use: {
        browserName: 'webkit',
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'webkit-320',
      use: {
        browserName: 'webkit',
        viewport: { width: 320, height: 568 },
      },
    },
  ],
});
