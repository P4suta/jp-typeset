# jp-typeset

[![CI](https://github.com/P4suta/jp-typeset/actions/workflows/ci.yml/badge.svg)](https://github.com/P4suta/jp-typeset/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](./LICENSE)

日本語Web組版の「標準的な書き方の規則」を、最新の CSS だけで実現するドロップインCSSプリセット。
`<link>` 一発で、**文頭字下げ・禁則処理・約物のアキ詰め・和欧間アキ・両端揃え・ぶら下げ・文節改行・ルビ・圏点(傍点)**が効く。

スクラッチの組版エンジンではない。意見を持った1枚の CSS を、対応ブラウザに素直に流し込むだけ。
未対応の機能は無視されても本文を壊さず、ブラウザが対応すれば自動でよくなる(`@supports` による段階強化)。

> [!NOTE]
> 標準のセマンティックHTMLだけを対象にする独立したCSSであり、特定の記法やフレームワークには依存しない。
> 横書きのインライン組版の仕上げに特化しており、縦書き・縦中横・ページ組版・原稿用紙のマス目グリッドは**対象外**。

## クイックスタート

### CDN(貼るだけ)

```html
<html lang="ja">
  <head>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jp-typeset/dist/jp-typeset.min.css" />
  </head>
  <body>
    <p>吾輩は猫である。名前はまだ無い。</p>
  </body>
</html>
```

### npm

```sh
pnpm add jp-typeset
```

```css
@import "jp-typeset"; /* または "jp-typeset/min" */
```

## 適用範囲

`lang="ja"` が付いた要素に**自動適用**される。明示的に効かせたいときは `class="jp"` を付ける。

```html
<article lang="ja">…</article>
<div class="jp">…</div>
```

すべてのルールは `:where()` で**詳細度ゼロ**に書かれているので、利用者側の CSS で何も考えず上書きできる。

## 何をするか

| 機能                                 | プロパティ                             | ネイティブ対応(2026)   |
| ------------------------------------ | -------------------------------------- | ---------------------- |
| 禁則処理(行頭・行末)                 | `line-break: strict`                   | 全エンジン             |
| 和文の折り返し                       | `word-break: normal` + `overflow-wrap` | 全エンジン             |
| 和欧間アキ・和数アキ                 | `text-autospace: normal`               | 全4エンジン(2025-11〜) |
| 文頭字下げ(段落)                     | `text-indent`                          | 全エンジン             |
| ルビ(ふりがな)                       | 標準の `<ruby>` / `<rt>`               | 全エンジン             |
| 強調を圏点(傍点)で                   | `<em>` → `text-emphasis`               | 全エンジン             |
| ブロック引用(和文の字下げ作法)       | `blockquote` 字下げ(左罫線なし)        | 全エンジン             |
| 両端揃え・行間                       | `text-align: justify` / `line-height`  | 全エンジン             |
| 約物のアキ詰め・行頭開き括弧の半角化 | `text-spacing-trim`                    | Chromium のみ          |
| ぶら下げ組                           | `hanging-punctuation`                  | Safari のみ            |
| 文節での自然改行                     | `word-break: auto-phrase`              | Chromium のみ          |
| 均等割り                             | `text-justify: inter-character`        | Safari 以外            |

下4つは `@supports` で段階強化しているため、対応エンジンでのみ有効になる。
文節改行(`word-break: auto-phrase`)は見出し・短文にのみ適用する(本文全体への適用は Chrome 公式も非推奨)。
均等割り(`text-justify: inter-character`)は英数字を多く含む行で字間が広がることがある。

> [!TIP]
> 約物のアキ詰め(`text-spacing-trim`)は、`halt`/`chws` を持つフォント(Noto Sans CJK / 源ノ角ゴシック等)でのみ効く。
> プリセットはフォントを強制しない。`--jp-font-family` で推奨フォントを指定できる。

> [!NOTE]
> `text-autospace`(和欧アキ)は Chromium / Firefox では正しく描画されるが、**一部の WebKit ビルドではアキ挿入時にグリフの送り(advance)が壊れ文字が重なる**既知の上流バグがある(CSS の値変更では回避不可。Playwright の WebKit-Linux ビルドで再現)。仕様準拠かつ大多数のエンジンで正しいため base に置いている。

## 強調と引用(和文の作法)

和文の強調は欧文(bold/italic)と発想が違う。本プリセットは `<em>` を**斜体ではなく圏点(ゴマ点)**で強調する(`text-emphasis`)。和文では斜体を使わないため、`em`/`i`/`cite`/`dfn` の擬似斜体も解除する。

> [!NOTE]
> 「明朝本文→ゴシックで強調」という書体変更も和文の伝統的な強調手段だが、これを確実に出すには具体的なフォント名の指定が必要(総称ファミリでの明朝/ゴシックの出し分けはブラウザ・OS依存で、特に Chromium-on-Linux では効かない)。本プリセットは具体フォントを同梱しない方針のため、書体変更による強調は提供しない。必要な場合は利用側で書体を指定する。

**ブロック引用**は和文の字下げ作法に寄せている。左を全角2字下げ＋前後アキとし、欧文的な左の縦罫線・斜体・鍵括弧は付けない(字下げ自体が引用の合図)。`--jp-quote-indent` / `--jp-quote-gap` で調整できる。

## カスタマイズ(デザイントークン)

調整可能な値はすべてカスタムプロパティに集約されている。上書きするだけで全体を調律できる。

```css
:root {
  --jp-indent: 1em; /* 文頭字下げの量 */
  --jp-leading: 1.8; /* 行間 */
  --jp-paragraph-gap: 0; /* 段落間アキ(既定は字下げで段落を示す) */
  --jp-text-align: justify; /* 本文の行揃え */
  --jp-font-family: inherit; /* 推奨和文フォント(既定は強制しない) */
  --jp-rt-scale: 0.5em; /* ルビ文字の大きさ */
  --jp-rt-leading: 1; /* ルビの行送り */
  --jp-emphasis: filled sesame; /* 圏点(傍点)のスタイル */
  --jp-quote-indent: 2em; /* ブロック引用の字下げ(全角2字) */
  --jp-quote-gap: 1em; /* ブロック引用の前後アキ */
}
```

## 開発

すべての作業は Docker コンテナ内(非root・UID/GID 1000)で完結し、ホストを汚さない。
ホストに必要なのは **docker** だけ。タスクはホストの薄いラッパー `./x` から呼ぶ(中身は `just`)。

```sh
docker compose build      # 開発イメージをビルド(初回のみ)
./x install               # 依存インストール
./x fix                   # 自動修正(stylelint --fix / biome / prettier / typos)
./x check                 # 一括検証(lint → fmt → typecheck → typos → build → test)
./x dev                   # 開発サーバ → http://localhost:5173/demo/
./x hooks                 # コミット時に自動修正する git フックを設置
```

`./x` 無しで直接叩く場合は `docker compose run --rm dev just <recipe>`。

### ツールチェーン

pnpm / [Lightning CSS](https://lightningcss.dev/)(ビルド) / Vite(開発サーバ) /
Stylelint + Biome(lint・整形) / Prettier(整形) / [typos](https://github.com/crate-ci/typos)(誤字) /
[just](https://github.com/casey/just)(タスク) / Playwright(3エンジンのテスト) / lefthook(自動修正フック)。

### 検証について

`./x check` が確かめるのは **CSS の規律・構文・宣言の適用**(Stylelint・ビルド・computed-style テスト)であり、
**組版の視覚的な美しさそのものではない**。視覚回帰(`tests/visual.spec.ts`)は「変わったかどうか」を検出するが、
基準画像が「組版として正しいか」の最終判断はブラウザ(特に Chromium / Safari)での人手目視が必要。

視覚回帰の基準画像はレンダリング環境(エンジン・フォント)に依存する。基準は Docker イメージ(Noto CJK 同梱)で生成しており、
環境やフォントが変わって差分が出たら `./x test-update` で再生成する。決定論的な検証は computed-style テスト側が担う。

### Playwright のバージョン

`@playwright/test` は Docker イメージ(`mcr.microsoft.com/playwright:vX.Y.Z-noble`)に同梱されるブラウザと
バージョンを一致させる必要がある。両者は同時に更新すること(`package.json` と `Dockerfile`)。

## 今後(スコープ外)

- 非対応ブラウザ向けの JS/Rust-WASM polyfill(BudouX による文節改行、ぶら下げの代替実装など)。
  「対応が来たら消せるブリッジ」として別オプトイン層に。

## ライセンス

[MIT](./LICENSE)
