/**
 * ViewModel PURA (sem React) do seletor de plano do gráfico "Realizado × Previsto" (specs/096 P3).
 * Mapeia o valor do <select> (string) ↔ a `RealizedSelection` do domínio, e monta a lista de opções do
 * dropdown ("Todos somados" + cada plano aprovado). O rótulo do "Todos" é uma CHAVE i18n (a View traduz).
 */
import type {
  DashboardPlanOption,
  RealizedSelection,
} from '#modules/financial/client/data/model/dashboard-realized.model.ts'

/** Valor especial do <select> para "Todos os aprovados somados". */
export const ALL_OPTION_VALUE = 'all'

/** Opção do <select> pronta p/ a View. `translate=true` → o rótulo é uma chave i18n (o "Todos"). */
export type RealizedSelectorOption = Readonly<{
  value: string
  label: string
  translate: boolean
}>

/** "Todos somados" (chave i18n) + um item por plano aprovado (rótulo já pronto do BFF). */
export const toSelectorOptions = (
  plans: readonly DashboardPlanOption[],
): readonly RealizedSelectorOption[] => [
  { value: ALL_OPTION_VALUE, label: 'dashboard.realized.all', translate: true },
  ...plans.map((p): RealizedSelectorOption => ({ value: p.id, label: p.label, translate: false })),
]

/** Valor do <select> → seleção do domínio. */
export const valueToSelection = (value: string): RealizedSelection =>
  value === ALL_OPTION_VALUE ? { kind: 'all' } : { kind: 'plan', budgetPlanId: value }

/** Seleção do domínio → valor do <select>. */
export const selectionToValue = (selection: RealizedSelection): string =>
  selection.kind === 'all' ? ALL_OPTION_VALUE : selection.budgetPlanId
