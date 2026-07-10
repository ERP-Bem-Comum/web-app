/**
 * I/O do BFF para o DETALHE do Plano Orçamentário (feature 059). Forma que a server fn entrega PRONTA ao
 * client — espelha ESTRUTURALMENTE o `PlanDetail` do `client/data/model/plan-detail.model.ts` (§XI:
 * server-state ≠ UI-state; sem import cruzado client↔server). Domínio PURO (sem I/O, sem framework).
 *
 * Reconciliação com o modelo NOVO do core-api (`GET /budget-plans/:id` + `/:id/cost-structure`):
 *   - IDs de nó = NUMÉRICOS sintéticos por índice (o front usa `id: number`; o uuid do backend é descartado
 *     nesta fase de leitura — volta como campo aditivo `ref` na Fase 3/escrita). Determinísticos/estáveis.
 *   - Valores = 0 nesta fase (SÓ ESTRUTURA/nomes): `monthlyInCents` = 12 zeros, `networkInCents` = [],
 *     totais de nó = 0. O `totalInCents` do CABEÇALHO usa o real do `GET /:id` (plano-level; plano novo = 0).
 *   - `programAbbreviation`/`scenarioName` = `null`; `networks` = [] (a visão "Por Rede" só acende na Fase 4).
 *   - `type` (centro) e `releaseType` (sub) derivam por lookup TOLERANTE de `direction`/`launchType` (o mapper
 *     casa variações; `direction` desconhecido → 'A PAGAR'; `launchType` desconhecido → OMITE `releaseType`).
 */

/** Natureza contábil do centro de custo. ⚠️ o VALOR tem espaço ("A PAGAR"/"A RECEBER"), como no legado. */
export type CostCenterType = 'A PAGAR' | 'A RECEBER'

/** Tipo de lançamento da subcategoria (os 4 modelos de cálculo do legado) — espelha `ReleaseType` do client. */
export type ReleaseType = 'DESPESAS_PESSOAIS' | 'IPCA' | 'CAED' | 'DESPESAS_LOGISTICAS'

/** Status do plano — espelha `BudgetPlanStatus` do client. */
export type BudgetPlanStatus = 'RASCUNHO' | 'EM_CALIBRACAO' | 'APROVADO'

/** 12 valores mensais em centavos (Janeiro…Dezembro) — nesta fase, sempre 12 zeros. */
export type MonthlyCents = readonly number[]

/** Valores por rede em centavos — alinhado por índice a `networks`; nesta fase, sempre []. */
export type NetworkCents = readonly number[]

/** Nó folha (subcategoria) da matriz consolidada. `releaseType` só presente quando o launchType casa. */
export type SubCategoryConsolidated = Readonly<{
  id: number
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  releaseType?: ReleaseType
}>

/** Categoria (agrupa subcategorias). */
export type CategoryConsolidated = Readonly<{
  id: number
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  subCategories: readonly SubCategoryConsolidated[]
}>

/** Centro de custo (raiz da árvore consolidada). */
export type CostCenterConsolidated = Readonly<{
  id: number
  name: string
  type: CostCenterType
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  categories: readonly CategoryConsolidated[]
}>

// ── Entrada CRUA do mapper (contrato de domínio; o adapter valida o DTO do core e produz estas formas). ──
// Vive no domínio porque é o insumo do `mapPlanDetail` (PURO). A application e o adapter as consomem
// (application → domain é permitido). `direction`/`launchType` chegam como STRING (fail-soft; o mapper faz
// o lookup tolerante).

/** Cabeçalho cru do `GET /budget-plans/:id` (subset relevante ao detalhe). */
export type PlanDetailHeaderInput = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  programName: string
  totalInCents: number
}>

/** Subcategoria crua da cost-structure (só estrutura/nomes; `launchType` string tolerante). */
export type CostStructureSubcategoryInput = Readonly<{ name: string; launchType: string }>

/** Categoria crua da cost-structure. */
export type CostStructureCategoryInput = Readonly<{
  name: string
  subcategories: readonly CostStructureSubcategoryInput[]
}>

/** Centro de custo cru da cost-structure (`direction` string tolerante). */
export type CostStructureCostCenterInput = Readonly<{
  name: string
  direction: string
  categories: readonly CostStructureCategoryInput[]
}>

/** Estrutura crua do `GET /budget-plans/:id/cost-structure` (só a árvore, SEM valores). */
export type CostStructureInput = Readonly<{
  costCenters: readonly CostStructureCostCenterInput[]
}>

/** Detalhe do plano PRONTO p/ o client (mesma forma do `PlanDetail`). Valores em centavos. */
export type PlanDetailComposed = Readonly<{
  id: string
  year: number
  programName: string
  programAbbreviation: string | null
  version: number
  scenarioName: string | null
  status: BudgetPlanStatus
  totalInCents: number
  networks: readonly Readonly<{ id: number; name: string }>[]
  costCenters: readonly CostCenterConsolidated[]
}>
