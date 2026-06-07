#!/usr/bin/env bash
# PostToolUse/Edit|Write — roda eslint --fix no arquivo TS/TSX editado.
# Não bloqueia (PostToolUse); surfaceia erros restantes ao Claude via stderr.
# Também marca a sessão como "suja" p/ o Stop hook (verify-gate.sh) saber que
# houve mudança de código e valer a pena lembrar do gate de verificação.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$DIR/_lib.sh"

INPUT=$(cat)
# `file_path` (Claude Code) ou `path` (Kimi Code Node) — agnóstico de harness.
FILE=$(hook_tool_input_field "$INPUT" file_path path)

case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
case "$FILE" in
  */core-api/*|*/node_modules/*) exit 0 ;;
esac

ROOT="${CLAUDE_PROJECT_DIR:-.}"
cd "$ROOT" || exit 0

# Marca sessão suja (gitignorado em .claude/.gitignore).
mkdir -p "$ROOT/.claude/.cache" 2>/dev/null && : > "$ROOT/.claude/.cache/dirty" 2>/dev/null

[ -x node_modules/.bin/eslint ] || exit 0  # eslint ainda não instalado → silêncio

OUT=$(pnpm exec eslint --fix "$FILE" 2>&1)
if [ $? -ne 0 ]; then
  printf 'ESLint ainda aponta problemas em %s (após --fix):\n%s\n' "$FILE" "$OUT" >&2
fi
exit 0
