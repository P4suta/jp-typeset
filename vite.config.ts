import { defineConfig } from 'vite'

// 見本帳(demo/)と成果物(dist/)を素の静的ファイルとして配信するだけの最小構成。
export default defineConfig({
  appType: 'mpa',
  server: {
    fs: { allow: ['.'] },
  },
})
