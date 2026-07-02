/**
 * ViewModel PURO (§XI) da tela "Calculando Gastos" (US2.4b) — deriva, do detalhe do plano, a estrutura
 * navegável Centro → Categoria → Subcategoria com os 12 valores mensais (Despesas). Sem React/TanStack.
 * O "Calcular" front-first soma os meses (a lógica sofisticada — ex.: Pessoal — vem na 2.4c/#113).
 */
import type { PlanDetail } from '#modules/budget-plans/client/data/model/plan-detail.model.ts'
import { formatCentsBRL, sumMonths } from '#modules/budget-plans/client/domain/calc/derive.ts'

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

export type CalcSub = Readonly<{ id: number; name: string; monthsInCents: readonly number[] }>
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
        name: sub.name,
        monthsInCents: sub.monthlyInCents,
      })),
    })),
  }))

export { formatCentsBRL, sumMonths }
