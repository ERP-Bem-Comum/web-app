# Spec — Widget "Últimos pagamentos" no Dashboard (042)

> Tamanho **M** (feature pequena, vertical MVVM + BFF). Primeira tela REAL do Dashboard, substituindo o
> placeholder de `_authenticated/dashboard.tsx` (que aguardava core-api#112). Endpoint do widget = core-api#239.

## Contexto / Motivação

Hoje `/dashboard` é só um placeholder do guard (US2). O core-api passou a expor um endpoint Top-5 de
pagamentos recentes (`GET /financial/dashboard/recent-payments`, RBAC `reference:read`). Construímos a
primeira DashboardPage real — um layout de grid de widgets extensível — com o widget "Últimos pagamentos".

## User story (P1)

Como usuário autenticado com permissão de leitura, ao abrir o Dashboard quero ver os 5 pagamentos mais
recentes (fornecedor · conta débito · valor · data), para ter contexto imediato da operação financeira.

## Contrato do endpoint (VERIFICADO — core-api dev, #239)

`GET /financial/dashboard/recent-payments` (RBAC `reference:read`) → **array Top-5** de:
`{ payableId: uuid, documentId: uuid, supplierRef: string|null, debitAccountRef: string|null,
valueCents: string (centavos), paidAt: string|null (ISO "YYYY-MM-DD") }`. Ordenado por `paidAt` desc.
Sem permissão → **403**. `baseUrl` = coreApiBase v2 → o client financial já bate em `${baseUrl}/financial/*`.

## Escopo

- **Server (BFF):** método `getRecentPayments()` no `FinancialClient` (adapter `core-api-financial.ts`) com
  mapper Zod drift-tolerante (array parse; `valueCents` fica STRING de centavos no model; `paidAt`/refs
  nullable). 403 → `forbidden` via `mapHttpError`. Use-case + `recent-payments.query.fn.ts`
  (`createServerFn GET`, auth no handler). Export na public-api.
- **Client (MVVM):** feature nova `src/modules/financial/client/dashboard/`. ViewModel PURO (centavos→BRL
  via `centsToBRL`; ISO→DD/MM/YYYY sem `Date`; ordenação já vem do backend; empty). Query + binding React
  (useQuery). Page (grid de widgets) + widget component (view burra) + `*.css.ts` só-tokens.
- **Resolução de nomes (client-side):** fornecedor via `getSupplierFn` (partners public-api, como
  `payee-bank.binding.ts`); conta débito via `listCedenteAccountsFn` (um fetch → mapa UUID→label). `ref`
  null → "—". Cache TanStack Query. Fallback: se a conta não resolver, mostra "—" (não bloqueia o widget).
- **Estados:** loading (skeleton), vazio → "Nenhum pagamento recente.", erro → mensagem genérica,
  **403/forbidden** → esconde o widget (nota discreta), sem quebrar o dashboard.
- **Route:** `_authenticated/dashboard.tsx` renderiza a `DashboardPage` (título + grid, hoje só este widget).

## Fora de escopo

Outros widgets do dashboard (core-api#112 permanece p/ estatísticas); paginação/filtros; navegação para o
detalhe do documento.

## i18n (chaves `dashboard.*`)

`dashboard.title`, `dashboard.recent-payments.title`, `.col.supplier`, `.col.debit-account`, `.col.value`,
`.col.paid-at`, `.empty`, `.error`, `.forbidden`, `.loading`.

## Critérios de aceite

1. Widget lista ≤5 pagamentos com Fornecedor · Conta débito · Valor (BRL) · Data (DD/MM/YYYY).
2. `supplierRef`/`debitAccountRef` null → "—"; nome resolvido quando o ref existe.
3. Estados loading/vazio/erro/403 corretos; 403 não quebra a página.
4. ViewModel puro testado (node): centavos→BRL, ISO→data, empty. DOM do widget testado (vitest): loading,
   vazio, dados.
5. `pnpm typecheck | lint | verify | test:dom` verdes. Nada não-relacionado tocado. Regressão zero.
   </content>
   </invoke>
