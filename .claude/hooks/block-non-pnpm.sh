#!/usr/bin/env bash
# PreToolUse/Bash — bloqueia npm/yarn USADOS COMO COMANDO (força pnpm).
# Permite pnpm, npx, e ocorrências de "npm"/"yarn" dentro de strings/args
# (ex.: git commit -m "bump npm deps", grep yarn, echo "...npm...").
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$DIR/_lib.sh"

INPUT=$(cat)
CMD=$(hook_tool_input_field "$INPUT" command)

# 1) Remove conteúdo entre aspas (simples e duplas) p/ não casar dentro de strings.
STRIPPED=$(printf '%s' "$CMD" | sed -e "s/'[^']*'//g" -e 's/"[^"]*"//g')

# 2) Quebra em segmentos por  &  |  ;  (cobre &&, ||, | e ;) e checa só o
#    PRIMEIRO token de cada segmento — é aí que mora "o comando".
if printf '%s' "$STRIPPED" | tr -s '&|;' '\n' | grep -qE '^[[:space:]]*(npm|yarn)([[:space:]]|$)'; then
  echo "Bloqueado: este projeto usa pnpm (npm/yarn proibidos como comando). Reescreva com pnpm. Comando: $CMD" >&2
  exit 2
fi
exit 0
