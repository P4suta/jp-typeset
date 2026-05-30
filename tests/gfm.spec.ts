import { expect, test } from '@playwright/test'

// GFM(Markdown)から生成される HTML を日本語として破綻なく扱えるかの検証。
// 特に「コードは等幅を保ち、和欧間アキを入れない」ことを computed で保証する。

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/gfm.html')
  await page.waitForSelector('pre code')
})

test('GFM: インライン/ブロックのコードは等幅・和欧アキ無効を保つ', async ({ page }) => {
  const result = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector)
      if (el === null) {
        throw new Error(`${selector} が見つかりません`)
      }
      const cs = getComputedStyle(el)
      return {
        fontFamily: cs.fontFamily.toLowerCase(),
        textAutospace: cs.getPropertyValue('text-autospace'),
      }
    }
    return { inline: read(':not(pre) > code'), block: read('pre code'), pre: read('pre') }
  })

  for (const code of [result.inline, result.block, result.pre]) {
    // 和文フォントに差し替えられず等幅を保つ。
    expect(code.fontFamily).toContain('monospace')
    // コード内に和欧間アキを入れない。
    expect(code.textAutospace).toBe('no-autospace')
  }
})

test('GFM: 添え字(sub/sup)は行の高さ(行送り)を乱さない', async ({ page }) => {
  const lineHeight = await page.evaluate(() => {
    const el = document.querySelector('[data-test="sub"]')
    if (el === null) {
      throw new Error('[data-test="sub"] が見つかりません')
    }
    return Number.parseFloat(getComputedStyle(el).getPropertyValue('line-height'))
  })

  expect(lineHeight).toBe(0)
})
