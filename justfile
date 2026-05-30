# jp-typeset 開発タスク
#
# これらのレシピは Docker コンテナ内で実行される前提(pnpm/typos などはコンテナに同梱)。
# ホストからは `./x <recipe>` で呼ぶ(Docker に委譲され、非root・UID1000 で走る)。
#   例: ./x install / ./x fix / ./x check / ./x dev

set shell := ["bash", "-cu"]

# レシピ一覧
default:
    @just --list

# 依存インストール
install:
    pnpm install

# dist/ をビルド(Lightning CSS)
build:
    pnpm run build

# 開発サーバ (http://localhost:5173/demo/)
dev:
    pnpm run dev

# 自動修正: stylelint --fix / biome --write / prettier --write / typos --write
fix:
    pnpm run fix

# lint (CSS: Stylelint / JS・TS: Biome)
lint:
    pnpm run lint

# 整形チェック
fmt:
    pnpm run format:check

# 型チェック (tsc --noEmit)
typecheck:
    pnpm run typecheck

# 誤字脱字チェック (typos)
typos:
    pnpm run typos

# テスト (Playwright 3エンジン)
test:
    pnpm run test

# 視覚回帰の基準画像を更新
test-update:
    pnpm run test:update

# 各ブラウザの全ページ「丸っと」プレビューを .shots/ に生成(目視用・回帰ではない)
shots:
    pnpm run shots

# 一括検証 (CI と同等: lint → fmt → typecheck → typos → build → test)
check:
    pnpm run check

# git フックをホストに設置(コミット時に自動修正を Docker へ委譲)
hooks:
    bash scripts/install-hooks.sh
