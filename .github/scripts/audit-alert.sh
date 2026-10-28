#!/usr/bin/env bash
# Alerta do audit agendado (ADR-0023) — chamado pelo job `scheduled` do security.yml.
#
#   open   vermelho: abre a issue de alerta, ou comenta na que já está aberta (dedup)
#   close  verde: fecha a issue aberta, se houver
#
# Por que issue ATRIBUÍDA: o vermelho do agendado só aparece na aba Actions, que ninguém olha — foi
# assim que o core-api ficou dias com audit vermelho (#633, #1087). A atribuição faz o GitHub mandar
# e-mail aos responsáveis na hora. A dedup existe porque `gh issue create` não é idempotente (o
# core-api já abriu 14 issues idênticas assim, #368): busca pelo marcador estável do título antes.
#
# Env: GH_TOKEN, REF (branch auditada), RUN_URL, ASSIGNEES (só no open, logins separados por vírgula),
#      AUDIT_OUT (relatório gerado pelo audit-gate.sh).
set -uo pipefail

action="${1:?use open ou close}"
marker="[audit-prod:${REF}] vulnerabilidade high/critical em dependência de produção"

existing="$(gh issue list --state open --search "\"${marker}\" in:title" --json number --jq '.[0].number' 2>/dev/null || true)"

if [ "$action" = "close" ]; then
  if [ -n "$existing" ]; then
    gh issue close "$existing" --comment "✅ \`audit --prod\` da \`${REF}\` voltou a verde em $(date -u +%Y-%m-%d). Run: ${RUN_URL}" \
      || echo "::warning::falha ao fechar a #${existing}"
  fi
  exit 0
fi

pkgs="$(grep -oE '^│ (high|critical) +│ [^│]+' "${AUDIT_OUT:-/dev/null}" 2>/dev/null | sed -E 's/^│ +([a-z]+) +│ +(.*[^ ]) *$/- **\1** — \2/' | sort -u | head -30)"
if [ -z "$pkgs" ]; then
  pkgs="- (sem lista: o registry pode ter ficado indisponível — ver o log do run)"
fi

body="$(printf '%s\n\n%s\n\n%s\n\n%s\n\n%s\n' \
  "O \`audit --prod\` agendado da **\`${REF}\`** falhou em **$(date -u +%Y-%m-%d)**." \
  'Achados (título do advisory):' \
  "$pkgs" \
  "Como tratar: atualizar para a versão em *Patched versions* respeitando a quarentena e a \`trustPolicy\` do \`pnpm-workspace.yaml\` (nunca contornar), PR para a \`develop\`, depois promoção. Ver ADR-0023." \
  "Run: ${RUN_URL}")"

if [ -n "$existing" ]; then
  gh issue comment "$existing" --body "$body" || echo "::warning::falha ao comentar na #${existing}"
  echo "::notice::alerta anexado à issue #${existing} (dedup)"
else
  gh issue create --title "🔴 ${marker}" --body "$body" \
    --label "seguranca,needs-triage" --assignee "${ASSIGNEES:-}" \
    || echo "::warning::falha ao abrir a issue de alerta"
fi

# O passo de alerta não pode mascarar a falha do audit.
exit 1
