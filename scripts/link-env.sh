#!/usr/bin/env bash
# Symlinks .env.local from the repo root into every worktree under .claude/worktrees/.
# Safe to run multiple times — skips worktrees that already have a .env.local.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_SOURCE="$REPO_ROOT/.env.local"
WORKTREES_DIR="$REPO_ROOT/.claude/worktrees"

if [ ! -f "$ENV_SOURCE" ]; then
  echo "link-env: $ENV_SOURCE not found, skipping" >&2
  exit 0
fi

if [ ! -d "$WORKTREES_DIR" ]; then
  exit 0
fi

for worktree in "$WORKTREES_DIR"/*/; do
  [ -d "$worktree" ] || continue
  target="$worktree/.env.local"
  if [ -e "$target" ] || [ -L "$target" ]; then
    continue
  fi
  ln -sf "$ENV_SOURCE" "$target"
  echo "link-env: linked .env.local → ${worktree#"$REPO_ROOT/"}"
done
