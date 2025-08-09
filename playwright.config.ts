import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2Eテスト設定
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* 並列実行時のワーカー数 */
  fullyParallel: true,
  /* CI環境でのfail fast */
  forbidOnly: !!process.env.CI,
  /* CI環境でのリトライ */
  retries: process.env.CI ? 2 : 0,
  /* 並列ワーカー数 */
  workers: process.env.CI ? 1 : undefined,
  /* レポーター設定 */
  reporter: 'html',
  /* 共通のテスト設定 */
  use: {
    /* ベースURL */
    baseURL: 'http://localhost:3000',
    /* スクリーンショット設定 */
    screenshot: 'only-on-failure',
    /* ビデオ録画設定 */
    video: 'retain-on-failure',
    /* トレース設定 */
    trace: 'on-first-retry',
  },

  /* プロジェクト設定 */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    /* モバイルテスト */
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],

  /* 開発サーバー設定 */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
})