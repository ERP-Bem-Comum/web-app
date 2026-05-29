#!/usr/bin/env bash
# PostToolUse/Edit|Write — roda eslint --fix no arquivo TS/TSX editado.
# Não bloqueia (PostToolUse); surfaceia erros restantes ao Claude via stderr.
INPUT=$(cat)
FILE=$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write((JSON.parse(s).tool_input||{}).file_path||"")}catch{}})')

case "$FILE" in
  *.ts|*.tsx) ;;
  *) exit 0 ;;
esac
case "$FILE" in
  */core-api/*|*/node_modules/*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
[ -x node_modules/.bin/eslint ] || exit 0  # eslint ainda não instalado → silêncio

OUT=$(pnpm exec eslint --fix "$FILE" 2>&1)
if [ $? -ne 0 ]; then
  printf 'ESLint ainda aponta problemas em %s (após --fix):\n%s\n' "$FILE" "$OUT" >&2
fi
exit 0
