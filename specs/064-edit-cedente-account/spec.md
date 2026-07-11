# 064 — Editar conta-cedente (Conciliação)

## Contexto

Com o **encerrar** (063) ligado, faltava a **edição** para fechar o ciclo da conta (criar ✓ / editar / encerrar ✓).
O core-api expõe `PATCH /financial/cedente-accounts/:id` (RBAC `bank-account:write`) — endpoint pronto e não
consumido (achado da varredura backend↔front; issue guarda-chuva core-api#404).

## O quê

Ligar a ação **"Editar"** ao endpoint real, com o form **pré-preenchido** a partir da conta. Campos editáveis:
banco (código + nome quando "Outro"), tipo (+ identificação p/ Cartão/Outro), agência, conta-DV, apelido.
**CNPJ e saldo de abertura são IMUTÁVEIS** (não expostos no PATCH) — nota explícita no rodapé do modal.

## Fluxo

- No **expand** da linha, dois botões: **"Editar"** (em qualquer conta) e **"Encerrar conta"** (só ativa, do 063).
- **Editar** → `requestEdit(id)` faz lookup da conta na lista carregada → `EditAccountModal` pré-preenchido.
- Salvar → `PATCH /cedente-accounts/:id` (parcial) → invalida o grid (reflete na hora) → fecha. Erro do BFF →
  mensagem no próprio modal, sem fechar.

## Cadeia (BFF · DDD → MVVM) — espelha `createCedenteAccount`/`closeCedenteAccount`

domain `EditCedenteAccountInput` → use-case `createEditCedenteAccount` → adapter core-api (`PATCH /:id`, corpo
parcial, `type` mapeado p/ enum minúsculo → `cedenteAccountToModel`) → io-schema `EditCedenteAccountInputSchema`
→ server-fn `edit-cedente-account.service.fn` (RBAC no handler) → repository (porta `editAccount` + wire) →
binding `useEditAccount` (prefill via `open(account)` + PATCH + invalidação) + `requestEdit` no binding do grid
(lookup por id) → UI (botão no `ExpandPanel` + `EditAccountModal`, reaproveita a chrome/labels do "Nova conta").

## Fora de escopo

- **CNPJ e saldo de abertura**: imutáveis por contrato do backend (não estão no `editCedenteAccountBodySchema`).
- Reabertura de conta: inexistente no core-api (ver 063).

## Gate / DoD

- `pnpm typecheck && pnpm lint && pnpm test && pnpm test:dom` verdes (lint 0 erros / ≤115 warnings).
- Cobertura nova: DOM do grid ("Editar" em conta ativa E encerrada → dispara callback) + DOM do binding
  (prefill via `open`; submit faz PATCH com id+campos e invalida; erro mantém o modal aberto).
- Validado em tela contra o core-api #402 (`.strict()`).
