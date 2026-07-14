# Spec — Contrapartida esperada (US2 do #269)

> Conciliação de **transferência entre contas**. Fatia US2: para uma transação bancária real na conta de
> destino, mostrar as **contrapartidas pendentes que casam** (palpites) e permitir **confirmar** o casamento.
> Irmão do fluxo de palpites/conciliação título↔transação, mas contra CONTRAPARTIDAS.
> Backend já mergeado na `dev` (core-api @ 51bdad87).

## Tamanho

**L** — fatia vertical completa BFF→MVVM, espelhando a cadeia-irmã de conciliação por sugestão.

## Contexto de domínio

Numa transferência A→B, a perna de origem cria uma **contrapartida esperada** (`Pending`) na conta de
destino (US1, backend, backward-compat — sem front). US2: a transação real de crédito na conta de destino
tem **contrapartidas pendentes candidatas** (match por valor exato + mesmo movimento + janela ~5 dias;
empate → mais antiga). Confirmar concilia a transação contra a contrapartida.

## Contrato do backend (JÁ MERGEADO)

- `GET /financial/statement-transactions/:id/counterpart-suggestions` — auth `reconciliation:read`.
  200: `{ suggestions: CounterpartSuggestion[] }`, `CounterpartSuggestion =
{ counterpartId: uuid, originAccountRef: uuid, valueCents: string(centavos), expectedDate: ISO, score: 0..100 }`.
- `POST /financial/reconciliations/counterpart` — auth `reconciliation:write`.
  Body `{ transactionId, counterpartId }`. 201: `{ reconciliationId, counterpartId }`.
  Erros: `counterpart-not-found` (422), `counterpart-not-pending` (409), `counterpart-account-mismatch` (422),
  `counterpart-value-mismatch` (422), store indisponível (503). O core-api **esconde o slug** (OWASP) → o
  front mapeia por CONTEXTO/status (padrão do módulo; ver memória `backend-hides-error-slug`).

## Requisitos

1. **Query de palpites** (`getCounterpartSuggestions`): server fn `.query.fn` + cadeia BFF (schema/mapper/
   client/use-case/porta/composition) + repository + query options + binding, espelhando `getStatementSuggestions`.
2. **Comando confirmar** (`confirmCounterpart`): server fn `.service.fn` + cadeia BFF + repository + binding
   (mutation), espelhando `createReconciliation`. Ao confirmar, invalida o namespace `['financial','reconciliation']`.
3. **UI** (view burra): seção "Contrapartida esperada" dentro da aba de palpites (`sugestao`) da transação
   selecionada, com valor (BRL), data esperada (DD/MM/AAAA), score (%) e botão "Confirmar contrapartida".
   Aparece só quando há contrapartidas candidatas (invisível p/ transações comuns de título).

## Não-objetivos

- US1 (criar a contrapartida na origem) — já feito no backend.
- Enriquecimento do nome da conta de origem (o contrato só dá `originAccountRef` uuid).
- Nova aba no tab-bar (mantém as 3 abas do mock: Sugestão/Nova/Vários).

## Aceite

- `pnpm verify` (typecheck + lint + node:test) e `pnpm test:dom` verdes.
- Erros como valores (§II); server fn única fronteira (§III); token nunca no browser (§IX); view burra (§XI);
  só-tokens no CSS (§X); i18n PT.
