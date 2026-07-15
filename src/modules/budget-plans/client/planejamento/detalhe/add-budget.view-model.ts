/**
 * ViewModel PURO (§XI) do modal "Adicionar Orçamento" (HANDBOOK §1.6). Escolhe uma Rede (Estado/Município)
 * para adicionar uma nova coluna de orçamento; bloqueia rede que já tem orçamento. Sem React — node:test.
 *
 * ── SEM campo de VALOR (core-api#458, decisão da P.O. 2026-07-15) ──
 * Este modal tinha um campo "Valor do orçamento", **obrigatório**. Os dois eram invenção nossa:
 *  - o HANDBOOK §1.6 descreve o modal como "dropdown **Estado** + **Adicionar**" — só isso;
 *  - o DTO do legado é `{ budgetPlanId, partnerStateId?, partnerMunicipalityId? }` — **nenhum valor**;
 *  - no legado, `budget.valueInCents` é `@Column({ default: 0 })` e **nunca é persistido**: o total sobe
 *    somando os lançamentos (meses → categoria → centro). A coluna é cache; a verdade é a soma.
 *
 * O valor informado criava uma **segunda fonte** para o mesmo número — "Por Rede" mostrava o informado e
 * "Calculando Gastos" mostrava a soma, e as telas discordavam (#458). Viola o FR-007 da spec 036.
 *
 * Enquanto o `valueInCents` não sai do contrato (`addBudgetBodySchema` ainda o exige), o binding envia **0**
 * — que é EXATAMENTE o estado inicial do legado (`default: 0`), não um número inventado. Quando o core-api
 * remover o campo, o `0` sai junto.
 */

export type AddBudgetForm = Readonly<{ estado: string }>

export const emptyAddBudgetForm = (): AddBudgetForm => ({ estado: '' })

/** `estado-required` = nenhuma rede escolhida; `estado-duplicate` = a rede já tem orçamento no plano. */
export type AddBudgetError = 'estado-required' | 'estado-duplicate' | 'save-failed'

/** Valida a escolha da rede (por REF/chave natural) contra as que JÁ têm orçamento no plano. */
export const validateAddBudget = (
  form: AddBudgetForm,
  existingRefs: readonly string[],
): AddBudgetError | null => {
  if (form.estado === '') return 'estado-required'
  if (existingRefs.some((r) => r === form.estado)) return 'estado-duplicate'
  return null
}
