/**
 * jp-typeset/enhance — 「消えるブリッジ」ランタイム(公開 API)
 *
 * CSS だけでは全ブラウザで揃わない JLReq 項目を、CSS.supports で feature-detect して
 * native が無い所だけ JS で補う。native 対応が来たら各ブリッジは自動で no-op になる。
 * CSS コア(import 'jp-typeset')とは独立しており、この層は完全に opt-in。
 *
 *   import { enhance } from 'jp-typeset/enhance'
 *   enhance()                              // 旗艦(文節改行)のみ
 *   enhance(document, { hanging: true })   // 実験ブリッジを追加
 */
import { hanging } from './enhance/bridges/hanging.js'
import { phrasing } from './enhance/bridges/phrasing.js'
import { spacingTrim } from './enhance/bridges/spacing-trim.js'
import { applyDialogueIndent } from './enhance/refinements/dialogue-indent.js'
import type { EnhanceOptions } from './enhance/types.js'

export { hanging } from './enhance/bridges/hanging.js'
export { phrasing } from './enhance/bridges/phrasing.js'
export { spacingTrim } from './enhance/bridges/spacing-trim.js'
export type { Bridge, EnhanceOptions } from './enhance/types.js'

/** resize で再計算が要る layout 依存ブリッジを、debounce して再適用する。 */
function observeLayout(scope: ParentNode): void {
  if (typeof ResizeObserver === 'undefined') return
  let scheduled = false
  const observer = new ResizeObserver(() => {
    if (scheduled) return
    scheduled = true
    requestAnimationFrame(() => {
      scheduled = false
      hanging.apply(scope)
    })
  })
  observer.observe(scope instanceof Element ? scope : document.documentElement)
}

/**
 * 消えるブリッジ層を適用する。既定は旗艦 phrasing のみ。SSR/非DOM 環境では安全に no-op。
 * 冪等なので SPA の再描画後に再呼び出ししてよい(処理済み要素はスキップされる)。
 */
export async function enhance(root?: ParentNode, options: EnhanceOptions = {}): Promise<void> {
  if (typeof document === 'undefined') return
  const scope = root ?? document

  const pending: Array<Promise<void> | void> = []
  if (options.phrasing ?? true) pending.push(phrasing.apply(scope))
  if (options.hanging ?? false) pending.push(hanging.apply(scope))
  if (options.spacingTrim ?? false) pending.push(spacingTrim.apply(scope))
  await Promise.all(pending)

  if (options.dialogueIndent ?? false) applyDialogueIndent(scope)
  if ((options.observe ?? false) && (options.hanging ?? false)) observeLayout(scope)
}
