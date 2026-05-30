import { expect, test } from '@playwright/test'

// 見本帳を3エンジンで開き、getComputedStyle で「宣言が実際に効いているか」を検証する。
// 視覚的な美しさではなく、CSS の適用そのものを客観的に確かめる(ヘッドレスで実行可能)。

test.beforeEach(async ({ page }) => {
  await page.goto('/demo/index.html')
  await page.waitForSelector('[data-test="scope"]')
})

test('jp.core: スコープに禁則・折り返し・和欧アキが効き、本文の word-break は normal', async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    const el = document.querySelector('[data-test="scope"]')
    if (el === null) {
      throw new Error('[data-test="scope"] が見つかりません')
    }
    const cs = getComputedStyle(el)
    return {
      lineBreak: cs.getPropertyValue('line-break'),
      overflowWrap: cs.getPropertyValue('overflow-wrap'),
      wordBreak: cs.getPropertyValue('word-break'),
      textAutospace: cs.getPropertyValue('text-autospace'),
      supportsAutospace: CSS.supports('text-autospace: normal'),
    }
  })

  expect(result.lineBreak).toBe('strict')
  expect(result.overflowWrap).toBe('break-word')
  // 文節改行(auto-phrase)は見出しに限定したので、本文スコープは normal のまま。
  expect(result.wordBreak).toBe('normal')
  if (result.supportsAutospace) {
    expect(result.textAutospace).toBe('normal')
  }
})

test('jp.prose: 段落は字下げ・両端揃え・行間1.8、見出しは対象外', async ({ page }) => {
  const result = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector)
      if (el === null) {
        throw new Error(`${selector} が見つかりません`)
      }
      const cs = getComputedStyle(el)
      return {
        textIndent: Number.parseFloat(cs.getPropertyValue('text-indent')),
        textAlign: cs.getPropertyValue('text-align'),
        marginBlock: Number.parseFloat(cs.getPropertyValue('margin-top')),
        fontSize: Number.parseFloat(cs.getPropertyValue('font-size')),
        lineHeight: Number.parseFloat(cs.getPropertyValue('line-height')),
      }
    }
    return { paragraph: read('[data-test="paragraph"]'), heading: read('[data-test="heading"]') }
  })

  // 段落: 字下げ・両端揃え・段落間ギャップ0・行間1.8倍。
  expect(result.paragraph.textIndent).toBeGreaterThan(0)
  expect(result.paragraph.textAlign).toBe('justify')
  expect(result.paragraph.marginBlock).toBe(0)
  expect(result.paragraph.lineHeight / result.paragraph.fontSize).toBeCloseTo(1.8, 1)

  // 見出し: 字下げされず、両端揃えもされない(限定セレクタの退行検知)。
  expect(result.heading.textIndent).toBe(0)
  expect(result.heading.textAlign).not.toBe('justify')
})

test('jp.enhance: 段階強化は対応エンジンでのみ・対象要素にだけ適用される', async ({ page }) => {
  const result = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector)
      if (el === null) {
        throw new Error(`${selector} が見つかりません`)
      }
      return getComputedStyle(el)
    }
    const scope = read('[data-test="scope"]')
    const paragraph = read('[data-test="paragraph"]')
    const heading = read('[data-test="heading"]')
    return {
      spacingTrim: {
        supported: CSS.supports('text-spacing-trim: space-first'),
        value: scope.getPropertyValue('text-spacing-trim'),
      },
      hanging: {
        supported: CSS.supports('hanging-punctuation: first'),
        value: scope.getPropertyValue('hanging-punctuation'),
      },
      // 均等割りは本文段落に限定。
      textJustify: {
        supported: CSS.supports('text-justify: inter-character'),
        value: paragraph.getPropertyValue('text-justify'),
      },
      // 文節改行は見出しに限定。
      autoPhrase: {
        supported: CSS.supports('word-break: auto-phrase'),
        value: heading.getPropertyValue('word-break'),
      },
    }
  })

  if (result.spacingTrim.supported) {
    expect(result.spacingTrim.value).toContain('space-first')
  }
  if (result.hanging.supported) {
    expect(result.hanging.value).toContain('first')
  }
  if (result.textJustify.supported) {
    expect(result.textJustify.value).toContain('inter-character')
  }
  if (result.autoPhrase.supported) {
    expect(result.autoPhrase.value).toBe('auto-phrase')
  }
})

