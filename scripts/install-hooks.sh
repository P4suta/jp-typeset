#!/usr/bin/env bash
#
# ホスト側 git フックを設置する。
# 設置先はリポジトリ追跡下の .githooks/ に固定し、ローカル core.hooksPath で有効化する。
# こうすることで、グローバルに core.hooksPath が設定されていても、ユーザーの
# グローバル/共有フックを一切上書きしない(ホストに新規ツールも導入しない)。
# フック本体は処理を Docker 内の lefthook へ委譲する。
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
hooks_dir="$repo_root/.githooks"
mkdir -p "$hooks_dir"
hook="$hooks_dir/pre-commit"

cat > "$hook" <<'HOOK'
#!/bin/sh
# jp-typeset: 自動修正フックを Docker 内 lefthook に委譲する(host を汚さない)。
if ! docker compose version >/dev/null 2>&1; then
  echo "[jp-typeset] docker compose が見つからないため pre-commit をスキップします" >&2
  exit 0
fi
exec docker compose run --rm -T dev pnpm exec lefthook run pre-commit
HOOK
chmod +x "$hook"

# グローバル core.hooksPath を壊さないよう、このリポジトリ限定で .githooks を使う。
git -C "$repo_root" config --local core.hooksPath .githooks

echo "[jp-typeset] pre-commit フックを設置しました: $hook"
echo "[jp-typeset] このリポジトリ限定で core.hooksPath=.githooks (local) を設定しました"
