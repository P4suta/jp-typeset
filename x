#!/usr/bin/env bash
#
# jp-typeset 開発タスクのホスト側エントリ。
# すべてのタスクを Docker コンテナ内(非root・UID/GID 1000)で実行する。
# ホストに必要なのは docker のみ。
#
#   ./x            … レシピ一覧
#   ./x install    … 依存インストール
#   ./x fix        … 自動修正
#   ./x check      … 一括検証
#   ./x dev        … 開発サーバ(http://localhost:5173/demo/)
set -euo pipefail
cd "$(dirname "$0")"
exec docker compose run --rm --service-ports dev just "$@"
