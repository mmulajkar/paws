import { defineConfig, devices } from '@playwright/test';
import { existsSync } from 'node:fs';

// The sandbox this project was originally built in has a pre-installed
// Chromium binary at a fixed path instead of the version Playwright's own
// installer would fetch. Use it only when it's actually there (this path
// does not exist on a normal machine or in GitHub Actions, where
// `npx playwright install` provides the browsers instead).
const SANDBOX_CHROMIUM = '/opt/pw-browsers/chromium';

// These flags are Chromium-specific (WebKit's launcher doesn't understand
// them), so they're applied only to the three Chromium-driven projects
// below, never globally. They quiet down background network chatter
// (Google Fonts pings, Safe Browsing, component updates, ...) that a
// sandbox's restricted egress turns into slow, flaky test runs.
const chromiumLaunchOptions = {
  ...(existsSync(SANDBOX_CHROMIUM) ? { executablePath: SANDBOX_CHROMIUM } : {}),
  args: [
    '--disable-background-networking',
    '--disable-component-update',
    '--disable-domain-reliability',
    '--disable-client-side-phishing-detection',
    '--disable-sync',
    '--disable-features=OptimizationHints,MediaRouter,AutofillServerCommunication',
    '--no-first-run',
  ],
};

// Mobile/tablet projects use Playwright's real device descriptors so the
// viewport, user agent, touch support, and device scale factor all match a
// real device rather than just a resized desktop window.
//
// NOTE ON BROWSER ENGINES: "Mobile Chrome" and "Tablet" below use Android
// device descriptors, which Playwright drives with the Chromium engine.
// "Mobile Safari" uses an iOS device descriptor, which requires the WebKit
// engine. Some sandboxed environments (including the one this project was
// originally built in) only have the Chromium browser binary installed, in
// which case the "Mobile Safari" project is defined here for CI/CD and for
// running locally on a machine with WebKit installed, but cannot be run
// until `npx playwright install webkit` (or `--with-deps`) has been run.
// See README.md "Mobile testing" for exactly what was and wasn't run.

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  timeout: 45_000,
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run e2e:serve',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: { ...devices['Desktop Chrome'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 7'], launchOptions: chromiumLaunchOptions },
    },
    {
      name: 'Tablet',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 768, height: 1024 },
        isMobile: true,
        hasTouch: true,
        launchOptions: chromiumLaunchOptions,
      },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],
});
