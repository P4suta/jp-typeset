/**
 * jp-typeset/enhance — 型定義
 *
 * Bridge = ネイティブ CSS 機能を CSS.supports で feature-detect して補い、
 * native 対応が来たら自動で no-op になる「消えるブリッジ」。jp.enhance レイヤー(CSS)の
 * JS 版で、対応エンジンでは apply が完全に何もしない。
 */

/** ネイティブ CSS の穴を埋める「消えるブリッジ」の共通契約。 */
export interface Bridge {
  /** モジュール識別名。対応する CSS 機能名と対にする(冪等マーカー・ログ用)。 */
  readonly name: string
  /** ネイティブ CSS が当該機能を提供しているか。true なら apply は完全 no-op。 */
  isNativeSupported(): boolean
  /** root 配下の対象要素へ補完を適用する(冪等・非破壊・既存DOM尊重)。 */
  apply(root: ParentNode): Promise<void> | void
}

/** enhance() の挙動オプション。既定は旗艦 phrasing のみ有効。 */
export interface EnhanceOptions {
  /** BudouX 文節改行。既定 true。native word-break:auto-phrase があれば no-op。 */
  phrasing?: boolean
  /** 会話文(始め括弧始まり)段落の先頭字下げ精緻化。既定 false(opt-in)。 */
  dialogueIndent?: boolean
  /** 【実験】ぶら下げ組の polyfill。既定 false。native hanging-punctuation があれば no-op。 */
  hanging?: boolean
  /** 【実験】約物アキ詰めの polyfill。既定 false。native text-spacing-trim があれば no-op。 */
  spacingTrim?: boolean
  /** 【実験】layout 依存ブリッジ(ぶら下げ)を ResizeObserver で再適用する。既定 false。 */
  observe?: boolean
}
