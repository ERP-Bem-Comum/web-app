/**
 * Derivações puras de UI do Plano Orçamentário (§XI: lógica no view-model/domínio, não na view).
 * Regra de edição por status e utilitários de valor (centavos → BRL). Sem dependência de framework.
 */
import type { BudgetPlanStatus } from '#modules/budget-plans/client/data/model/enums.ts'

/** Status editáveis (legado: OPTIONS_FOR_UPDATE_BUDGET_PLAN). Aprovado = somente leitura. */
export const EDITABLE_STATUSES = ['RASCUNHO', 'EM_CALIBRACAO'] as const

/** Se o plano permite edição de valores. Aprovado → false (edita-se via "Iniciar Calibração"). */
export const deriveEditable = (status: BudgetPlanStatus): boolean =>
  (EDITABLE_STATUSES as readonly BudgetPlanStatus[]).includes(status)

/** Soma de células mensais em centavos (total anual = Σ dos 12 meses). */
export const sumMonths = (valuesInCents: readonly number[]): number =>
  valuesInCents.reduce((acc, v) => acc + v, 0)

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** Centavos (inteiros) → string BRL (ex.: 3243872 → "R$ 32.438,72"). */
export const formatCentsBRL = (cents: number): string => BRL.format(cents / 100)
