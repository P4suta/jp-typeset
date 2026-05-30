import { test } from '@playwright/test'

// 各デモページの全ページ「丸っと」プレビューを .shots/ に生成する。
// page.screenshot は基準と比較しない(toHaveScreenshot ではない)ので flaky は起きない。
// あくまで目視用の成果物生成であり、CI の回帰ゲートには含めない。
const PAGES = [
  { path: '/demo/index.html', name: 'gallery', ready: '[data-test="scope"]' },
  { path: '/demo/gfm.html', name: 'gfm', ready: 'pre code' },
]

for (const pageDef of PAGES) {
  test(`full-page preview: ${pageDef.name}`, async ({ page }, testInfo) => {
    await page.goto(pageDef.path)
    await page.waitForSelector(pageDef.ready)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    await page.screenshot({
      path: `.shots/${pageDef.name}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })
}
