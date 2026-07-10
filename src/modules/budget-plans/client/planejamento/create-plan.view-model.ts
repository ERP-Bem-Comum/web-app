/**
 * ViewModel PURO (§XI) do modal "Adicionar Plano Orçamentário" (HANDBOOK §1.2). Regras testáveis sem React:
 * validação dos campos obrigatórios (Ano + Programa) e o mapeamento do erro do BFF → tag i18n. A UNICIDADE
 * Ano+Programa deixou de ser client-side: é do backend (`POST /budget-plans` → 409), refletida via `conflict`.
 * Sem React/TanStack.
 */
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'

/** Anos oferecidos no "Criar a partir do ano de" (HANDBOOK §1.2: dropdown 2019–2025). */
export const IMPORT_YEARS = [2019, 2020, 2021, 2022, 2023, 2024, 2025] as const

/**
 * Opção de programa como a VIEW a consome: exibe `abbreviation`, submete `ref`. Espelha estruturalmente o
 * `BudgetPlanProgramOption` da `data/` (a view-burra não importa `data` — §XI boundary).
 */
export type CreatePlanProgramOption = Readonly<{ ref: string; abbreviation: string }>

/** Estado do form (o que a view apresenta e o controller mantém). `program` guarda o `programRef` selecionado. */
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

/** Tag i18n de erro do modal: validação de campo OU falha do backend (conflito/genérico). */
export type CreatePlanError =
  | 'budget-plans.create.requiredYear'
  | 'budget-plans.create.requiredProgram'
  | 'budget-plans.create.conflict'
  | 'budget-plans.create.unexpected'

/**
 * Valida os obrigatórios do form (Ano inteiro + Programa selecionado). Retorna a tag do 1º erro, ou null se
 * pode ser submetido. A unicidade NÃO é checada aqui — é do backend (409 → `conflict` via `createErrorTag`).
 */
export const validateCreatePlan = (form: CreatePlanForm): CreatePlanError | null => {
  const year = Number(form.year)
  if (form.year.trim() === '' || !Number.isInteger(year)) return 'budget-plans.create.requiredYear'
  if (form.program.trim() === '') return 'budget-plans.create.requiredProgram'
  return null
}

/** Mapeia o erro do BFF (§V) para a tag i18n do modal. 409 → conflito; o resto → genérico. */
export const createErrorTag = (error: BudgetPlansError): CreatePlanError =>
  error === 'budget-plan-already-exists' ? 'budget-plans.create.conflict' : 'budget-plans.create.unexpected'
