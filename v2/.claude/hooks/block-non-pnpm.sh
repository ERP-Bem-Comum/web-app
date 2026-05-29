#!/usr/bin/env bash
# PreToolUse/Bash — bloqueia npm/yarn (força pnpm neste projeto).
# Permite pnpm e npx. Lê o JSON do hook no stdin.
INPUT=$(cat)
CMD=$(printf '%s' "$INPUT" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write((JSON.parse(s).tool_input||{}).command||"")}catch{}})')

# 'npm'/'yarn' precedidos por início, espaço ou separador (não casa 'pnpm' nem 'npx').
if printf '%s' "$CMD" | grep -qE '(^|[;&|[:space:]])(npm|yarn)([[:space:]]|$)'; then
  echo "Bloqueado: este projeto usa pnpm (npm/yarn proibidos). Reescreva com pnpm. Comando: $CMD" >&2
  exit 2
fi
exit 0
