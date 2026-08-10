/**
 * ViewModel PURO (§XI) do modal "Centros de Custo" (HANDBOOK §1.5) — gestão da árvore Centro→Categoria→
 * Subcategoria por programa. Achata a árvore consolidada num shape LEVE (sem centavos) e provê as opções dos
 * dropdowns (tipo do centro, tipo da subcategoria, tipo de lançamento) a partir dos enums canônicos.
 * Sem React — testável por node:test. Escrita real: criar (feature 061) + renomear/(des)ativar (feature 075).
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

/**
 * `ref` = UUID do backend. Era só insumo dos POSTs-filho (feature 061); agora também é o ALVO do PATCH
 * (feature 075) — por isso a subcategoria passou a carregá-lo (antes o `buildCentrosTree` o descartava, e sem
 * ele não há como endereçar o 3º nível).
 *
 * `active` = estado EFETIVO (nó ∧ ancestrais), como o core entrega. NÃO é a intenção individual do nó.
 */
export type SubNode = Readonly<{ id: number; ref: string; name: string; active: boolean }>
export type CategoriaNode = Readonly<{
  id: number
  ref: string
  name: string
  active: boolean
  subCategories: readonly SubNode[]
}>
export type CentroNode = Readonly<{
  id: number
  ref: string
  name: string
  type: CostCenterType
  active: boolean
  categories: readonly CategoriaNode[]
}>

/** Achata a árvore consolidada do plano no shape leve da tela de gestão (id/nome/tipo + `ref` uuid + `active`). */
export const buildCentrosTree = (detail: PlanDetail): readonly CentroNode[] =>
  detail.costCenters.map((c) => ({
    id: c.id,
    ref: c.ref,
    name: c.name,
    type: c.type,
    active: c.active,
    categories: c.categories.map((cat) => ({
      id: cat.id,
      ref: cat.ref,
      name: cat.name,
      active: cat.active,
      subCategories: cat.subCategories.map((s) => ({
        id: s.id,
        ref: s.ref,
        name: s.name,
        active: s.active,
      })),
    })),
  }))

/**
 * Nó cujo switch está TRAVADO por herança + o nome do ancestral que o desligou (`null` = livre).
 *
 * Por que travar: o `active` que chega é o EFETIVO, mas o PATCH grava a INTENÇÃO. Com o pai desligado, ligar o
 * switch do filho gravaria `intenção = true` e a releitura devolveria `efetivo = false` — o switch voltaria
 * sozinho, sem explicação, parecendo bug. O core não expõe a intenção individual de propósito (core-api#469),
 * então a tela não tem como mostrar "ligado, mas inativo por herança". Travar + dizer o porquê é o que dá p/
 * afirmar com honestidade. Não há perda: com o pai desligado, a intenção do filho é inobservável de qualquer
 * forma. Reativou o pai? O core devolve cada filho ao que ELE era, e os switches destravam.
 */
export type NodeLock = Readonly<{ ancestorName: string }> | null

/** Trava do switch da CATEGORIA: só o centro pode desligá-la por herança. */
export const categoriaLock = (centro: CentroNode): NodeLock =>
  centro.active ? null : { ancestorName: centro.name }

/** Trava do switch da SUBCATEGORIA: o centro OU a categoria. O mais próximo (categoria) explica melhor. */
export const subLock = (centro: CentroNode, categoria: CategoriaNode): NodeLock => {
  if (!centro.active) return { ancestorName: centro.name }
  return categoria.active ? null : { ancestorName: categoria.name }
}

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

/**
 * Chave estável de um nó, para o Set de RECOLHIDOS (chevron) — UI-state puro.
 *
 * Já serviu também a um Set de "desativados" em memória (front-first): desativar não saía do navegador e
 * voltava no F5. Agora `active` é server-state (feature 075) e mora na árvore — o Set não existe mais.
 */
export const nodeKey = (kind: 'centro' | 'categoria' | 'sub', id: number): string => `${kind}:${String(id)}`
