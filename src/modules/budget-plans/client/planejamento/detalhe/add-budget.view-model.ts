/**
 * ViewModel PURO (§XI) do modal "Adicionar Orçamento" (HANDBOOK §1.6). Escolhe um Estado (rede) para
 * adicionar uma nova coluna de orçamento; bloqueia estado já existente. Sem React — testável por node:test.
 * Front-first: a persistência (nova coluna real) chega com o core-api #113.
 */
import type { RegionOption } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.view-model.ts'

export type AddBudgetForm = Readonly<{ estado: string }>

export const emptyAddBudgetForm = (): AddBudgetForm => ({ estado: '' })

/** `estado-required` = nenhum estado escolhido; `estado-duplicate` = já existe orçamento para o estado. */
export type AddBudgetError = 'estado-required' | 'estado-duplicate'

/**
 * Valida a escolha do estado contra os que JÁ têm orçamento (nomes das redes do plano). Compara pelo
 * RÓTULO da opção (ex.: 'AC' → 'Acre'), case-insensitive.
 */
export const validateAddBudget = (
  form: AddBudgetForm,
  options: readonly RegionOption[],
  existingNames: readonly string[],
): AddBudgetError | null => {
  if (form.estado === '') return 'estado-required'
  const label = options.find((o) => o.value === form.estado)?.label ?? form.estado
  const taken = existingNames.some((n) => n.trim().toLowerCase() === label.trim().toLowerCase())
  return taken ? 'estado-duplicate' : null
}
