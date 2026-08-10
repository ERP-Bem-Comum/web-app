/**
 * Cascata da categorização a partir da ÁRVORE DO PLANO (ADR-0051 · web-app Fatia 1 · core-api#448/#457).
 *
 * Quando o Lançar Documento tem um Plano Orçamentário selecionado, os 3 dropdowns (Centro de Custo →
 * Categoria → Subcategoria) NÃO vêm do catálogo operacional (`fin_categories`, o "dado aleatório" do seed) —
 * vêm da árvore CADASTRADA no módulo de Orçamento para AQUELE plano. O ADR-0051 fixa: a taxonomia planejável
 * é do PLANO; `fin_categories` guarda só o operacional (`Estorno`/`Ajuste`, sem plano).
 *
 * ── Camada (§I / ADR-0004) ── Este helper é `client-data` PURO e NÃO importa o `PlanDetail` da public-api do
 * budget-plans (o boundary proíbe `client-data` → outro módulo). Trabalha num shape NEUTRO e mínimo
 * (`PlanCostTree`); é o BINDING (camada client-ui, que pode tocar a public-api) que passa o `PlanDetail` —
 * como ele tem MAIS campos, a tipagem estrutural aceita sem mapear. Mesma disciplina do mapper de reports:
 * o dado cross-módulo é traduzido na borda, e a regra pura fica agnóstica de onde veio.
 *
 * ── `active` (feature 075) ── Nós inativos (por intenção ou por herança do ancestral) NÃO entram na cascata:
 * categorizar um lançamento novo numa subcategoria desativada seria escolher um destino que o Orçamento
 * marcou como fora de uso. O `active` que a árvore traz já é o EFETIVO (nó ∧ ancestrais), então filtrar por
 * ele em cada nível basta — um centro inativo já chega com categorias/subs inativas.
 */

/** Shape mínimo de um nó da árvore de custo — o subconjunto do `PlanDetail` que a cascata realmente usa. */
export type PlanSubNode = Readonly<{ ref: string; name: string; active: boolean }>
export type PlanCatNode = Readonly<{
  ref: string
  name: string
  active: boolean
  subCategories: readonly PlanSubNode[]
}>
export type PlanCcNode = Readonly<{
  ref: string
  name: string
  active: boolean
  categories: readonly PlanCatNode[]
}>
export type PlanCostTree = Readonly<{ costCenters: readonly PlanCcNode[] }>

/** Opção de dropdown: `value` = `ref` (UUID), `label` = nome. Mesma forma dos hooks operacionais. */
export type TaxonomyOption = Readonly<{ value: string; label: string }>

/** Centros de custo ATIVOS do plano. */
export const planCostCenterOptions = (plan: PlanCostTree): readonly TaxonomyOption[] =>
  plan.costCenters.filter((cc) => cc.active).map((cc) => ({ value: cc.ref, label: cc.name }))

/**
 * Categorias ATIVAS do centro escolhido. `''` (nenhum centro) → vazio: diferente do operacional, na árvore do
 * plano a categoria SÓ existe sob um centro — não há categoria global. Sem centro, não há o que oferecer.
 */
export const planCategoryOptions = (plan: PlanCostTree, costCenterRef: string): readonly TaxonomyOption[] => {
  if (costCenterRef === '') return []
  const center = plan.costCenters.find((cc) => cc.ref === costCenterRef)
  if (center === undefined) return []
  return center.categories.filter((c) => c.active).map((c) => ({ value: c.ref, label: c.name }))
}

/**
 * Subcategorias ATIVAS da categoria escolhida. Varre os centros porque o `ref` da categoria é único no plano
 * (a busca não depende de saber o centro-pai) — mantém a assinatura igual à do helper operacional
 * (`subcategoriesOf(refs, categoryRef)`), então a page troca a fonte sem mudar o encadeamento.
 */
export const planSubcategoryOptions = (
  plan: PlanCostTree,
  categoryRef: string,
): readonly TaxonomyOption[] => {
  if (categoryRef === '') return []
  for (const center of plan.costCenters) {
    const category = center.categories.find((c) => c.ref === categoryRef)
    if (category !== undefined) {
      return category.subCategories.filter((s) => s.active).map((s) => ({ value: s.ref, label: s.name }))
    }
  }
  return []
}
