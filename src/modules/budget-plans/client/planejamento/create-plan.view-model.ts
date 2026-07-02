/**
 * ViewModel PURO (§XI) do modal "Adicionar Plano Orçamentário" (HANDBOOK §1.2). Regras testáveis sem React:
 * validação de campos obrigatórios (Ano + Programa) e a UNICIDADE Ano+Programa contra a lista existente
 * (mensagem do legado). Reusa `CreateBudgetPlanInputSchema` como forma do input. Sem React/TanStack.
 */
import type { BudgetPlanNode } from '#modules/budget-plans/client/data/model/budget-plan.model.ts'

/** Anos oferecidos no "Criar a partir do ano de" (HANDBOOK §1.2: dropdown 2019–2025). */
export const IMPORT_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const

/** Estado do form (o que a view apresenta e o controller mantém). */
export type CreatePlanForm = Readonly<{
  year: string
  program: string
  importData: boolean
  importFromYear: string
}>

export const createPlanInitialForm: CreatePlanForm = {
  year: '2026',
  program: '',
  importData: false,
  importFromYear: '',
}

/** Tag i18n do primeiro erro de validação, ou null se o form pode ser submetido. */
export type CreatePlanError =
  | 'budget-plans.create.requiredYear'
  | 'budget-plans.create.requiredProgram'
  | 'budget-plans.create.duplicate'

/**
 * Já existe um plano-RAIZ com esse Ano+Programa? (unicidade Ano+Programa — HANDBOOK §1.2/§B.5). Casa o
 * programa contra abreviação OU nome (case-insensitive), como o funil da lista.
 */
export const isDuplicatePlan = (roots: readonly BudgetPlanNode[], year: number, program: string): boolean => {
  const p = program.trim().toLowerCase()
  return roots.some((node) => {
    if (node.year !== year) return false
    const abbr = (node.programAbbreviation ?? '').toLowerCase()
    const name = node.programName.toLowerCase()
    return abbr === p || name === p
  })
}

/** Valida o form contra os obrigatórios + unicidade. Retorna a tag do 1º erro, ou null se válido. */
export const validateCreatePlan = (
  form: CreatePlanForm,
  existing: readonly BudgetPlanNode[],
): CreatePlanError | null => {
  const year = Number(form.year)
  if (form.year.trim() === '' || !Number.isInteger(year)) return 'budget-plans.create.requiredYear'
  if (form.program.trim() === '') return 'budget-plans.create.requiredProgram'
  if (isDuplicatePlan(existing, year, form.program)) return 'budget-plans.create.duplicate'
  return null
}
