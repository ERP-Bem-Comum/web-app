/**
 * Cascata da categorização — Centro de Custo → Categoria → Subcategoria (EPIC web-app#150 · core-api#341).
 * Derivações PURAS (sem React/tanstack) sobre `FinancialReferences`, COMPARTILHADAS pelas duas telas que
 * categorizam: Lançar Documento (`document-create`) e Nova transação da Conciliação
 * (`reconciliation-workspace`). Uma regra só → as duas cascatas não divergem (spec 074).
 *
 * Modelo do backend (#147 F3 + #341): a taxonomia é uma lista PLANA auto-referente —
 *   • `parentId === null` → categoria de TOPO; `parentId === X` → SUBcategoria de X.
 *   • `costCenterId === Y` → categoria do centro Y; `costCenterId === null` → categoria GLOBAL.
 *
 * ⚠️ Por que a regra do centro é TOLERANTE (não `costCenterId === centro` puro): o core-api#341 entregou
 * a CAPACIDADE (coluna + DTO), não o DADO — o seed de referência tem todas as categorias sem centro e sem
 * pai, e portar a taxonomia do legado é follow-up (handbook do core-api, `07-categorization-taxonomy.md`).
 * Um filtro estrito deixaria a Categoria VAZIA em todo centro → lançamento quebrado. Tratando
 * `costCenterId: null` como "vale p/ qualquer centro" a tela funciona hoje e vai afunilando sozinha
 * conforme o backend atribuir os centros — sem mudança de código. Ver a decisão registrada em
 * `specs/074-categorization-3-level-hierarchy/plan.md`.
 */
import type {
  FinancialCategory,
  FinancialReferences,
} from '#modules/financial/client/data/model/reconciliation.model.ts'

/** Categorias de TOPO (sem `parentId`) — o nível "Categoria" nunca mostra subcategorias. */
export const topLevelCategories = (refs: FinancialReferences): readonly FinancialCategory[] =>
  refs.categories.filter((c) => c.parentId === null)

/**
 * Categorias oferecidas p/ um centro. Sem centro escolhido → todas as de topo (o centro é OPCIONAL no
 * lançamento; exigi-lo p/ liberar a Categoria seria regressão). Com centro → as DELE + as GLOBAIS
 * (`costCenterId: null`, ex.: as de `group: 'ajuste'`, que valem em qualquer centro).
 */
export const categoriesForCostCenter = (
  refs: FinancialReferences,
  costCenterId: string,
): readonly FinancialCategory[] => {
  const tops = topLevelCategories(refs)
  if (costCenterId === '') return tops
  return tops.filter((c) => c.costCenterId === costCenterId || c.costCenterId === null)
}

/** Subcategorias de uma categoria (`parentId` === id da categoria). Vazio se nenhuma categoria escolhida. */
export const subcategoriesOf = (
  refs: FinancialReferences,
  categoryId: string,
): readonly FinancialCategory[] =>
  categoryId === '' ? [] : refs.categories.filter((c) => c.parentId === categoryId)

/**
 * A FOLHA da cascata — o que vai p/ o backend em `categoryRef`: a categoria MAIS ESPECÍFICA escolhida
 * (subcategoria se houver, senão a categoria). Ambas são categorias válidas p/ o core-api (subcategoria
 * = categoria com `parentId`), então o contrato é um campo só. Vazio = não enviar.
 */
export const leafCategoryRef = (categoryRef: string, subcategoryRef: string): string =>
  subcategoryRef !== '' ? subcategoryRef : categoryRef
