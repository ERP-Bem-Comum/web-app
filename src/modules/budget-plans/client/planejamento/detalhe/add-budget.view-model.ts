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

// Estado + Município (legado V1): orçamento é de um estado OU de um município (o município pertence a um
// estado). `estado` = UF; `municipio` = ref do município (vazio → orçamento do estado). Ver
// `addBudgetEstadoOptions`/`addBudgetMunicipioOptions`/`addBudgetRefFor` em `plan-detail.view-model.ts`.
export type AddBudgetForm = Readonly<{ estado: string; municipio: string }>

export const emptyAddBudgetForm = (): AddBudgetForm => ({ estado: '', municipio: '' })

/** `estado-required` = nenhuma rede resolvida; `estado-duplicate` = a rede já tem orçamento no plano. */
export type AddBudgetError = 'estado-required' | 'estado-duplicate' | 'save-failed'

/**
 * Valida a REDE efetiva (a `ref` já resolvida pelo binding via `addBudgetRefFor` — município ou estado)
 * contra as que JÁ têm orçamento no plano. `null` = nada válido escolhido.
 */
export const validateAddBudget = (
  ref: string | null,
  existingRefs: readonly string[],
): AddBudgetError | null => {
  if (ref === null) return 'estado-required'
  if (existingRefs.some((r) => r === ref)) return 'estado-duplicate'
  return null
}