test('jp.richtext: ルビは親より小さく、強調は斜体でなく圏点になる', async ({ page }) => {
  const result = await page.evaluate(() => {
    const ruby = document.querySelector('[data-test="ruby"]')
    const rt = ruby?.querySelector('rt') ?? null
    const em = document.querySelector('[data-test="em"]')
    if (ruby === null || rt === null || em === null) {
      throw new Error('ruby / rt / em が見つかりません')
    }
    const emStyle = getComputedStyle(em)
    return {
      rtFontSize: Number.parseFloat(getComputedStyle(rt).getPropertyValue('font-size')),
      rubyFontSize: Number.parseFloat(getComputedStyle(ruby).getPropertyValue('font-size')),
      emFontStyle: emStyle.getPropertyValue('font-style'),
      emEmphasis: emStyle.getPropertyValue('text-emphasis-style'),
      supportsEmphasis: CSS.supports('text-emphasis-style: filled sesame'),
    }
  })

  expect(result.rtFontSize).toBeLessThan(result.rubyFontSize)
  expect(result.emFontStyle).toBe('normal')
  if (result.supportsEmphasis) {
    expect(result.emEmphasis).toContain('sesame')
  }
})

test('text-autospace は和欧間に実際にアキを挿入する(効果検証・トートロジー回避)', async ({
  page,
}) => {
  const result = await page.evaluate(() => {
    if (!CSS.supports('text-autospace: normal')) {
      return { supported: false, normal: 0, none: 0 }
    }
    const measure = (autospace: string) => {
      const span = document.createElement('span')
      span.lang = 'ja'
      span.style.whiteSpace = 'nowrap'
      span.style.setProperty('text-autospace', autospace)
      span.textContent = '日本語ABC漢字123かな'
      document.body.append(span)
      const width = span.getBoundingClientRect().width
      span.remove()
      return width
    }
    return { supported: true, normal: measure('normal'), none: measure('no-autospace') }
  })

  // 和欧間アキが挿入されるなら normal は no-autospace より広い(宣言が no-op でない証明)。
  if (result.supported) {
    expect(result.normal).toBeGreaterThan(result.none)
  }
})

test('引用: 和文ブロック引用は字下げ方式・引用内の段落は行頭字下げしない', async ({ page }) => {
  const result = await page.evaluate(() => {
    const quote = document.querySelector('[data-test="blockquote"]')
    if (quote === null) {
      throw new Error('[data-test="blockquote"] が見つかりません')
    }
    const para = quote.querySelector('p')
    if (para === null) {
      throw new Error('blockquote 内の p が見つかりません')
    }
    return {
      quotePadding: Number.parseFloat(
        getComputedStyle(quote).getPropertyValue('padding-inline-start'),
      ),
      paraIndent: Number.parseFloat(getComputedStyle(para).getPropertyValue('text-indent')),
    }
  })

  // 字下げ(padding-inline-start)で引用を示す。欧文的な左罫線は使わない。
  expect(result.quotePadding).toBeGreaterThan(0)
  // 引用は全体の字下げで示すため、引用内の段落は行頭字下げしない。
  expect(result.paraIndent).toBe(0)
})

test('jp.utilities: 縦書き(.jp-vertical)・縦中横(.jp-tcy)・ルビ位置が効く', async ({ page }) => {
  const result = await page.evaluate(() => {
    const read = (selector: string) => {
      const el = document.querySelector(selector)
      if (el === null) {
        throw new Error(`${selector} が見つかりません`)
      }
      return getComputedStyle(el)
    }
    return {
      writingMode: read('[data-test="vertical"]').getPropertyValue('writing-mode'),
      tcy: read('[data-test="tcy"]').getPropertyValue('text-combine-upright'),
      rubyPosition: read('[data-test="vruby"]').getPropertyValue('ruby-position'),
    }
  })

  expect(result.writingMode).toBe('vertical-rl')
  expect(result.tcy).toBe('all')
  // ルビ位置 over(縦組みでは自動で行の右側に付く)。
  expect(result.rubyPosition).toContain('over')
})
