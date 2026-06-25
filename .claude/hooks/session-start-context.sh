#!/usr/bin/env bash
# SessionStart — injeta um resumo de orientação no início da sessão: branch,
# feature corrente do spec-kit (.specify/feature.json) e a hierarquia de fontes
# de verdade. Não bloqueia (exit 0 sempre). Agnóstico de harness (Claude Code/Kimi).
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$DIR/_lib.sh"

ROOT="${CLAUDE_PROJECT_DIR:-.}"
cd "$ROOT" 2>/dev/null || exit 0

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")

FEATURE=""
if [ -f .specify/feature.json ] && command -v jq >/dev/null 2>&1; then
  FEATURE=$(jq -r '.feature_directory // ""' .specify/feature.json 2>/dev/null)
fi

cat <<EOF
[web-app · contexto de sessão]
Branch: ${BRANCH}
Feature spec-kit corrente: ${FEATURE:-(nenhuma fixada em .specify/feature.json)}

Fonte de verdade (em conflito, vence a de cima):
  1. handbook/adr/                      — 14 ADRs imutáveis
  2. .specify/memory/constitution.md    — princípios §I–§XII
  3. handbook/ARQUITETURA.md + src/modules/auth/ — mapa visual + feature-modelo
  4. eslint.config.js + tsconfig.json   — autoridade executável (vence o texto)

Comece pelo agente 'web-app-orchestrator' (.claude/agents/). pnpm é o único PM.
Invariantes: erros como valores (Result, sem throw no domínio); a server function
é a ÚNICA fronteira client↔server; token nunca no browser.
EOF
exit 0
