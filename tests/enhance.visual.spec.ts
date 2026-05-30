import { expect, test } from '@playwright/test'

// enhance 層(JS ブリッジ)の視覚回帰。enhance-esm.html を使い、全ブリッジを決定論的に適用してから
// 要素単位で撮る(IIFE の非同期 auto-init には依存しない)。固定の狭幅にすることで折り返し
// (文節改行・ぶら下げ)を可視化し、同一エンジン内では決定論的に折れるようにする。
// ※ 基準画像はレンダリング環境(エンジン・フォント)依存で、CI では非ゲート扱い(情報提供)。
//   no-op/ゲート/効果の決定論的な検証は enhance.spec.ts が担う。差分が出たら ./x test-update で再生成。
// window.enhance の型は tests/enhance-globals.d.ts で共有する。

// 文節改行・字下げ・ぶら下げ・約物詰めが見える代表要素。横組み(無印)と縦組み(v-)の両方。
const TARGETS = [
  'heading-plain',
  'heading-markup',
  'dialogue',
  'hanging-first',
  'spacing-para',
  'v-heading',
  'v-dialogue',
  'v-hanging-first',
  'v-spacing',
]
// 注: 縦書きのルビ非破壊は enhance.spec.ts の DOM 検証が担う。極小のルビ字面は
// アンチエイリアスのゆらぎで視覚回帰が不安定なため、v-heading-markup は視覚回帰に含めない。

test('enhance: 文節改行・字下げ・ぶら下げ・約物詰めの視覚回帰', async ({ page }) => {
  await page.goto('/demo/enhance-esm.html')
  await page.waitForSelector('[data-harness-ready]')
  // 折り返しを可視化するため対象を固定の狭幅にする(ぶら下げの行末測定もこの幅で確定する)。
  await page.addStyleTag({ content: '[data-test] { max-inline-size: 14em; }' })
  await page.evaluate(async () => {
    // フォント確定後に測定したいので、ぶら下げ適用の前に fonts.ready を待つ。
    await document.fonts.ready
    await window.enhance(document, {
      phrasing: true,
      dialogueIndent: true,
      hanging: true,
      spacingTrim: true,
    })
  })

  for (const id of TARGETS) {
    await expect(page.locator(`[data-test="${id}"]`)).toHaveScreenshot(`enhance-${id}.png`)
  }
})
