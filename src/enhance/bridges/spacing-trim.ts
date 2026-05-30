/**
 * jp-typeset/enhance — 約物アキ詰めブリッジ(実験)
 *
 * text-spacing-trim 非対応エンジン向けの best-effort polyfill。隣り合う全角約物の間の
 * 余分なアキを詰める(layout 非依存の部分集合)。行頭依存の挙動(space-first の行頭半角化)は
 * 位置測定が要るため native 専用。全角約物にだけ作用させ、本文字形は変えない(品質劣化を避ける)。
 *
 * native text-spacing-trim があれば完全 no-op。約物を span で包み負の余白を与える方式で、
 * ブロック単位のマーカーで冪等。
 */
import { collectTargets } from '../scope.js'
import type { Bridge } from '../types.js'

const DONE_MARKER = 'data-jp-spacing-done'
const SPAN_MARKER = 'data-jp-spacing'
const SKIP_INSIDE = 'code, kbd, samp, pre'
// 終わり約物(句読点・閉じ括弧)の直後に 始め約物/句読点 が続くと送りが二重に空く。
const TRAILING = /[、。，．）｝」』】〕》〉]/u
const FOLLOWING = /[（｛「『【〔《〈、。，．]/u
const TIGHTEN = '-0.5em'

// blockquote は内側の p で処理されるため対象に含めない(二重処理回避)。
const SPACING_TARGETS = [
  'p',
  'li',
  'dd',
  'dt',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'caption',
  'figcaption',
  'th',
  'summary',
] as const
const SPACING_SELECTOR = SPACING_TARGETS.join(', ')

const supportsNative = (): boolean => CSS.supports('text-spacing-trim', 'space-first')

/** ブロック直属のテキストノード(等幅の内側と、入れ子ターゲットの文字は除く)。 */
function ownTextNodes(el: Element): Text[] {
  const nodes: Text[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    const parent = text.parentElement
    if (parent === null) continue
    if (parent.closest(SKIP_INSIDE) !== null) continue
    if (parent.closest(SPACING_SELECTOR) !== el) continue
    nodes.push(text)
  }
  return nodes
}

/** 終わり約物の 1 文字を span で包み、後ろの送りを詰める。 */
function wrapTighten(text: Text, index: number): void {
  const tail = text.splitText(index)
  tail.splitText(1)
  const span = document.createElement('span')
  span.setAttribute(SPAN_MARKER, '')
  span.style.setProperty('margin-inline-end', TIGHTEN)
  tail.replaceWith(span)
  span.append(tail)
}

/** テキストノード内の「終わり約物→始め約物」の境界を詰める(後ろから包んで index ずれを防ぐ)。 */
function tightenText(text: Text): void {
  const positions: number[] = []
  for (let i = 0; i < text.data.length - 1; i++) {
    const current = text.data[i]
    const next = text.data[i + 1]
    if (
      current !== undefined &&
      next !== undefined &&
      TRAILING.test(current) &&
      FOLLOWING.test(next)
    ) {
      positions.push(i)
    }
  }
  for (const index of positions.reverse()) wrapTighten(text, index)
}

export const spacingTrim: Bridge = {
  name: 'spacingTrim',
  isNativeSupported: supportsNative,
  apply(root) {
    if (supportsNative()) return
    const blocks = collectTargets(root, SPACING_TARGETS).filter(
      (el) => !el.hasAttribute(DONE_MARKER),
    )
    for (const el of blocks) {
      for (const text of ownTextNodes(el)) tightenText(text)
      el.setAttribute(DONE_MARKER, '')
    }
  },
}
