/**
 * ViewModel PURO (§XI) do modal "Adicionar Orçamento" (HANDBOOK §1.6). Escolhe um Estado (rede) para
 * adicionar uma nova coluna de orçamento; bloqueia estado já existente. Sem React — testável por node:test.
 * Front-first: a persistência (nova coluna real) chega com o core-api #113.
 */

export type AddBudgetForm = Readonly<{ estado: string; valor: string }>

export const emptyAddBudgetForm = (): AddBudgetForm => ({ estado: '', valor: '' })

/**
 * `estado-required` = nenhum estado escolhido; `estado-duplicate` = já existe orçamento para o estado;
 * `valor-required` = valor vazio/zero (o backend exige valueInCents ≥ 0, mas 0 não faz sentido no cadastro).
 */
export type AddBudgetError = 'estado-required' | 'estado-duplicate' | 'valor-required' | 'save-failed'

/** "1.234,56" ou "1234,56" ou "1234" → centavos; inválido/≤0 → null. */
export const parseAddBudgetCents = (valor: string): number | null => {
  const clean = valor.trim().replace(/\./g, '').replace(',', '.')
  if (clean === '') return null
  const n = Number(clean)
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100)
}

/**
 * Valida a escolha da rede (por REF/chave natural) contra as que JÁ têm orçamento no plano + o valor.
 */
export const validateAddBudget = (
  form: AddBudgetForm,
  existingRefs: readonly string[],
): AddBudgetError | null => {
  if (form.estado === '') return 'estado-required'
  if (existingRefs.some((r) => r === form.estado)) return 'estado-duplicate'
  if (parseAddBudgetCents(form.valor) === null) return 'valor-required'
  return null
}
