/**
 * jp-typeset/enhance — 会話文の先頭字下げ精緻化(Refinement)
 *
 * CSS は段落の先頭文字を判定できない(:has 不可)ため一律字下げしているが、JLReq では
 * 行頭が始め括弧類のとき字下げ量を調整する。これはその精緻化。ネイティブ等価が無いので
 * Bridge ではなく opt-in の Refinement(既定 OFF)。既存の「一律字下げ」を意図的に reverse する。
 */
import { collectTargets } from '../scope.js'

const DIALOGUE_MARKER = 'data-jp-dialogue'
// 始め括弧類(JLReq cl-01)。これで始まる段落は行頭に半角分の空きが既にあるため字下げを詰める。
const OPENING_BRACKETS = /^[「『（《〈【〔｛［“"']/u

/** root 配下の段落のうち、始め括弧で始まるものの先頭字下げを 0 にする(冪等)。 */
export function applyDialogueIndent(root: ParentNode): void {
  const paragraphs = collectTargets(root, ['p']).filter((el) => !el.hasAttribute(DIALOGUE_MARKER))
  for (const el of paragraphs) {
    const head = (el.textContent ?? '').replace(/^\s+/u, '')
    if (!OPENING_BRACKETS.test(head)) continue
    const element = el as HTMLElement
    element.style.setProperty('text-indent', '0')
    element.setAttribute(DIALOGUE_MARKER, '')
  }
}
