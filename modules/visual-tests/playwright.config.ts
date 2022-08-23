import { devices, PlaywrightTestConfig, selectors } from '@playwright/test';
import { ObjectEntries, ObjectFromEntries } from '@reykjavik/hanna-utils';

import { TestTag } from './src/testingInfo';
import { TAG_PREFIX } from './tests/helpers/screeshots';

const closestEngine = () => ({
  query: (root: HTMLElement, selector: string) => root.closest(selector),
  queryAll: (root: HTMLElement, selector: string) => {
    const closest = root.closest(selector);
    return closest ? [closest] : [];
  },
});
selectors.register('closest', closestEngine, { contentScript: true });

const tagRes: Record<TestTag, RegExp> = ObjectFromEntries(
  (['meta', 'only-chrome', 'also-chrome', 'only-safari', 'also-safari'] as const).map(
    (name) => [name, new RegExp(TAG_PREFIX + name)]
  )
);
const grepInvert = [tagRes.meta, tagRes['only-chrome'], tagRes['only-safari']];

type ProjectCfg = NonNullable<PlaywrightTestConfig['projects']>[0];

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// require('dotenv').config();

/**
 * See https://playwright.dev/docs/test-configuration.
 */
const config: PlaywrightTestConfig = {
  testDir: './tests',
  /* Maximum time one test can run for. */
  timeout: 30 * 1000,
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     * For example in `await expect(locator).toHaveText();`
     */
    timeout: 5000,
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Folder for test artifacts such as screenshots, videos, traces, etc. */
  outputDir: '_playwright-results',
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [['html', { outputFolder: '_playwright-report' }]],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: 'http://localhost:7357',
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'meta',
      // use: { browserName: 'chromium' },
      grep: [tagRes.meta],
    },

    ...ObjectEntries({
      wide: { width: 1600, height: 500 },
      netbook: { width: 1100, height: 500 },
    }).flatMap(
      ([label, viewport]): Array<ProjectCfg> => [
        {
          name: 'firefox-' + label,
          // use desktop firefox
          use: {
            ...devices['Desktop Firefox'],
            viewport,
          },
          grepInvert,
        },
        {
          name: 'chromium-' + label,
          use: {
            ...devices['Desktop Chrome'],
            viewport,
          },
          grep: [tagRes['also-chrome'], tagRes['only-chrome']],
        },
        {
          name: 'webkit-' + label,
          use: {
            ...devices['Desktop Safari'],
            viewport,
          },
          grep: [tagRes['also-safari'], tagRes['only-safari']],
        },
      ]
    ),

    {
      name: 'ipad',
      use: { ...devices['iPad (gen 7)'] },
      grepInvert,
    },
    {
      name: 'iphone',
      use: { ...devices['iPhone 12'] },
      grepInvert,
    },

    /* Test against branded browsers. */
    // { name: 'Microsoft Edge', use: { channel: 'msedge' } },
    // { name: 'Google Chrome', use: { channel: 'chrome' } },
  ],

  /* Run your local dev server before starting the tests */
  webServer: [
    {
      command: 'yarn run webserver:testingmode',
      port: 7357,
      reuseExistingServer: true,
    },
    {
      command: 'yarn run build:css:dev  &&  yarn run dev:server',
      cwd: '../hanna-css',
      port: 4000,
      reuseExistingServer: true,
    },
  ],
};

export default config;