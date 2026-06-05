#!/usr/bin/env bash
# Stop hook — "pronto = passa de verdade".
# Só age se a sessão tocou em código (.claude/.cache/dirty existe, criado pelo
# eslint-fix.sh). Assim NÃO atrasa sessões de só-perguntas.
#
# Dois modos:
#  - DEFAULT (leve): lembra de rodar `pnpm verify` antes de considerar pronto.
#  - GATE REAL (opcional): exporte CLAUDE_VERIFY_GATE=1 para rodar
#    `pnpm typecheck && pnpm lint` automaticamente e devolver os erros ao Claude.
#    (Mais forte, porém adiciona segundos no fim de cada sessão de código.)
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$DIR/_lib.sh"

INPUT=$(cat)
ROOT="${CLAUDE_PROJECT_DIR:-.}"
MARKER="$ROOT/.claude/.cache/dirty"

[ -f "$MARKER" ] || exit 0          # nada de código mudou → silêncio
rm -f "$MARKER"                      # consome o marcador (não repete no próximo stop)

# Evita loop: se já estamos num ciclo de stop-hook, não reentra.
# (stop_hook_active fica na RAIZ do JSON do hook, não em tool_input.)
if command -v jq >/dev/null 2>&1; then
  STOP_ACTIVE=$(printf '%s' "$INPUT" | jq -r '.stop_hook_active // false')
else
  STOP_ACTIVE=$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).stop_hook_active||false))}catch{process.stdout.write("false")}})')
fi
[ "$STOP_ACTIVE" = "true" ] && exit 0

if [ "${CLAUDE_VERIFY_GATE:-0}" = "1" ]; then
  cd "$ROOT" || exit 0
  OUT=$(pnpm typecheck 2>&1 && pnpm lint 2>&1)
  if [ $? -ne 0 ]; then
    printf 'GATE DE VERIFICAÇÃO falhou (typecheck/lint). Conserte antes de finalizar:\n%s\n' "$OUT" >&2
    exit 2                          # devolve ao Claude p/ corrigir
  fi
  exit 0
fi

# Modo leve (default): lembrete não-bloqueante.
echo "Lembrete: houve mudança de código nesta sessão. Antes de considerar pronto, rode \`pnpm verify\` (typecheck + lint + testes)." >&2
exit 0
