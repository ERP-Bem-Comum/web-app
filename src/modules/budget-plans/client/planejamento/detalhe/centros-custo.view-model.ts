/**
 * ViewModel PURO (§XI) do modal "Centros de Custo" (HANDBOOK §1.5) — gestão da árvore Centro→Categoria→
 * Subcategoria por programa. Achata a árvore consolidada num shape LEVE (sem centavos) e provê as opções dos
 * dropdowns (tipo do centro, tipo da subcategoria, tipo de lançamento) a partir dos enums canônicos.
 * Sem React — testável por node:test. Front-first: escrita real (add/editar/desativar) chega com o #113.
 */
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import {
  COST_CENTER_TYPE,
  SUB_CATEGORY_TYPE,
  RELEASE_TYPE,
  type CostCenterType,
  type SubCategoryType,
  type ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

/** Re-export dos tipos de enum p/ a view burra consumir SEM furar o boundary client-ui ↛ client-data. */
export type {
  CostCenterType,
  SubCategoryType,
  ReleaseType,
} from '#modules/budget-plans/client/data/model/enums.ts'

export type SubNode = Readonly<{ id: number; name: string }>
/** `ref` = UUID do backend (feature 061 — necessário p/ o POST de subcategoria referenciar a categoria-pai). */
export type CategoriaNode = Readonly<{
  id: number
  ref?: string
  name: string
  subCategories: readonly SubNode[]
}>
/** `ref` = UUID do backend (feature 061 — necessário p/ o POST de categoria referenciar o centro-pai). */
export type CentroNode = Readonly<{
  id: number
  ref?: string
  name: string
  type: CostCenterType
  categories: readonly CategoriaNode[]
}>

/** Achata a árvore consolidada do plano no shape leve da tela de gestão (id/nome/tipo + `ref` uuid p/ escrita). */
export const buildCentrosTree = (detail: PlanDetail): readonly CentroNode[] =>
  detail.costCenters.map((c) => ({
    id: c.id,
    ...(c.ref !== undefined ? { ref: c.ref } : {}),
    name: c.name,
    type: c.type,
    categories: c.categories.map((cat) => ({
      id: cat.id,
      ...(cat.ref !== undefined ? { ref: cat.ref } : {}),
      name: cat.name,
      subCategories: cat.subCategories.map((s) => ({ id: s.id, name: s.name })),
    })),
  }))

/** Erros de submissão do formulário de estrutura (client-side + eco do backend). */
export type CentroFormError =
  | 'name-required' // nome vazio (validação client-side, antes do POST)
  | 'missing-parent' // sem centro/categoria-pai com `ref` (não deveria ocorrer — trava defensiva)

/** Valida o nome do nó (obrigatório). Retorna a tag do erro ou `null`. */
export const validateCentroName = (nome: string): CentroFormError | null =>
  nome.trim().length === 0 ? 'name-required' : null

/** Opções dos dropdowns (valor = enum canônico; rótulo = i18n resolvido na view). */
export const CENTRO_TIPO_OPTIONS: readonly CostCenterType[] = COST_CENTER_TYPE
export const SUB_TIPO_OPTIONS: readonly SubCategoryType[] = SUB_CATEGORY_TYPE
export const RELEASE_TYPE_OPTIONS: readonly ReleaseType[] = RELEASE_TYPE

/** Modo do painel de formulário (união discriminada §IV). `none` = só a árvore. */
export type CentroFormMode =
  | Readonly<{ kind: 'none' }>
  | Readonly<{ kind: 'add-centro' }>
  | Readonly<{ kind: 'edit-centro'; centroId: number }>
  | Readonly<{ kind: 'add-categoria'; centroId: number }>
  | Readonly<{ kind: 'edit-categoria'; centroId: number; categoriaId: number }>
  | Readonly<{ kind: 'add-sub'; centroId: number; categoriaId: number }>
  | Readonly<{ kind: 'edit-sub'; centroId: number; categoriaId: number; subId: number }>

/** Campos possíveis do formulário; cada modo usa um subconjunto (a view mostra só os relevantes). */
export type CentroFormFields = Readonly<{
  nome: string
  centroTipo: CostCenterType
  subTipo: SubCategoryType
  releaseType: ReleaseType
}>

export const emptyCentroFormFields = (): CentroFormFields => ({
  nome: '',
  centroTipo: 'A PAGAR',
  subTipo: 'INSTITUCIONAL',
  releaseType: 'DESPESAS_PESSOAIS',
})

/** Chave estável de um nó (para o Set de "desativados" — front-first, visual). */
export const nodeKey = (kind: 'centro' | 'categoria' | 'sub', id: number): string => `${kind}:${String(id)}`
