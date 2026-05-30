import { test } from '@playwright/test'

// 各ブラウザの全ページ「丸っと」プレビューを .shots/ に生成する。
// page.screenshot は基準と比較しない(toHaveScreenshot ではない)ので、回帰テストのような
// flaky は起きない。あくまで目視用の成果物生成であり、CI の回帰ゲートには含めない。
test('gallery full-page preview', async ({ page }, testInfo) => {
  await page.goto('/demo/index.html')
  await page.waitForSelector('[data-test="scope"]')
  await page.evaluate(async () => {
    await document.fonts.ready
  })
  await page.screenshot({
    path: `.shots/gallery-${testInfo.project.name}.png`,
    fullPage: true,
  })
})
