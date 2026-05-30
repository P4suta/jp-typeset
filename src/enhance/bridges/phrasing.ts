/**
 * jp-typeset/enhance — 文節改行ブリッジ(旗艦)
 *
 * word-break:auto-phrase 非対応エンジン(Safari/Firefox)向けに、BudouX で見出し・短文を
 * 文節単位に区切り、境界へ <wbr> を挿入する。native auto-phrase があれば完全 no-op。
 *
 * BudouX は安定公開 API の parser.parse(text): string[] のみ使う(HTMLProcessor 等の
 * 内部仕様には依存しない)。自前のテキストノード走査で <wbr> を挿し、ZWSP を使わないので
 * コピペ・スクリーンリーダー・検索を汚さない。インライン要素(em/リンク)は構造を保つ。
 */
import { collectTargets, PHRASING_TARGETS } from '../scope.js'
import type { Bridge } from '../types.js'

const PHRASED_MARKER = 'data-jp-phrased'
const WBR_MARKER = 'data-jp-wbr'
// ルビは単位を崩さないため、等幅は文字組みを持ち込まないため分割対象外。em 等は分割してよい。
const SKIP_INSIDE = 'ruby, rt, rp, code, kbd, samp, pre'

const supportsNative = (): boolean => CSS.supports('word-break', 'auto-phrase')

/** 要素内のテキストノードを集める(ルビ・等幅の内側と空テキストは除外)。 */
function collectTextNodes(el: Element): Text[] {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  const nodes: Text[] = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    const parent = text.parentElement
    if (parent !== null && parent.closest(SKIP_INSIDE) !== null) continue
    if (text.data.length === 0) continue
    nodes.push(text)
  }
  return nodes
}

/** 文節セグメント列から、境界に <wbr> を挟んだ DocumentFragment を組む(本文は不変)。 */
function buildSegmentedFragment(segments: readonly string[]): DocumentFragment {
  const fragment = document.createDocumentFragment()
  segments.forEach((segment, index) => {
    if (index > 0) {
      const wbr = document.createElement('wbr')
      wbr.setAttribute(WBR_MARKER, '')
      fragment.append(wbr)
    }
    fragment.append(segment)
  })
  return fragment
}

/** 要素内のテキストノードを走査し、文節境界に <wbr> を挿入する(インライン要素は保持)。 */
function insertPhraseBreaks(el: Element, parse: (text: string) => string[]): void {
  for (const textNode of collectTextNodes(el)) {
    const segments = parse(textNode.data)
    if (segments.length <= 1) continue
    textNode.replaceWith(buildSegmentedFragment(segments))
  }
}

export const phrasing: Bridge = {
  name: 'phrasing',
  isNativeSupported: supportsNative,
  async apply(root) {
    if (supportsNative()) return
    const targets = collectTargets(root, PHRASING_TARGETS).filter(
      (el) => !el.hasAttribute(PHRASED_MARKER),
    )
    if (targets.length === 0) return

    const { loadDefaultJapaneseParser } = await import('budoux')
    const parser = loadDefaultJapaneseParser()
    for (const el of targets) {
      insertPhraseBreaks(el, (text) => parser.parse(text))
      // CSS の word-break:auto-phrase と等価: 対象要素でだけ core の normal を上書きし、
      // 挿入した <wbr> の位置(=文節境界)でのみ改行させる。
      const element = el as HTMLElement
      element.style.setProperty('word-break', 'keep-all')
      el.setAttribute(PHRASED_MARKER, '')
    }
  },
}
