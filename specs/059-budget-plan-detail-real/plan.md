# Plan — Plano Orçamentário: DETALHE real (feature 059)

Espelha a Fase 1 (058): mesmo core-client/composition/repository. O BFF **compõe** os 2 GETs numa fn.

## Decisões-chave

1. **O BFF entrega o `PlanDetail` pronto (§III).** O mapeamento DTO→forma `PlanDetail` mora no SERVER
   (adapter/domain), como a lista faz (`PlanejamentoListItem` ≅ `BudgetPlanNode`). O client só consome — sem
   mapper client-side. A forma server-owned espelha estruturalmente o `PlanDetail` do `client/data/model`.
2. **IDs de nó sintéticos numéricos.** O `PlanDetail` do front usa `id: number` em centro/categoria/sub (e o
   ViewModel/matriz/centros-custo/orcamento dependem disso). O backend dá `uuid`. Para NÃO rippler em Fase 3/4,
   o mapper descarta o uuid e atribui ids numéricos determinísticos por índice (chave de render só precisa ser
   única entre irmãos). O uuid volta na Fase 3 (escrita) como campo aditivo `ref`, quando for necessário.
3. **Valores = 0 nesta fase.** `monthlyInCents` = 12 zeros; `networkInCents` = []; totais de nó = 0. O
   `totalInCents` do CABEÇALHO usa o real do `GET /:id` (é plano-level, não fabricado; plano novo = 0).
   `networks: []` (visão "Por Rede" só acende na Fase 4).
4. **Enums tolerantes.** Schema valida `direction`/`launchType` como string (fail-soft a literais desconhecidos);
   o mapper faz lookup → `CostCenterType`/`ReleaseType`, com fallback (`direction` desconhecido → `A PAGAR`;
   `launchType` desconhecido → omite `releaseType`). Gap de confirmação de literais → handoff backend.
5. **Erro `budget-plan-not-found` (404 do GET /:id).** Novo ramo na union server + espelho no client.
   Mapper de leitura do detalhe: 404→not-found, 401→unauthorized, resto→unexpected.
6. **Uma fn por caso de uso.** `getBudgetPlanDetailFn` (GET) compõe as duas leituras; cost-structure é core
   (não best-effort): sua falha propaga o erro. Árvore vazia só via 200 `{ costCenters: [] }`.

## Arquivos

### Server (BFF · DDD) — server-orchestrator

- `server/domain/plan-detail.io.ts` (NOVO): tipos server-owned espelhando `PlanDetail` (Composed) + entrada.
- `server/domain/plan-detail.mapper.ts` (NOVO, PURO): `mapPlanDetail(rawHeader, rawCostStructure) → PlanDetailComposed`
  (direction→type, launchType→releaseType, ids numéricos por índice, 12 zeros, totais 0, networks []).
- `server/adapters/core-api/budget-plans.schema.ts`: `coreCostStructureSchema` (direction/launchType string) e,
  se preciso, reuso do `coreDetailSchema` para o cabeçalho.
- `server/adapters/core-api/core-api-budget-plans.ts`: `getPlanDetailHeader(id, token)` (GET /:id → raw header;
  404→`budget-plan-not-found`) e `getCostStructure(id, token)`; `mapDetailHttpError`.
- `server/application/get-budget-plan-detail.use-case.ts` (NOVO): port + composição (chama os 2 métodos e o
  mapper puro). Erro como valor.
- `server/adapters/budget-plans-list.io-schemas.ts`: `GetBudgetPlanDetailInputSchema = z.object({ id: z.uuid() })`.
- `server/adapters/server-fns/get-budget-plan-detail.query.fn.ts` (NOVO): GET, auth no handler, `{ok,data|error}`.
- `server/adapters/budget-plans-list.composition.ts`: expõe `getPlanDetail`.
- `server/domain/errors/budget-plans.errors.ts`: + `'budget-plan-not-found'`.

### Client (MVVM) — client-orchestrator

- `client/data/repository/budget-plans-error.ts`: + `'budget-plan-not-found'`.
- `client/data/repository/budget-plans.repository.ts`: + `getPlanDetail(id): Promise<Result<PlanDetail, …>>` + dep fn.
- `client/data/repository/budget-plans.repository.instance.ts`: wire `getBudgetPlanDetailFn`.
- `client/planejamento/detalhe/plan-detail.binding.ts`: troca `planDetailPlaceholder` por `useQuery`; estados
  loading/erro/empty; passa `detail|null` ao `useCentrosCusto`.
- `client/data/plan-detail.placeholder.ts`: remover se ficar sem uso no detalhe (checar create-plan/consolidado antes).
- i18n `catalog.pt-BR.ts`: `budget-plans.detail.loading`, `.error`, `.empty`.

### Tests

- `tests/modules/budget-plans/plan-detail.mapper.test.ts` (node): cabeçalho+árvore→PlanDetail; árvore vazia;
  enum desconhecida (fallback). UUIDs v4 válidos nos fixtures (z.uuid RFC-strict).
- `tests/modules/budget-plans/plan-detail.binding.spec.tsx` (vitest DOM): render com dados; empty; erro.

## Constitution Check (§I–§XII)

- §I vertical-modular: tudo em `budget-plans`; cross só por public-api. ✅
- §II erros-valor: `Result`/`{ok,error}`; sem throw fora da borda. ✅
- §III server-fn única fronteira: BFF compõe os 2 GETs; client não compõe. ✅
- §IV estados ilegais: union de estado do binding (loading/error/not-found/ready) + switch. ✅
- §V cadeia de erro: UI trata tag i18n, nunca status HTTP; 404→not-found num lugar só (mapper). ✅
- §VI TS estrito/apagável: sem any/enum; unions string-literal. ✅
- §VII imutabilidade: `Readonly`/`as const`. ✅
- §IX segurança: Zod na borda (input `z.uuid`, resposta validada); auth no handler; token só no server. ✅
- §X só-tokens: sem CSS novo (reusa a matriz existente). ✅
- §XI MVVM: `data`/view-model sem react; react só no `.binding.ts`; view burra intacta. ✅
- §XII eventos: N/A.
