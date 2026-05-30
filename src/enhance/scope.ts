/**
 * jp-typeset/enhance — スコープ判定の単一の真実源(SSOT)
 *
 * ⚠ ここの対象要素・スコープ条件は src/enhance.css のセレクタと一字一句揃えること。
 *    JS ブリッジは jp.enhance レイヤーと対をなし、同じ要素・同じ言語スコープにだけ効く。
 */

/** 文節改行(BudouX)の対象。enhance.css の word-break:auto-phrase と同一集合。
 *  本文(p)には当てない(Chrome 公式も本文への auto-phrase は非推奨)。 */
export const PHRASING_TARGETS = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'caption',
  'figcaption',
  'dt',
  'th',
  'summary',
] as const

/** 本文ブロック。実験的ブリッジ(ぶら下げ)の対象。enhance.css の本文限定と同一。 */
export const BODY_TARGETS = ['p', 'li', 'dd', 'blockquote'] as const

/** :where(:lang(ja), .jp) を JS でミラー。継承された lang="ja" も尊重する。 */
export function isJapaneseScope(el: Element): boolean {
  return el.closest(':lang(ja), .jp') !== null
}

/** root 配下で「日本語スコープ内 かつ 指定タグ」の要素を列挙する。 */
export function collectTargets(root: ParentNode, tags: readonly string[]): Element[] {
  const selector = tags.join(', ')
  return Array.from(root.querySelectorAll(selector)).filter(isJapaneseScope)
}
