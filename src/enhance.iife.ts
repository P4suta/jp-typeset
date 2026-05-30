/**
 * jp-typeset/enhance — CDN 自動初期化エントリ(IIFE)
 *
 * <script src="…/enhance.iife.js" defer></script> 一発で、lang="ja"/.jp を自動強化する
 * (MathJax 的な貼るだけ体験)。feature-gate と冪等は各ブリッジが担保。budoux と日本語モデルを
 * 内包する単一ファイル。明示 API は window.jpTypeset.enhance としても公開する。
 */
import { enhance } from './enhance.js'

function run(): void {
  // 自動では旗艦(文節改行)のみ適用する。実験ブリッジは明示 API からのみ。
  void enhance()
    .then(() => {
      // 自動初期化の完了シグナル(native で no-op でも resolve 後に付く)。
      // ESM の enhance() は Promise を返すので不要だが、IIFE には待てる対象が無いため DOM で示す。
      document.documentElement.setAttribute('data-jp-enhanced', '')
    })
    .catch((error: unknown) => {
      console.error('[jp-typeset] enhance failed:', error)
    })
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run, { once: true })
} else {
  run()
}

export { enhance } from './enhance.js'
