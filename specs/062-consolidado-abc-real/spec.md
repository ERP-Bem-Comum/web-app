# Plano — 062 Consolidado ABC real

## Constitution Check (§I–§XII)

- **§III (server fn = fronteira):** leitura via nova `getConsolidadoAbcFn` (query.fn); CSV via
  `exportConsolidadoAbcCsvFn` reescrita. Auth NO HANDLER (sessão + token). Zod na borda (§IX).
- **§II/§V (erros como valores):** core client → `Result<…, BudgetPlansError>`; 401→unauthorized, resto→
  unexpected (relatório não tem 404 de negócio). A UI só vê a tag.
- **§XI (MVVM):** `data/model` + `view-model` puros (sem React); React só no `*.binding.ts`; view burra.
- **§IV (estados ilegais):** `state` do binding = união discriminada `loading | error | empty | ready`.
- **§X (só-tokens):** nova tabela da curva em `*.css.ts` com `brand`/`vars`; px cru só em `*.values.ts`.
- **§I (boundaries):** client só fala com a server fn via repository/gateway; nada de `server/domain`.

## Server (BFF · DDD)

- `domain/consolidado-abc.io.ts` — reescreve `ConsolidatedAbc = { year, totalInCents, plans[] }`.
- `adapters/core-api/consolidado-result.schema.ts` — `parseConsolidatedResult` ao contrato real
  (`totalCents`→`totalInCents`; `plans[]`). version tolerante (z.number()).
- `adapters/core-api/core-api-budget-plans.ts` — `getConsolidatedResult` + `getConsolidatedResultCsv`.
- `application/get-consolidado-abc.use-case.ts` (novo) + `export-consolidado-abc-csv.use-case.ts`
  (reescreve p/ proxy do CSV do core).
- `adapters/consolidado-abc.io-schemas.ts` — `{ year:int, programRef:uuid? }`.
- `adapters/server-fns/get-consolidado-abc.query.fn.ts` (novo) + `export-consolidado-abc-csv.query.fn.ts`.
- `adapters/budget-plans-list.composition.ts` — wire `getConsolidado` + `exportConsolidadoCsv`.
- REMOVE: `adapters/consolidado-abc.composition.ts`, `adapters/consolidado-abc.placeholder-source.ts`,
  `domain/consolidado-abc.serializer.ts`.

## Client (MVVM)

- `data/model/consolidado-abc.model.ts` — nova forma + Zod.
- `data/consolidado-abc-filters.schema.ts` — `programRef` uuid opcional (remove `programs`/CSV).
- `data/repository/budget-plans.repository(.instance).ts` — `getConsolidado(filters)`.
- `data/consolidado-export.gateway.ts` — input `{ year, programRef? }`.
- `consolidado/consolidado-abc.view-model.ts` — `deriveConsolidadoHeader` + `deriveConsolidadoCurve`.
- `consolidado/consolidado-abc.binding.ts` — `useQuery(getConsolidado)` + opções de programa reais.
- `consolidado/consolidado-export.binding.ts` — input programRef.
- `consolidado/components/consolidado-filters.component.tsx` — options `{ ref, label }`, single ref.
- `consolidado/components/consolidado-curve.component.tsx` (+ css) — tabela da curva (view burra).
- `consolidado/page/consolidado-abc.page.tsx` — header + curva + estados; sem matriz.
- REMOVE: `data/consolidado-abc.placeholder.ts`.
- `public-api/index.ts` — atualiza exports do consolidado.

## i18n

Novas chaves da curva (colunas, título, loading, error) no catálogo PT.

## Testes

- node: `parseConsolidatedResult` sobre a resposta real + `deriveConsolidadoHeader`/`deriveConsolidadoCurve`.
- DOM: binding real (dados/empty/error); export com input programRef.
- REMOVE: `consolidado-abc-serializer.test.ts` + fixture CSV.
  </invoke>
