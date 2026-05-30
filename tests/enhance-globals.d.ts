// テスト用の window.enhance 型。enhance-esm.html ハーネスが公開する明示 API を、
// enhance.spec.ts / enhance.visual.spec.ts の両方が共有する(重複 declare global を避ける)。
interface EnhanceTestOptions {
  phrasing?: boolean
  dialogueIndent?: boolean
  hanging?: boolean
  spacingTrim?: boolean
  observe?: boolean
}

interface Window {
  enhance: (root?: ParentNode, options?: EnhanceTestOptions) => Promise<void>
}
