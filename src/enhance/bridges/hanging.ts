/**
 * jp-typeset/enhance — ぶら下げ組ブリッジ(実験)
 *
 * hanging-punctuation 非対応エンジン(Safari 以外)向けの best-effort polyfill。
 *   first     … ブロック先頭の開き括弧を版面外(行頭側)へ逃がす。layout 非依存。
 *   allow-end … 行末の句読点を版面外(行末側)へ逃がす。行ごとの位置測定に依存するため
 *               reflow で崩れる → enhance({ observe:true }) で resize 時に再適用する。
 *
 * native hanging-punctuation があれば完全 no-op。約物を span で包んで負の余白を与える方式で、
 * apply は毎回 reset→再計算するため冪等(再適用で二重にならない)。
 */
import { BODY_TARGETS, collectTargets } from '../scope.js'
import type { Bridge } from '../types.js'

const HANG_MARKER = 'data-jp-hang'
const SKIP_INSIDE = 'ruby, rt, rp, code, kbd, samp, pre'
const LINE_END_PUNCT = /[、。，．]/u
const OPENING_BRACKET = /[「『（《〈【〔｛［“"']/u
// 全角約物の半分を版面外へ。負の margin で送り幅を詰め、句読点/括弧を端の外側に置く。
const HANG_WIDTH = '-0.5em'
// 行末判定の許容(px): 句読点の字面が行末に十分近ければ行末とみなす。
const EDGE_TOLERANCE = 0.5

interface CharRef {
  readonly node: Text
  readonly index: number
}

interface Axis {
  // 行(横組み)/段(縦組み)を識別する block 軸の座標(行ごとに変わる)。
  lineKey(rect: DOMRect): number
  // inline 軸での行末側の位置(大きいほど行末に近い)。
  lineEnd(rect: DOMRect): number
}

const supportsNative = (): boolean => CSS.supports('hanging-punctuation', 'first')

/** 以前に挿入したぶら下げ span を外して元のテキストへ戻す(再適用前の reset)。 */
function resetHang(el: Element): void {
  for (const span of Array.from(el.querySelectorAll(`span[${HANG_MARKER}]`))) {
    span.replaceWith(...Array.from(span.childNodes))
  }
  el.normalize()
}

/** 1 文字を span で包み、行頭側/行末側へ負の余白でぶら下げる(対象テキストは保持)。 */
function wrapChar(ref: CharRef, side: 'start' | 'end'): void {
  const tail = ref.node.splitText(ref.index)
  tail.splitText(1)
  const span = document.createElement('span')
  span.setAttribute(HANG_MARKER, '')
  span.style.setProperty(`margin-inline-${side}`, HANG_WIDTH)
  tail.replaceWith(span)
  span.append(tail)
}

/** ブロック内の最初の非空白テキストノード。 */
function firstTextNode(el: Element): Text | null {
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    if (text.data.trim().length > 0) return text
  }
  return null
}

/** first: ブロック先頭の開き括弧を行頭側へぶら下げる。 */
function hangFirst(el: Element): void {
  const node = firstTextNode(el)
  if (node === null) return
  const index = node.data.search(/\S/u)
  if (index < 0) return
  const ch = node.data[index]
  if (ch === undefined || !OPENING_BRACKET.test(ch)) return
  wrapChar({ node, index }, 'start')
}

/** 要素の writing-mode から、行のグループ化と「行末」方向を表す軸を決める。
 *  縦組みは段が水平に並び inline が上→下に進むので行末=下端、横組みは行末=右端(LTR)。 */
function axisOf(el: Element): Axis {
  const style = getComputedStyle(el)
  const wm = style.writingMode
  if (wm.startsWith('vertical') || wm.startsWith('sideways')) {
    return { lineKey: (r) => Math.round(r.left), lineEnd: (r) => r.bottom }
  }
  const rtl = style.direction === 'rtl'
  return { lineKey: (r) => Math.round(r.top), lineEnd: (r) => (rtl ? -r.left : r.right) }
}

/** 行(段)ごとの行末位置を「block 軸座標(丸め) → 行末位置の最大」で得る。 */
function lineEndEdges(el: Element, axis: Axis): Map<number, number> {
  const range = document.createRange()
  range.selectNodeContents(el)
  const edges = new Map<number, number>()
  for (const rect of Array.from(range.getClientRects())) {
    const key = axis.lineKey(rect)
    const end = axis.lineEnd(rect)
    const prev = edges.get(key)
    if (prev === undefined || end > prev) edges.set(key, end)
  }
  return edges
}

/** 文字の矩形(描画されていなければ null)。 */
function charRect(ref: CharRef): DOMRect | null {
  const range = document.createRange()
  range.setStart(ref.node, ref.index)
  range.setEnd(ref.node, ref.index + 1)
  const rect = range.getBoundingClientRect()
  return rect.width === 0 && rect.height === 0 ? null : rect
}

/** block 軸座標が最も近い行の行末位置を返す(許容外なら undefined)。 */
function lineEndAt(edges: Map<number, number>, key: number): number | undefined {
  let best: number | undefined
  let bestDiff = Number.POSITIVE_INFINITY
  for (const [lineKey, end] of edges) {
    const diff = Math.abs(lineKey - key)
    if (diff < bestDiff && diff <= 4) {
      best = end
      bestDiff = diff
    }
  }
  return best
}

/** ブロック内の行末句読点(ruby/等幅の内側は除く)を列挙する。 */
function lineEndPunctuation(el: Element): CharRef[] {
  const refs: CharRef[] = []
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    const text = node as Text
    const parent = text.parentElement
    if (parent !== null && parent.closest(SKIP_INSIDE) !== null) continue
    for (let i = 0; i < text.data.length; i++) {
      const ch = text.data[i]
      if (ch !== undefined && LINE_END_PUNCT.test(ch)) refs.push({ node: text, index: i })
    }
  }
  return refs
}

/** allow-end: 行末に来た句読点だけを版面外へぶら下げる(測定→後ろから包む)。
 *  横組み・縦組みの両方に対応(writing-mode から軸を決めて行末を判定する)。 */
function hangLineEnd(el: Element): void {
  const axis = axisOf(el)
  const edges = lineEndEdges(el, axis)
  if (edges.size === 0) return
  const targets: CharRef[] = []
  for (const ref of lineEndPunctuation(el)) {
    const rect = charRect(ref)
    if (rect === null) continue
    const end = lineEndAt(edges, axis.lineKey(rect))
    if (end !== undefined && axis.lineEnd(rect) >= end - EDGE_TOLERANCE) targets.push(ref)
  }
  // DOM 変異で後続の index がずれないよう、文書順の後ろから包む。
  for (const ref of targets.reverse()) wrapChar(ref, 'end')
}

export const hanging: Bridge = {
  name: 'hanging',
  isNativeSupported: supportsNative,
  apply(root) {
    if (supportsNative()) return
    for (const el of collectTargets(root, BODY_TARGETS)) {
      resetHang(el)
      hangFirst(el)
      hangLineEnd(el)
    }
  },
}
