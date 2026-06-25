#!/usr/bin/env bash
# UserPromptSubmit — injeta a feature corrente do spec-kit no contexto, para o
# agente saber em qual spec está trabalhando e manter os documentos (spec/plan/
# tasks) sincronizados conforme o tamanho (S/M/L) — ver skill pipeline-maestro.
# Não bloqueia (exit 0 sempre). Silencioso quando não há feature fixada.
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$DIR/_lib.sh"

ROOT="${CLAUDE_PROJECT_DIR:-.}"
cd "$ROOT" 2>/dev/null || exit 0

[ -f .specify/feature.json ] || exit 0
command -v jq >/dev/null 2>&1 || exit 0

FEATURE=$(jq -r '.feature_directory // ""' .specify/feature.json 2>/dev/null)
[ -n "$FEATURE" ] || exit 0

if [ -d "$FEATURE" ]; then
  DOCS=$(ls "$FEATURE" 2>/dev/null | tr '\n' ' ')
  echo "[spec-kit] Feature corrente: ${FEATURE} (artefatos: ${DOCS:-vazio})."
  echo "Ao implementar, mantenha spec.md/plan.md/tasks.md coerentes com a mudança (escala S/M/L — skill pipeline-maestro)."
fi
exit 0
