import { expect, test } from '@playwright/test'

// enhance(消えるブリッジ層)を 3 エンジンで検証する。computed-style では <wbr> による
// 改行可否を測れないため、DOM 変異を決定論的にアサートする。各ブリッジは CSS.supports で
// ゲートされ native 対応エンジンでは no-op になる — その no-op 自体をページ内の CSS.supports
// を基準に検証する(エンジン名はハードコードしない。将来 native 対応が来ても自動で正しくなる)。
// window.enhance の型は tests/enhance-globals.d.ts で共有する。

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/enhance-esm.html')
  await page.waitForSelector('[data-harness-ready]')
})

test('phrasing: 見出しに文節境界(wbr)を入れ、本文には入れない・native では no-op', async ({
  page,
}) => {
  await page.evaluate(() => window.enhance())
  const result = await page.evaluate(() => {
    const wbrCount = (selector: string) =>
      document.querySelector(selector)?.querySelectorAll('wbr[data-jp-wbr]').length ?? -1
    return {
      supported: CSS.supports('word-break', 'auto-phrase'),
      heading: wbrCount('[data-test="heading-plain"]'),
      body: wbrCount('[data-test="body-para"]'),
    }
  })

  // 見出し: native 対応なら JS は no-op(0)、非対応なら BudouX が文節境界に wbr を入れる(>0)。
  if (result.supported) {
    expect(result.heading).toBe(0)
  } else {
    expect(result.heading).toBeGreaterThan(0)
  }
  // 本文(p)はスコープ外。どのエンジンでも常に wbr を入れない。
  expect(result.body).toBe(0)
})

test('phrasing: 冪等(再実行で wbr が二重にならない)', async ({ page }) => {
  const headingWbr = () =>
    page.evaluate(
      () =>
        document.querySelector('[data-test="heading-plain"]')?.querySelectorAll('wbr').length ?? -1,
    )

  await page.evaluate(() => window.enhance())
  const first = await headingWbr()
  await page.evaluate(() => window.enhance())
  const second = await headingWbr()

  // 再実行で wbr が増えない(0===0 か N===N)。native でも非対応でも成立。
  expect(second).toBe(first)
  const result = await page.evaluate(() => ({
    supported: CSS.supports('word-break', 'auto-phrase'),
    marked: document.querySelectorAll('[data-test="heading-plain"][data-jp-phrased]').length,
  }))
  // 処理済みマーカーは、適用された場合だけ 1 度付く。native では no-op なので 0。
  expect(result.marked).toBe(result.supported ? 0 : 1)
})

test('phrasing: 見出し内のルビ・圏点を壊さない', async ({ page }) => {
  await page.evaluate(() => window.enhance())
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-test="heading-markup"]')
    if (el === null) {
      throw new Error('heading-markup が見つかりません')
    }
    return {
      ruby: el.querySelectorAll('ruby').length,
      rt: el.querySelectorAll('rt').length,
      em: el.querySelectorAll('em').length,
      wbrInRuby: el.querySelectorAll('ruby wbr').length,
    }
  })

  expect(result.ruby).toBe(1)
  expect(result.rt).toBe(1)
  expect(result.em).toBe(1)
  // ルビの中は分割しない(読みの単位を崩さない)。
  expect(result.wbrInRuby).toBe(0)
})

test('dialogue-indent: opt-in で始め括弧段落の字下げを 0 にする', async ({ page }) => {
  const indentOf = (selector: string) =>
    page.evaluate((sel) => {
      const el = document.querySelector(sel)
      if (el === null) {
        throw new Error(`${sel} が見つかりません`)
      }
      return Number.parseFloat(getComputedStyle(el).textIndent)
    }, selector)

  await page.evaluate(() => window.enhance())
  const beforeOptIn = await indentOf('[data-test="dialogue"]')
  await page.evaluate(() => window.enhance(document, { dialogueIndent: true }))
  const afterOptIn = await indentOf('[data-test="dialogue"]')

  // 既定では一律字下げが残り(>0)、opt-in で始め括弧段落だけ 0 になる。
  expect(beforeOptIn).toBeGreaterThan(0)
  expect(afterOptIn).toBe(0)
})

test('hanging(実験): first は始め括弧をぶら下げ・native(Safari)では no-op', async ({ page }) => {
  await page.evaluate(() => window.enhance(document, { hanging: true }))
  const result = await page.evaluate(() => ({
    supported: CSS.supports('hanging-punctuation', 'first'),
    spans:
      document.querySelector('[data-test="hanging-first"]')?.querySelectorAll('span[data-jp-hang]')
        .length ?? -1,
  }))

  if (result.supported) {
    expect(result.spans).toBe(0)
  } else {
    // 行頭の開き括弧「を版面外へ逃がす span が付く(layout 非依存で決定論的)。
    expect(result.spans).toBeGreaterThanOrEqual(1)
  }
})

