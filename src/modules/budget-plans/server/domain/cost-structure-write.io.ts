/**
 * I/O do BFF para a ESCRITA da estrutura de custo do Plano Orçamentário (feature 061 — Grupo B). Comandos dos
 * 3 POSTs (add cost-center / category / subcategory) + a árvore-eco que o core devolve (201 = a árvore INTEIRA
 * atualizada, mesma forma do `GET /:id/cost-structure`). Domínio PURO (sem I/O, sem framework).
 *
 * Os literais de `direction`/`launchType` são os do backend (uniões §IV) — o client já submete o VALOR literal
 * (não o rótulo PT), então aqui são tipos fechados (o adapter revalida na borda com Zod).
 */

/** Natureza contábil do centro — literais do backend (com espaço, como no legado). */
export type CostCenterDirection = 'A PAGAR' | 'A RECEBER'

/** Modelo de cálculo da subcategoria — literais do backend. */
export type SubcategoryLaunchType = 'IPCA' | 'CAED' | 'DESPESAS_PESSOAIS' | 'DESPESAS_LOGISTICAS'

/** Comando: criar centro de custo sob o plano. */
export type AddCostCenterCommand = Readonly<{
  planId: string
  name: string
  direction: CostCenterDirection
}>

/** Comando: criar categoria sob um centro (referência por UUID = `ref` do centro). */
export type AddCategoryCommand = Readonly<{
  planId: string
  costCenterId: string
  name: string
}>

/** Comando: criar subcategoria sob uma categoria (referência por UUID = `ref` da categoria). */
export type AddSubcategoryCommand = Readonly<{
  planId: string
  categoryId: string
  name: string
  launchType: SubcategoryLaunchType
}>

// ── Árvore-eco (a resposta 201 = a árvore INTEIRA atualizada, com os UUIDs = `ref`). Entregue pronta ao
// client (que invalida o detalhe p/ reler o `PlanDetail`; a árvore-eco fica disponível p/ escrita no cache). ──

export type CostStructureTreeSubNode = Readonly<{ ref: string; name: string; launchType: string }>
export type CostStructureTreeCategoryNode = Readonly<{
  ref: string
  name: string
  subcategories: readonly CostStructureTreeSubNode[]
}>
export type CostStructureTreeCostCenterNode = Readonly<{
  ref: string
  name: string
  direction: string
  categories: readonly CostStructureTreeCategoryNode[]
}>
export type CostStructureTree = Readonly<{
  budgetPlanId: string
  costCenters: readonly CostStructureTreeCostCenterNode[]
}>
