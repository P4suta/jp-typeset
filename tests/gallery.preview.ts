import { test } from '@playwright/test'

// 各デモページの全ページ「丸っと」プレビューを .shots/ に生成する。
// page.screenshot は基準と比較しない(toHaveScreenshot ではない)ので flaky は起きない。
// あくまで目視用の成果物生成であり、CI の回帰ゲートには含めない。

interface PageDef {
  path: string
  name: string
  ready: string
  // 撮影前に in-page で走らせる任意の準備(enhance の明示適用など)。
  setup?: () => Promise<void>
}

const PAGES: PageDef[] = [
  { path: '/demo/index.html', name: 'gallery', ready: '[data-test="scope"]' },
  { path: '/demo/gfm.html', name: 'gfm', ready: 'pre code' },
  // enhance(JS ブリッジ)の CDN ドロップイン。自動初期化=文節改行のみ。完了マーカーを待つ。
  { path: '/demo/enhance-iife.html', name: 'enhance', ready: '[data-jp-enhanced]' },
  // enhance の全ブリッジ(文節改行＋字下げ＋ぶら下げ＋約物詰め)を横組み・縦組みの両方へ適用した結果。
  {
    path: '/demo/enhance-esm.html',
    name: 'enhance-all',
    ready: '[data-harness-ready]',
    setup: () =>
      window.enhance(document, {
        phrasing: true,
        dialogueIndent: true,
        hanging: true,
        spacingTrim: true,
      }),
  },
]

for (const pageDef of PAGES) {
  test(`full-page preview: ${pageDef.name}`, async ({ page }, testInfo) => {
    await page.goto(pageDef.path)
    await page.waitForSelector(pageDef.ready)
    await page.evaluate(async () => {
      await document.fonts.ready
    })
    // フォント確定後にブリッジを適用(ぶら下げの行末測定を最終レイアウトで行う)。
    if (pageDef.setup !== undefined) {
      await page.evaluate(pageDef.setup)
    }
    await page.screenshot({
      path: `.shots/${pageDef.name}-${testInfo.project.name}.png`,
      fullPage: true,
    })
  })
}
