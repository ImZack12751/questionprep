import { defineConfig, devices } from '@playwright/test';

// Browser tests for behaviour that unit tests can't reach (MathLive, IndexedDB, layout).
// PLAYWRIGHT_CHROMIUM_EXECUTABLE points at a preinstalled Chromium when browsers aren't
// downloaded (e.g. in a sandbox); otherwise run `npx playwright install chromium` once.
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined;

export default defineConfig({
  testDir: 'e2e',
  timeout: 60_000,
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5175/questionprep/',
    launchOptions: { executablePath },
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'] }, grep: /@mobile/ },
  ],
  webServer: {
    command: 'npm run dev -- --port 5175 --strictPort',
    url: 'http://localhost:5175/questionprep/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
