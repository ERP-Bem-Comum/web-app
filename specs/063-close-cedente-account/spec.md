# 063 — Encerrar conta-cedente (Conciliação)

## Contexto

O grid de **Contas bancárias** (Conciliação, TELA 1) já **exibia** o estado "Encerrada" (chip + pill) e
contava as encerradas, mas **não havia ação** para encerrar uma conta pela UI — o estado só vinha do seed.
O core-api expõe `POST /financial/cedente-accounts/:id/close` (RBAC `bank-account:write`) — endpoint pronto
e não consumido pelo front (achado da varredura backend↔front desta sessão).

## O quê

Ligar a ação **"Encerrar conta"** ao endpoint real, com **confirmação** (encerrar é **irreversível na UI** —
não há rota de reabertura de conta-cedente).

## Fluxo

- No **expand** da linha (cadastro: tipo · saldo inicial · data) aparece o botão **"Encerrar conta"** —
  **apenas** em conta ativa (`status !== 'closed'`).
- Clique → **modal de confirmação** (irreversível; histórico e conciliações preservados).
- Confirmar → `POST /cedente-accounts/:id/close` → invalida o grid (a conta migra para o chip "Encerradas") e
  fecha o modal. Erro do BFF → mensagem **dentro do modal**, sem fechar (o usuário reage).
- Cancelar / ✕ → fecha sem encerrar.

## Cadeia (BFF · DDD → MVVM) — espelha `createCedenteAccount`

domain port `closeCedenteAccount(id, token)` → use-case `createCloseCedenteAccount` → adapter core-api
(`POST /:id/close`, **sem body**; devolve a conta atualizada → `cedenteAccountToModel`) → io-schema
`CloseCedenteAccountInputSchema { id }` → server-fn `close-cedente-account.service.fn` (RBAC no handler) →
repository (porta `closeAccount` + wire) → binding `useCloseAccount` (confirmação + mutação + invalidação) →
UI (botão no `ExpandPanel` + `CloseAccountModal`).

## Fora de escopo / handoffs

- **Reabertura de conta** — o core-api não expõe reopen de conta-cedente (só de período). Encerrar é
  definitivo na UI; por isso a confirmação explícita.
- **Editar conta** (`PATCH /cedente-accounts/:id`) — também exposto pelo backend e ainda não consumido; fica
  para uma fatia futura (não faz parte desta).

## Gate / DoD

- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:dom` verdes (lint 0 erros / ≤115 warnings).
- Cobertura nova: DOM do grid (botão só em conta ativa → dispara callback) + DOM do binding
  (confirm encerra+invalida; erro mantém o modal aberto; cancel não chama o repo).
- Validado em tela (encerrar move a conta para "Encerradas"; conta encerrada não oferece a ação).
