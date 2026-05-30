import { defineConfig } from 'vite'

// enhance 層のライブラリビルド。rollupOptions.external は Rollup 1呼び出しで global なため、
// ESM(budoux を external) と IIFE(budoux を inline) を --mode で分けて 2 パス実行する。
// 型定義(dist/enhance.d.ts)は tsc(build:types)が別途出力する。
//   pnpm vite build -c vite.lib.config.ts --mode esm   → dist/enhance.js
//   pnpm vite build -c vite.lib.config.ts --mode iife  → dist/enhance.iife.js
export default defineConfig(({ mode }) => {
  const iife = mode === 'iife'
  return {
    build: {
      emptyOutDir: false, // dist の CSS 成果物(Lightning CSS 出力)を消さない
      target: 'es2023',
      minify: iife, // CDN 版のみ minify。ESM は再バンドル前提で可読のまま。
      lib: {
        entry: iife ? 'src/enhance.iife.ts' : 'src/enhance.ts',
        formats: [iife ? 'iife' : 'es'],
        fileName: () => (iife ? 'enhance.iife.js' : 'enhance.js'),
        ...(iife ? { name: 'jpTypeset' } : {}),
      },
      // IIFE は単一ファイル(codeSplitting なし)なので dynamic import('budoux') は自動で内包される。
      rollupOptions: iife ? {} : { external: ['budoux'] },
    },
  }
})
