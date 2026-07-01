# Plan — Widget "Últimos pagamentos" (042)

## Boundary decision

Widget vive em **`src/modules/financial/client/dashboard/`** (não um módulo `dashboard` novo): o endpoint é
`/financial/*`, o read reusa a `financialRepository` e a resolução de conta reusa `listCedenteAccountsFn`
do próprio financial — pôr num módulo separado forçaria imports cross-módulo que o `eslint-plugin-boundaries`
desencoraja. A route `_authenticated/dashboard.tsx` fica genérica e delega à página do financial.

## Camada SERVER (BFF · DDD) — delegar a `server-orchestrator`

1. `server/domain/document.io.ts` — tipo `RecentPayment` (readonly; `valueCents: string`, refs/`paidAt`
   nullable). PURO, sem Zod.
2. `server/adapters/core-api/financial.schema.ts` — `CoreApiRecentPaymentSchema` (campos string trim,
   nullable, `.catch(null)` nos opcionais) + `CoreApiRecentPaymentListSchema = z.array(...).catch([])`.
3. `financial.mappers.ts` — `recentPaymentsToModel(raw): Result<readonly RecentPayment[], FinancialError>`
   (array parse tolerante; drift → `err('server')`; reusa `mapHttpError`).
4. `core-api-financial.ts` — método `getRecentPayments(token) => GET ${baseUrl}/dashboard/recent-payments`
   (`baseUrl` já é `.../financial`) via `resultFetch`; `isErr → mapHttpError`.
5. `application/financial.use-cases.ts` — `getRecentPayments` na porta `FinancialClient` + factory.
6. `financial.composition.ts` — expõe `getRecentPayments`.
7. `server/adapters/server-fns/recent-payments.query.fn.ts` — `createServerFn GET`, auth no handler
   (getCurrentUser + resolveAccessToken → unauthorized), retorna `{ ok, data } | { ok, error }`.
8. `public-api/index.ts` (financial) — export `recentPaymentsFn` (se necessário p/ o wire) + tipo
   `RecentPayment` do model client.

## Camada CLIENT (MVVM) — delegar a `client-orchestrator`

1. `client/data/model/recent-payment.model.ts` — `RecentPayment` do client (espelha o server).
2. `client/data/repository/financial.repository.ts` (+ `.instance.ts`) — método `getRecentPayments()`.
3. `client/dashboard/recent-payments.view-model.ts` — PURO: `toRecentPaymentRow` (centavos→BRL via
   `centsToBRL`; ISO→DD/MM/YYYY via helper local sem `Date`; supplier/account label resolvidos = "—"
   quando ausentes). Sem React, sem `@tanstack/react-*`.
4. `client/dashboard/recent-payments.query.ts` — queryOptions (agnóstico de React).
5. `client/dashboard/recent-payments.binding.ts` — `useRecentPayments` (useQuery) + resolução de nomes:
   `useSuppliersMap` (getSupplierFn, cache) e `useDebitAccountsMap` (listCedenteAccountsFn, um fetch →
   Map UUID→label). Junta refs→labels e devolve rows já formatadas (chama o view-model puro).
6. `client/dashboard/components/recent-payments-widget.component.tsx` — view BURRA (card + tabela;
   loading/empty/error/forbidden por props).
7. `client/dashboard/page/dashboard.page.tsx` — grid de widgets (título + 1 widget hoje).
8. `client/dashboard/page/dashboard.css.ts` — só-tokens (vars).
9. `routes/_authenticated/dashboard.tsx` — renderiza `DashboardPage`.
10. i18n `catalog.pt-BR.ts` — chaves `dashboard.*`.

## Constitution Check (§I–§XII)

- **§I vertical-modular:** fica dentro de `financial/`; import externo só via public-api (getSupplierFn de
  partners; listCedenteAccountsFn é intra-módulo). OK.
- **§II erros como valores:** Result no server; repository converte `{ok}`→Result; UI trata forbidden/erro
  como valor (sem status HTTP). OK.
- **§III server fn = única fronteira:** `recent-payments.query.fn.ts` compõe e entrega Top-5 pronto; o
  client só resolve labels (leitura auxiliar via fns existentes, não compõe o caso de uso). OK.
- **§IV estados ilegais:** union `{ok:true|false}`; loading/empty/error/forbidden discriminados na view. OK.
- **§V cadeia de erro:** `mapHttpError` preserva slug/status → `FinancialError`; UI só olha a tag. OK.
- **§VI TS estrito apagável:** sem any/enum/namespace; tipos PUROS no domínio. OK.
- **§VII imutabilidade:** Readonly/as const nos models e rows. OK.
- **§IX segurança:** token só no handler; Zod na borda (schema do response); RBAC 403→forbidden. OK.
- **§X design só-tokens:** `dashboard.css.ts` usa `vars.*`, zero hex/px cru. OK.
- **§XI MVVM:** view-model puro, view burra, React só no binding (ADR-0009). OK.
- **§XII eventos:** N/A (read-only, sem mutação/evento).

## Riscos / mitigações

- **N gets de fornecedor:** cache por `['financial','supplier',id]`; ≤5 refs distintos. Aceitável.
- **RBAC da conta-débito** (`bank-account:read`) ≠ RBAC do widget (`reference:read`): se a listagem de
  contas der forbidden, o mapa fica vazio → conta cai p/ "—" (fallback do spec), widget não quebra.
- **Drift do backend:** `.catch()` no schema + array parse tolerante.

## Gates

`pnpm typecheck` · `pnpm lint` · `pnpm verify` · `pnpm test:dom`. Regressão zero.
</content>
