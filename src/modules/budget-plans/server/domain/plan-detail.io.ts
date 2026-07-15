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
  ref: string // #C2: UUID do backend (casa com budget-results.subcategoryId)
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  releaseType?: ReleaseType
}>

/**
 * Categoria (agrupa subcategorias). `ref` = UUID do backend (feature 061 — o POST de subcategoria referencia
 * a categoria-pai por UUID). Aditivo ao `id` numérico sintético (que segue chave de render/matriz).
 */
export type CategoryConsolidated = Readonly<{
  id: number
  ref: string
  name: string
  totalInCents: number
  monthlyInCents: MonthlyCents
  networkInCents: NetworkCents
  subCategories: readonly SubCategoryConsolidated[]
}>

/**
 * Centro de custo (raiz da árvore consolidada). `ref` = UUID do backend (feature 061 — o POST de categoria
 * referencia o centro-pai por UUID). Aditivo ao `id` numérico sintético.
 */
export type CostCenterConsolidated = Readonly<{
  id: number
  ref: string
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
// Orçamento por REDE (#394): partner = estado (UF) ou município (IBGE); valor total do plano naquela rede.
export type NetworkKind = 'state' | 'municipality'
export type BudgetInput = Readonly<{
  budgetId: string
  partnerKind: NetworkKind
  partnerRef: string // UF (2 letras) ou código IBGE (7 dígitos)
  valueInCents: number
}>

// #394 (Grupo C): comandos de escrita + opção de rede (do /options).
export type AddBudgetCommand = Readonly<{
  planId: string
  partnerKind: NetworkKind
  partnerRef: string
  valueInCents: number
}>
export type DeleteBudgetCommand = Readonly<{ planId: string; budgetId: string }>
export type NetworkOption = Readonly<{ ref: string; name: string; kind: NetworkKind }>
/**
 * #C2: resultado de cálculo por subcategoria **e MÊS**, dentro de UMA rede/budget. `subcategoryRef` = UUID do
 * backend; `month` = 1..12 (core-api#413).
 *
 * ⚠️ Desde o #413 o `GET /budget-results/by-budget/:budgetId` devolve **12 linhas por subcategoria** (uma por
 * mês), não uma. Quem agrega por subcategoria precisa SOMAR — indexar por `subcategoryRef` sobrescreve e
 * deixa só o último mês (era o que `fillNetworkCells` fazia; ver o comentário lá).
 */
export type BudgetResultRow = Readonly<{ subcategoryRef: string; month: number; valueInCents: number }>
/**
 * ALVO de um lançamento de cálculo ("Calculando Gastos"). O MÊS faz parte da identidade (core-api#413): a
 * chave é `(budgetId, subcategoryId, month)` — é ela que permite os 12 POSTs de uma mesma conta sem colidir.
 * Recalcular o mesmo mês SUBSTITUI o valor (upsert no core-api), não soma.
 */
export type BudgetResultTarget = Readonly<{ budgetId: string; subcategoryId: string; month: number }>

/**
 * Comando de cálculo — UNIÃO DISCRIMINADA pelos 4 modelos do legado (§IV: estados ilegais irrepresentáveis).
 * Cada modelo tem endpoint e corpo PRÓPRIOS no core-api; o `kind` é o que os separa. Modelado como união (e
 * não 4 comandos soltos) porque assim é IMPOSSÍVEL mandar campo de CAED pro endpoint da folha, e o `switch`
 * exaustivo do adapter obriga a tratar todos — inclusive um 5º modelo no dia em que existir.
 *
 * Convenções do core-api que o tipo carrega: percentuais são NÚMEROS (não centavos); `ipca` aceita negativo
 * (deflação); na logística a passagem NÃO multiplica por diária; na folha a quantidade NÃO entra no cálculo
 * (é metadado — core-api#460, decidido pela P.O. contra o print do legado).
 */
export type BudgetResultCommand = BudgetResultTarget &
  (
    | Readonly<{ kind: 'ipca'; baseValueInCents: number; ipca: number }>
    | Readonly<{ kind: 'caed'; numberOfEnrollments: number; baseValueInCents: number }>
    | Readonly<{
        kind: 'personal'
        salaryInCents: number
        salaryAdjustment: number
        inssEmployer: number
        inss: number
        fgtsCharges: number
        pisCharges: number
        foodVoucherInCents: number
        transportationVouchersInCents: number
        healthInsuranceInCents: number
        lifeInsuranceInCents: number
        holidaysAndChargesInCents: number
        allowanceInCents: number
        thirteenthInCents: number
        fgtsInCents: number
      }>
    | Readonly<{
        kind: 'logistics'
        numberOfPeople: number
        totalTrips: number
        airfareInCents: number
        dailyAccommodation: number
        accommodationInCents: number
        dailyFood: number
        foodInCents: number
        dailyTransport: number
        transportInCents: number
        dailyCarAndFuel: number
        carAndFuelInCents: number
      }>
  )

export type PlanDetailHeaderInput = Readonly<{
  id: string
  year: number
  status: BudgetPlanStatus
  version: string
  programName: string
  totalInCents: number
  budgets: readonly BudgetInput[]
}>

/** Subcategoria crua da cost-structure. `id` = UUID do backend (→ `ref`; casa com budget-results — C2). */
export type CostStructureSubcategoryInput = Readonly<{ id: string; name: string; launchType: string }>

/** Categoria crua da cost-structure. `id` = UUID do backend (insumo do `ref`, feature 061). */
export type CostStructureCategoryInput = Readonly<{
  id: string
  name: string
  subcategories: readonly CostStructureSubcategoryInput[]
}>

/** Centro de custo cru da cost-structure (`direction` string tolerante). `id` = UUID do backend (→ `ref`). */
export type CostStructureCostCenterInput = Readonly<{
  id: string
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
  // #394: colunas da visão "Por Rede". `ref` = UF/IBGE (chave natural); `totalInCents` = orçamento da rede
  // (plano-level). As células por centro de custo (`networkInCents`) só acendem na Fatia de cálculo (C2).
  networks: readonly Readonly<{
    id: number
    name: string
    ref: string
    kind: NetworkKind
    budgetId: string
    totalInCents: number
  }>[]
  costCenters: readonly CostCenterConsolidated[]
}>
