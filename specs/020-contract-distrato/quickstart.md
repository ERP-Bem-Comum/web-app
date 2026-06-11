# Quickstart: validar o distrato encerrando o contrato

Pré-requisitos: stack local de pé (`../ERP-INFRA/local/up.sh` → `https://app.localhost`), core-api no `dev` (#32). Login: **admin.full@bemcomum.dev / DevPassw0rd!2024**.

## Cenário feliz (US1 / SC-001, SC-002)

1. Abrir um contrato **Em Andamento** (ex.: criar CT → anexar doc assinado → ativar, ou usar um já ativo).
2. Em **Documentos**, "Novo aditivo" → tipo **Distrato**.
3. Preencher **Detalhe do Distrato** (motivo — obrigatório), **data efetiva** (não-futura — obrigatória), anexar **PDF assinado** + **data de assinatura**.
4. Salvar. Esperado:
   - O aditivo de distrato é criado e **homologado** (linha na tabela; nó vermelho na timeline).
   - O contrato passa a **Distrato** no **detalhe** (badge) e no **grid** (sem recarregar).
   - `endedAt` (data de encerramento) = a data efetiva informada.

## Cenários de bloqueio (SC-003)

5. Tentar concluir o distrato **sem motivo** → bloqueado, mensagem clara (FR-002).
6. **Sem documento** → bloqueado (FR-004); se passar pela UI, o backend recusa (`terminate-no-signed-document`) → "É necessário anexar o documento assinado de distrato…".
7. **Data efetiva no futuro** → bloqueado (FR-003); defesa do backend → `terminate-invalid-date` → "Data efetiva do distrato inválida…".
8. Falha de backend (derrubar core-api) → mensagem amigável (`connectivity`/`unexpected`), usuária permanece na tela (FR-006).

## Edge (FR-007)
9. Em um contrato **já Distrato/Finalizado/Pendente**, a ação de novo aditivo de distrato não deve encerrar (gatilho só em Ativo); se tentado, recusa amigável (`contract-not-active`).

## Gates (SC-004) — antes de concluir
```bash
pnpm verify       # typecheck + lint + node:test (comparar com baseline: typecheck 0, lint 0 erros)
pnpm test:dom     # vitest jsdom
```
Reportar números vs. baseline. Validar em tela os passos 1–9. **Não commitar** (a usuária commita).

## Verificação rápida via API (opcional, debug)
```bash
# token admin.full → distratar um contrato ativo (espelha o que o front faz):
# 1) upload signed_termination  2) POST /end {kind:Terminate, terminatedAt, reason}
# confirmar GET /contracts/:id → status "Terminated", endedAt = data efetiva
```
