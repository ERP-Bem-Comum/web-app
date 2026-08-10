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
  | 'budget-plans.create.forbidden'
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

/**
 * Mapeia o erro do BFF (§V) para a tag i18n do modal. 409 → conflito; **403 → sem permissão**; o resto →
 * genérico.
 *
 * O 403 é separado DE PROPÓSITO: o genérico diz "Tente novamente", e para falta de permissão isso é
 * **conselho errado** — o usuário repetiria para sempre. Cenário real (core-api#374): ambiente semeado antes
 * do #315 tem 42 permissões em vez de 44 (faltam `budget-plan:read`/`budget-plan:write`), então o módulo sobe
 * conectado ao banco e responde 403 — indistinguível, na tela, de "o driver está errado".
 */
export const createErrorTag = (error: BudgetPlansError): CreatePlanError => {
  if (error === 'budget-plan-already-exists') return 'budget-plans.create.conflict'
  if (error === 'forbidden') return 'budget-plans.create.forbidden'
  return 'budget-plans.create.unexpected'
}
