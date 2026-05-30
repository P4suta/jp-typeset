# jp-typeset

[![CI](https://github.com/P4suta/jp-typeset/actions/workflows/ci.yml/badge.svg)](https://github.com/P4suta/jp-typeset/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-informational.svg)](./LICENSE)

日本語Web組版の「標準的な書き方の規則」を、最新の CSS だけで実現するドロップインCSSプリセット。
`<link>` 一発で、**文頭字下げ・禁則処理・約物のアキ詰め・和欧間アキ・両端揃え・ぶら下げ・文節改行・ルビ・圏点(傍点)**が効く。

スクラッチの組版エンジンではない。意見を持った1枚の CSS を、対応ブラウザに素直に流し込むだけ。
未対応の機能は無視されても本文を壊さず、ブラウザが対応すれば自動でよくなる(`@supports` による段階強化)。

> [!NOTE]
> 標準のセマンティックHTMLだけを対象にする独立したCSSであり、特定の記法やフレームワークには依存しない。
> 横書きを既定とし、**縦書き・縦中横はオプトインのユーティリティ**で対応する。
> ページ組版(`@page`)・原稿用紙のマス目グリッドは**対象外**。段組など汎用レイアウトは標準CSSで(プリセットは日本語テキスト組版に集中)。

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
| 行末処理(末行の孤立防止・見出し均等) | `text-wrap: pretty` / `balance`        | Chromium / Safari      |
| 見出しの前後アキ                     | `margin-block` (JLReq §4.1.3)          | 全エンジン             |
| 添え字(行送りを乱さない)             | `sub` / `sup`                          | 全エンジン             |

下4つは `@supports` で段階強化しているため、対応エンジンでのみ有効になる。
文節改行(`word-break: auto-phrase`)は見出し・短文にのみ適用する(本文全体への適用は Chrome 公式も非推奨)。
均等割り(`text-justify: inter-character`)は英数字を多く含む行で字間が広がることがある。
エンジン差のある**約物詰め・ぶら下げ・文節改行**は、任意の JS 層で非対応ブラウザも補える(下記「ブラウザ差を埋める JS」)。

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

## Markdown / GFM との相性

標準のセマンティックHTMLを対象にしているため、Markdown(GitHub Flavored Markdown)から生成した
HTML にもそのまま効く。見出し・段落・リスト・引用・表・強調・取り消し線・リンク・タスクリストなどに
和文の組版が適用される。`demo/gfm.html` が一通りの GFM 要素を日本語で並べた見本。

> [!IMPORTANT]
> **コード(`code` / `pre` / `kbd` / `samp`)は等幅を保ち、和欧間アキも入れない**(和文の文字組みを持ち込まない)。
> Markdown のコードブロック・インラインコードがプリセットで等幅でなくなることはない。

## ユーティリティ(縦書き・縦中横・行長)

オプトインのクラス。付けた要素にだけ効く。

| クラス         | 効果                                                                                                                                                        |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.jp-vertical` | 縦書き(`writing-mode: vertical-rl`)。論理プロパティ基盤なので禁則・字下げ・両端揃え・ぶら下げ・ルビ・圏点がそのまま縦組みに移行する。表示には高さを与える。 |
| `.jp-tcy`      | 縦中横。縦組み中の半角数字・欧字を1文字幅で横に並べる(`text-combine-upright: all`)。例: `<span class="jp-tcy">12</span>月`                                  |
| `.jp-measure`  | 読みやすい行長に制限して中央寄せ(`--jp-measure`、既定 全角およそ40字)。                                                                                     |

```html
<article class="jp-vertical" lang="ja" style="block-size: 20em">
  <p>本文…<span class="jp-tcy">2026</span>年…</p>
</article>
```

## カスタマイズ(デザイントークン)

調整可能な値はすべてカスタムプロパティに集約されている。上書きするだけで全体を調律できる。

```css
:root {
  --jp-indent: 1em; /* 文頭字下げの量 */
  --jp-leading: 1.8; /* 行間 */
  --jp-paragraph-gap: 0; /* 段落間アキ(既定は字下げで段落を示す) */
  --jp-text-align: justify; /* 本文の行揃え */
  --jp-font-family: inherit; /* 推奨和文フォント(既定は強制しない) */
  --jp-mono: monospace; /* コード(等幅)要素のフォント */
  --jp-rt-scale: 0.5em; /* ルビ文字の大きさ */
  --jp-rt-leading: 1; /* ルビの行送り */
  --jp-emphasis: filled sesame; /* 圏点(傍点)のスタイル */
  --jp-quote-indent: 2em; /* ブロック引用の字下げ(全角2字) */
  --jp-quote-gap: 1em; /* ブロック引用の前後アキ */
  --jp-heading-margin-block: 1.5em 0.5em; /* 見出しの前後アキ(前 後) */
  --jp-measure: 40em; /* .jp-measure の行長 */
}
```

## ブラウザ差を埋める JS(`jp-typeset/enhance`)

CSS だけでは全ブラウザで揃わない項目(文節改行・ぶら下げ・約物のアキ詰め)を、**任意の JS 層**で補える。
各機能は `CSS.supports()` で対応を判定し、**ネイティブ対応があれば何もしない**(対応が来たら自動で消えるブリッジ)。
CSS コア(`import "jp-typeset"`)は実行時依存ゼロのまま。この層と BudouX 依存は `jp-typeset/enhance` だけが背負う。

### 使い方

CDN なら CSS の `<link>` に `<script>` を1行足すだけ(`lang="ja"`/`.jp` を自動強化):

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/jp-typeset/dist/jp-typeset.min.css" />
<script src="https://cdn.jsdelivr.net/npm/jp-typeset/dist/enhance.iife.js" defer></script>
```

バンドラなら ESM を明示的に呼ぶ(tree-shakeable):

```js
import { enhance } from "jp-typeset/enhance";

enhance(); // 既定は文節改行のみ。SPA の再描画後に呼び直してもよい(冪等)
enhance(document, { hanging: true, spacingTrim: true }); // 実験ブリッジを追加
```

### できること

| オプション          | 既定 | 内容                                              | ネイティブ対応(no-op になる条件) |
| ------------------- | ---- | ------------------------------------------------- | -------------------------------- |
| `phrasing`          | on   | BudouX で見出し・短文を文節改行(`<wbr>` を挿入)   | `word-break: auto-phrase`        |
| `dialogueIndent`    | off  | 始め括弧で始まる段落の先頭字下げを詰める          | (CSS に等価なし・opt-in)         |
| `hanging`(実験)     | off  | ぶら下げ組(行頭開き括弧・行末句読点を版面外へ)    | `hanging-punctuation: first`     |
| `spacingTrim`(実験) | off  | 連続する全角約物のアキを詰める                    | `text-spacing-trim`              |
| `observe`           | off  | layout 依存ブリッジ(ぶら下げ)を resize 時に再適用 | —                                |

- **旗艦は文節改行**。`word-break: auto-phrase` 非対応の Safari / Firefox でも、見出しが意味のまとまりで折れる。本文(`p`)には当てない(CSS と同じスコープ)。
- 区切りは不可視の `<wbr>` を使うので、コピー&ペースト・スクリーンリーダー・検索を汚さない。ルビ・圏点などインライン要素も壊さない。
- **実験**印の `hanging` / `spacingTrim` は layout 測定やフォント依存の近似を含むため既定 OFF。行末ぶら下げ(allow-end)は reflow で崩れるので `observe: true` で再計測できる。
- 文節改行は冪等(`<wbr>` を二重に挿さない)。`dialogueIndent` を既定 OFF にするのは、CSS 側の「会話文も一律に字下げ」という意図的な判断を尊重するため。
- **縦書き(`.jp-vertical`)でも全ブリッジが動く**。挿入する余白はすべて論理プロパティ(`margin-inline-*` / `text-indent`)で、ぶら下げの行末判定だけは `writing-mode` を見て軸を切り替える(縦組みは「列の下端」が行末)。文節改行・ぶら下げ・約物詰め・字下げがそのまま縦組みへ適応する。

> [!NOTE]
> CDN 版(`enhance.iife.js`)は BudouX と日本語モデルを内包する単一ファイル(およそ 145KB gzip)。
> npm/ESM 版は `budoux` を外部依存とし動的 import するため、**ネイティブ対応ブラウザではモデルを一切読み込まない**。

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

JS ブリッジ層(`jp-typeset/enhance`)も同じ2層で検証する。**決定論層** `tests/enhance.spec.ts` が、
ページ内 `CSS.supports` を基準にした no-op/ゲート・`<wbr>` 挿入・冪等・非破壊・IIFE 成果物に内包した
BudouX の実動作を3エンジンでアサートし(`ci:gate` に含む)、**視覚回帰層** `tests/enhance.visual.spec.ts` が
文節改行・字下げ・ぶら下げ・約物詰めを固定狭幅で撮る(`test:visual`・非ゲート)。`./x dev` で
`demo/enhance-esm.html` / `demo/enhance-iife.html` を各ブラウザで目視できる。

### Playwright のバージョン

`@playwright/test` は Docker イメージ(`mcr.microsoft.com/playwright:vX.Y.Z-noble`)に同梱されるブラウザと
バージョンを一致させる必要がある。両者は同時に更新すること(`package.json` と `Dockerfile`)。

## 今後(スコープ外)

- 行末ぶら下げ(`hanging-punctuation` の allow-end)の忠実な JS polyfill。現状は best-effort の実験オプション
  (`enhance({ hanging })`)に留め、行ごとの再計測が要る完全実装は見送り(ネイティブに委ねる)。
- 縦書き本文への JS ブリッジ、ページ組版(`@page`)など(明確にスコープ外)。

## ライセンス

[MIT](./LICENSE)
