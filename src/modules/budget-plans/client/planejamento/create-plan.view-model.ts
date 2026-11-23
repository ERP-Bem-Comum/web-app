/**
 * ViewModel PURO (§XI) do modal "Adicionar Plano Orçamentário" (HANDBOOK §1.2). Regras testáveis sem React:
 * validação dos campos obrigatórios (Ano + Programa) e o mapeamento do erro do BFF → tag i18n. A UNICIDADE
 * Ano+Programa deixou de ser client-side: é do backend (`POST /budget-plans` → 409), refletida via `conflict`.
 * Sem React/TanStack.
 */
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'

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
  | 'budget-plans.create.requiredImportYear'
  | 'budget-plans.create.importSameYear'
  | 'budget-plans.create.importSourceNotApproved'
  | 'budget-plans.create.importOrphan'
  | 'budget-plans.create.conflict'
  | 'budget-plans.create.forbidden'
  | 'budget-plans.create.unexpected'

/**
 * Valida os obrigatórios do form (Ano inteiro + Programa selecionado + ano de origem, se "Importar dados" está
 * ligado). Retorna a tag do 1º erro, ou null se pode ser submetido. A unicidade NÃO é checada aqui — é do backend
 * (409 → `conflict` via `createErrorTag`).
 */
export const validateCreatePlan = (form: CreatePlanForm): CreatePlanError | null => {
  const year = Number(form.year)
  if (form.year.trim() === '' || !Number.isInteger(year)) return 'budget-plans.create.requiredYear'
  if (form.program.trim() === '') return 'budget-plans.create.requiredProgram'
  if (form.importData) {
    if (form.importFromYear === '') return 'budget-plans.create.requiredImportYear'
    if (Number(form.importFromYear) === year) return 'budget-plans.create.importSameYear'
  }
  return null
}

/**
 * Comando de criação a partir do form já validado (spec 134). `importFromYear` só vai quando "Importar dados"
 * está ligado — com o toggle desligado o plano nasce vazio, mesmo que um ano tenha sido escolhido antes.
 */
export const toCreateInput = (
  form: CreatePlanForm,
): Readonly<{ year: number; programRef: string; importFromYear?: number }> => ({
  year: Number(form.year),
  programRef: form.program,
  ...(form.importData && form.importFromYear !== '' ? { importFromYear: Number(form.importFromYear) } : {}),
})

/**
 * Situação do seletor "Criar a partir do ano de" (spec 134). Os anos vêm dos planos APROVADOS do programa, então
 * sem programa não há o que listar; e "nenhum ano" precisa ser dito, não um seletor vazio que parece quebrado.
 */
export type ImportYearsState =
  | Readonly<{ kind: 'needs-program' }>
  | Readonly<{ kind: 'loading' }>
  | Readonly<{ kind: 'failed' }>
  | Readonly<{ kind: 'empty' }>
  | Readonly<{ kind: 'ready'; years: readonly number[] }>

/**
 * Deriva a situação do seletor. O ano do PRÓPRIO plano novo sai da lista (o core recusa copiar do mesmo ano).
 * `years` = `undefined` enquanto carrega; `null` quando a leitura falhou.
 */
export const importYearsState = (
  program: string,
  targetYear: string,
  years: readonly number[] | null | undefined,
): ImportYearsState => {
  if (program.trim() === '') return { kind: 'needs-program' }
  if (years === undefined) return { kind: 'loading' }
  if (years === null) return { kind: 'failed' }
  const target = Number(targetYear)
  const options = years.filter((y) => y !== target)
  return options.length === 0 ? { kind: 'empty' } : { kind: 'ready', years: options }
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
  // Spec 134 — criar a partir de outro ano (core-api#1092).
  if (error === 'budget-plan-import-same-year') return 'budget-plans.create.importSameYear'
  if (error === 'budget-plan-import-source-not-approved') return 'budget-plans.create.importSourceNotApproved'
  if (error === 'budget-result-orphan-subcategory') return 'budget-plans.create.importOrphan'
  return 'budget-plans.create.unexpected'
}
