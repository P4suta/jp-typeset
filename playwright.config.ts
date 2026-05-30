import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const baseUrl = `http://localhost:${PORT}`
const isCi = Boolean(process.env['CI'])

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: 'list',
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.02 },
  },
  use: {
    baseURL: baseUrl,
    locale: 'ja-JP',
    timezoneId: 'Asia/Tokyo',
  },
  // Vite で見本帳(demo/)を配信し、dist の成果物を読み込ませる。
  // dist は pretest(pnpm build)で生成済みである前提。
  webServer: {
    command: `pnpm exec vite --port ${PORT} --strictPort`,
    url: `${baseUrl}/demo/index.html`,
    reuseExistingServer: !isCi,
    timeout: 120_000,
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
})
