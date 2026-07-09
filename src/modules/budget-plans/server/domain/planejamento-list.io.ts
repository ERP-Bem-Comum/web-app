/**
 * I/O do BFF para a LISTA de Planejamento (Plano Orçamentário). Forma que a server fn entrega ao client —
 * espelha o `BudgetPlanNode` do client (§XI: server-state ≠ UI-state; sem import cruzado client↔server).
 *
 * Reconciliação com o modelo NOVO do core-api (Fatia 1, #315), que é intencionalmente diferente do legado:
 *   - `id` UUID (o client adapta `number → string`).
 *   - `version` chega `"1.0"` (string) → o BFF parseia p/ o float legado (1.0).
 *   - `programAbbreviation` NÃO vem na lista → o BFF resolve via `GET /budget-plans/options` (join por ref).
 *   - `partnersCount`/`networkKind` NÃO vêm na lista → INTERINO (B1): o BFF deriva do `budgets[]` do detalhe
 *     (fan-out por item) até o core projetar na lista (core-api#372). Ao fechar, troca-se a fonte.
 *   - `updatedByName` não é rastreado no agregado novo → `null` (data-only) até core-api#373.
 *   - `scenarioName`/versões-filhas (`children`) = feature ainda não construída (Fatias 3-4, core-api#317/#318)
 *     → `null`/`[]` (lista flat), sem fabricar árvore.
 */

export type NetworkKind = 'ESTADO' | 'MUNICIPIO'

export type BudgetPlanStatus = 'RASCUNHO' | 'EM_CALIBRACAO' | 'APROVADO'

/** Item da lista pronto p/ o client (mesma forma do `BudgetPlanNode`). Valores em centavos. */
export type PlanejamentoListItem = Readonly<{
  id: string
  year: number
  programName: string
  programAbbreviation: string | null
  version: number
  scenarioName: string | null
  status: BudgetPlanStatus
  totalInCents: number
  updatedByName: string | null
  updatedAt: string
  networkKind: NetworkKind
  partnersCount: number
  children: readonly PlanejamentoListItem[]
}>

/** Página da lista (envelope do core-api novo: `{ items, total }`, sem meta paginada). */
export type PlanejamentoListPage = Readonly<{
  items: readonly PlanejamentoListItem[]
  total: number
}>

/** Parâmetros do BFF (subset que o core-api da Fatia 1 suporta: page/limit/year/status). */
export type ListBudgetPlansParams = Readonly<{
  page: number
  limit: number
  year?: number
  status?: BudgetPlanStatus
}>
