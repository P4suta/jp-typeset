# syntax=docker/dockerfile:1
#
# jp-typeset 開発コンテナ
# ホストを汚さずに pnpm / Lightning CSS / Vite / Stylelint / Playwright を完結させる。
# Playwright 公式イメージはブラウザ(Chromium/Firefox/WebKit)と OS 依存を同梱するため、
# ホスト側に一切ブラウザを落とさない。
#
# 実行は常に非root(UID/GID 1000 = ホストの yasunobu と一致)で行う。
FROM mcr.microsoft.com/playwright:v1.60.0-noble

# 日本語フォント(Noto Sans/Serif CJK)と取得用ツールを同梱。
# 視覚回帰の基準画像が豆腐文字にならないようにする。
# ※ apt 導入はイメージビルド時のみ。実行時は最後に切り替える非rootユーザーで行う。
RUN apt-get update \
 && apt-get install --yes --no-install-recommends \
      fonts-noto-cjk fonts-noto-cjk-extra curl ca-certificates git \
 && rm -rf /var/lib/apt/lists/*

# pnpm と just(コマンドランナー)をグローバル導入(非rootユーザーからも PATH 上で使える)。
# just は公式 npm 配布(rust-just)を使い、host を汚さずコンテナ内に閉じる。
RUN npm install --global pnpm@latest rust-just@latest

# typos(誤字脱字チェッカ。Rust製)を GitHub リリースの musl バイナリから latest 追従で導入。
# ホストの CPU アーキテクチャ(amd64/arm64)を判定して対応バイナリを取得する。
RUN set -eux; \
    case "$(dpkg --print-architecture)" in \
      arm64) target="aarch64-unknown-linux-musl" ;; \
      *) target="x86_64-unknown-linux-musl" ;; \
    esac; \
    ver="$(curl -fsSLI -o /dev/null -w '%{url_effective}' https://github.com/crate-ci/typos/releases/latest | grep -oE 'v[0-9.]+$')"; \
    curl -fsSL "https://github.com/crate-ci/typos/releases/download/${ver}/typos-${ver}-${target}.tar.gz" \
      | tar -xz -C /usr/local/bin ./typos; \
    typos --version

# 非rootユーザー用の書き込み可能な HOME と作業ディレクトリを用意し、UID/GID 1000 所有にする。
# node_modules マウントポイントを事前作成して所有者を 1000 にしておくことで、
# 空の名前付きボリュームをマウントした際にこの所有権が継承される(root所有を避ける)。
ENV HOME=/home/dev
# node_modules と pnpm ストアのマウントポイントを事前作成し UID/GID 1000 所有にする。
# 空の名前付きボリュームをマウントした際この所有権が継承され、ホストの bind mount を汚さない。
RUN mkdir -p /workspace /workspace/node_modules /home/dev/.pnpm-store \
 && chown -R 1000:1000 /workspace /home/dev

WORKDIR /workspace
USER 1000:1000
