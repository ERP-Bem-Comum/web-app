/**
 * ViewModel PURO (§XI) da tela "Calculando Gastos" (US2.4b) — deriva, do detalhe do plano, a estrutura
 * navegável Centro → Categoria → Subcategoria com os 12 valores mensais (Despesas). Sem React/TanStack.
 * O "Calcular" front-first soma os meses (a lógica sofisticada — ex.: Pessoal — vem na 2.4c/#113).
 */
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import type { ReleaseType } from '#modules/budget-plans/client/data/model/enums.ts'
import { formatCentsBRL, sumMonths } from '#modules/budget-plans/client/domain/calc/derive.ts'

/** Re-export p/ a view burra rotear o form pelo Tipo de lançamento SEM furar o boundary client-ui ↛ data. */
export type { ReleaseType } from '#modules/budget-plans/client/data/model/enums.ts'

/** Meses em Title Case (coluna Despesas do modal), Janeiro…Dezembro. */
export const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
] as const

export type CalcSub = Readonly<{
  id: number
  ref?: string // #C2: UUID do backend (casa com budget-results.subcategoryId — necessário p/ persistir o cálculo)
  name: string
  monthsInCents: readonly number[]
  releaseType?: ReleaseType
}>
export type CalcCategory = Readonly<{ id: number; name: string; subCategories: readonly CalcSub[] }>
export type CalcCentro = Readonly<{ id: number; name: string; categories: readonly CalcCategory[] }>

/** Espelha a árvore consolidada do plano, expondo os 12 meses de cada subcategoria (Despesas). */
export const buildCalcGastosCentros = (detail: PlanDetail): readonly CalcCentro[] =>
  detail.costCenters.map((cc) => ({
    id: cc.id,
    name: cc.name,
    categories: cc.categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      subCategories: cat.subCategories.map((sub) => ({
        id: sub.id,
        ref: sub.ref,
        name: sub.name,
        monthsInCents: sub.monthlyInCents,
        releaseType: sub.releaseType,
      })),
    })),
  }))

/**
 * #C2: resolve o `budgetId` (rede/orçamento) da tela a partir do filtro do Detalhe. A rede editada casa contra
 * `networks[].ref` (chave natural #394). Casa primeiro pelo `municipio` (mais específico); se não houver rede
 * municipal, cai no `estado` (UF) — cobre tanto programas municipais quanto estaduais (a tela força selecionar
 * ambos p/ editar). `null` = nenhuma rede casa (ex.: filtro sem orçamento cadastrado) → o cálculo não persiste.
 */
export const resolveNetworkBudgetId = (
  networks: readonly Readonly<{ ref: string; budgetId: string }>[],
  estado: string,
  municipio: string,
): string | null => {
  const byMunicipio = municipio !== '' ? (networks.find((n) => n.ref === municipio)?.budgetId ?? null) : null
  if (byMunicipio !== null) return byMunicipio
  return estado !== '' ? (networks.find((n) => n.ref === estado)?.budgetId ?? null) : null
}

export { formatCentsBRL, sumMonths }
