import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// プレビュー(全ページ丸っと生成)専用の設定。
// 本体の playwright.config.ts は *.spec.ts だけを回帰テストとして拾うため、
// *.preview.ts はここからしか実行されない(回帰ゲートに混ざらない)。
export default defineConfig({
  ...base,
  testMatch: '**/*.preview.ts',
})
