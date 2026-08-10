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

/** Nível do nó no PATCH. O core-api tem uma ROTA por nível (o nível vem do PATH, não do body). */
export type CostNodeLevel = 'cost-center' | 'category' | 'subcategory'

/**
 * Comando: renomear e/ou (des)ativar um nó (feature 075 — #454 gap 3). Um PATCH cobre os 3 níveis × 2 campos.
 *
 * `name` e `active` são opcionais (é PATCH), mas **não** ambos ausentes: o core recusa `{}` com
 * `cost-node-patch-empty` (400). Quem monta o comando garante ao menos um — não é um no-op de sucesso.
 *
 * Não há DELETE de nó: os lançamentos apontam para a subcategoria SEM FK, e apagar deixaria histórico órfão.
 * Desativar é `active: false`; `true` reativa.
 */
export type PatchCostNodeCommand = Readonly<{
  planId: string
  level: CostNodeLevel
  nodeId: string
  name?: string
  active?: boolean
}>

// ── Árvore-eco (a resposta 200/201 = a árvore INTEIRA atualizada, com os UUIDs = `ref`). Entregue pronta ao
// client (que invalida o detalhe p/ reler o `PlanDetail`; a árvore-eco fica disponível p/ escrita no cache). ──

/**
 * `active` é o estado EFETIVO (nó ∧ ancestrais), derivado pelo core na LEITURA — não a intenção individual do
 * nó. Desativar um Centro não grava nos filhos: eles vêm `active: false` por HERANÇA. O core não expõe a
 * intenção de propósito (core-api#469), então **não dá p/ recalcular herança aqui** — mostre o que vem.
 */
export type CostStructureTreeSubNode = Readonly<{
  ref: string
  name: string
  launchType: string
  active: boolean
}>
export type CostStructureTreeCategoryNode = Readonly<{
  ref: string
  name: string
  active: boolean
  subcategories: readonly CostStructureTreeSubNode[]
}>
export type CostStructureTreeCostCenterNode = Readonly<{
  ref: string
  name: string
  direction: string
  active: boolean
  categories: readonly CostStructureTreeCategoryNode[]
}>
export type CostStructureTree = Readonly<{
  budgetPlanId: string
  costCenters: readonly CostStructureTreeCostCenterNode[]
}>
