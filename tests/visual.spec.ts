import { expect, test } from '@playwright/test'

// 各ケースの枠を「要素単位」で撮る視覚回帰。
// 全ページ撮影は粗く(1行リフローを見逃す)レンダリング揺れで flaky になりやすいため採らない。
// 要素単位なら小さな枠ほど差が相対的に大きく出て、約物詰め・折り返しの退行を拾いやすい。
// ※ 基準画像はレンダリング環境(エンジン・フォント)依存。CI では非ゲート扱い(情報提供)。
//   決定論的な検証は computed.spec.ts が担う。差分が出たら ./x test-update で再生成する。

test('各ケースの枠を要素単位で視覚回帰', async ({ page }) => {
  await page.goto('/demo/index.html')
  await page.waitForSelector('[data-test="scope"]')
  await page.evaluate(async () => {
    await document.fonts.ready
  })

  const ids = (await page.locator('.case[id]').evaluateAll((els) => els.map((el) => el.id))).filter(
    (id) => id.length > 0,
  )
  expect(ids.length).toBeGreaterThan(0)

  for (const id of ids) {
    await expect(page.locator(`#${id} .case__demo`)).toHaveScreenshot(`case-${id}.png`)
  }
})