test('spacing-trim(実験): 連続約物を詰め・native(Chromium)では no-op', async ({ page }) => {
  await page.evaluate(() => window.enhance(document, { spacingTrim: true }))
  const result = await page.evaluate(() => ({
    supported: CSS.supports('text-spacing-trim', 'space-first'),
    spans:
      document
        .querySelector('[data-test="spacing-para"]')
        ?.querySelectorAll('span[data-jp-spacing]').length ?? -1,
  }))

  if (result.supported) {
    expect(result.spans).toBe(0)
  } else {
    // 」。 と 。（ の隣接約物の境界を詰める span が付く。
    expect(result.spans).toBeGreaterThan(0)
  }
})

test('縦書き(.jp-vertical): 全ブリッジが writing-mode に適応して動く', async ({ page }) => {
  await page.evaluate(() =>
    window.enhance(document, {
      phrasing: true,
      dialogueIndent: true,
      hanging: true,
      spacingTrim: true,
    }),
  )
  const result = await page.evaluate(() => {
    const need = (selector: string): Element => {
      const el = document.querySelector(selector)
      if (el === null) {
        throw new Error(`${selector} が見つかりません`)
      }
      return el
    }
    const spans = (selector: string, inner: string) => need(selector).querySelectorAll(inner).length
    return {
      autoPhrase: CSS.supports('word-break', 'auto-phrase'),
      hangingNative: CSS.supports('hanging-punctuation', 'first'),
      spacingNative: CSS.supports('text-spacing-trim', 'space-first'),
      writingMode: getComputedStyle(need('[data-test="v-heading"]')).writingMode,
      headingWbr: spans('[data-test="v-heading"]', 'wbr[data-jp-wbr]'),
      hangSpans: spans('[data-test="v-hanging-first"]', 'span[data-jp-hang]'),
      spacingSpans: spans('[data-test="v-spacing"]', 'span[data-jp-spacing]'),
      dialogueIndent: Number.parseFloat(
        getComputedStyle(need('[data-test="v-dialogue"]')).textIndent,
      ),
      markupRuby: spans('[data-test="v-heading-markup"]', 'ruby'),
      markupEm: spans('[data-test="v-heading-markup"]', 'em'),
      markupRubyWbr: spans('[data-test="v-heading-markup"]', 'ruby wbr'),
    }
  })

  // 縦書きが効いている前提。
  expect(result.writingMode).toBe('vertical-rl')
  // phrasing: native 非対応なら縦の見出しにも文節境界 wbr が入る(writing-mode 非依存)。
  if (!result.autoPhrase) {
    expect(result.headingWbr).toBeGreaterThan(0)
  }
  // hanging: native 非対応なら、少なくとも行頭の開き括弧(first)が縦の行頭側(上)へぶら下がる
  // (論理マージン margin-inline-start が縦では上方向に適応する)。
  if (!result.hangingNative) {
    expect(result.hangSpans).toBeGreaterThanOrEqual(1)
  }
  // spacing-trim: native 非対応なら連続約物の詰め span が縦でも付く(margin-inline-end が論理)。
  if (!result.spacingNative) {
    expect(result.spacingSpans).toBeGreaterThan(0)
  }
  // dialogue-indent: 始め括弧段落の text-indent(縦では行送り方向)が 0 になる。
  expect(result.dialogueIndent).toBe(0)
  // 縦書きでも見出し内のルビ・圏点は壊れない(ルビの中は分割しない)。
  expect(result.markupRuby).toBe(1)
  expect(result.markupEm).toBe(1)
  expect(result.markupRubyWbr).toBe(0)
})

test('IIFE: CDN スクリプトが自動初期化し、束ねた BudouX が実際に動く', async ({ page }) => {
  await page.goto('/demo/enhance-iife.html')
  // 自動初期化の完了を待つ(全エンジンで marker が付く。native は no-op でも resolve 後に付く)。
  await page.waitForSelector('[data-jp-enhanced]')

  const result = await page.evaluate(() => ({
    kind: typeof (window as unknown as { jpTypeset?: { enhance?: unknown } }).jpTypeset?.enhance,
    supported: CSS.supports('word-break', 'auto-phrase'),
    wbr:
      document.querySelector('[data-test="heading-plain"]')?.querySelectorAll('wbr[data-jp-wbr]')
        .length ?? -1,
  }))

  // 明示 API が window.jpTypeset.enhance として公開される。
  expect(result.kind).toBe('function')
  // native 対応なら自動初期化は no-op(wbr 0)、非対応なら束ねた BudouX がパースして wbr を入れる(>0)。
  // これで「IIFE 成果物に内包した BudouX が実際に動く」ことを検証する(.catch で握り潰される実行時失敗を緑のまま見逃さない)。
  if (result.supported) {
    expect(result.wbr).toBe(0)
  } else {
    expect(result.wbr).toBeGreaterThan(0)
  }
})
