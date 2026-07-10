/**
 * ViewModel PURO (§XI) das confirmações do menu "…" (HANDBOOK §2.5). Mapeia a ação para o "spec" de
 * confirmação (perigosa? pede nome?) e sinaliza quais ações abrem modal. Sem React/i18n — o texto (com
 * interpolação de {nome}) é montado na view. Front-first: a execução real depende das mutations (#113).
 */
import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'

/** Ações que abrem um modal de confirmação nesta fatia (as demais são outras features/telas). */
export type ConfirmableAction = 'approve' | 'delete' | 'start-calibration' | 'create-scenery'

/**
 * Ações SEM endpoint no backend (feature 060) — ficam VISÍVEIS porém desabilitadas (regra da P.O.: "o que não
 * tiver, deixe desativado"), com tooltip i18n. `share`/`planned-vs-actual` não têm rota; `delete` não tem
 * `DELETE /budget-plans/:id` (só `/:id/budgets/:budgetId`, que é orçamento — Grupo C).
 */
const ACTIONS_WITHOUT_ENDPOINT: ReadonlySet<PlanAction> = new Set<PlanAction>([
  'share',
  'planned-vs-actual',
  'delete',
])

/** A ação está ligada a um endpoint real? (false ⇒ o item do menu fica `disabled` + tooltip). */
export const isActionEnabled = (action: PlanAction): boolean => !ACTIONS_WITHOUT_ENDPOINT.has(action)

/**
 * Mapa PURO (§V) do erro do BFF → tag i18n para o feedback da ação. O core-api esconde o slug (OWASP), então
 * os 409 de ciclo de vida já chegam mapeados por CONTEXTO do endpoint no server (approve → already-approved,
 * scenery → not-approved, start-calibration → invalid-transition). Aqui só traduzimos a tag para a mensagem.
 */
export const actionErrorTag = (error: BudgetPlansError): string => {
  switch (error) {
    case 'unauthorized':
      return 'budget-plans.action.error.unauthorized'
    case 'budget-plan-not-found':
      return 'budget-plans.action.error.notFound'
    case 'budget-plan-already-approved':
      return 'budget-plans.action.error.alreadyApproved'
    case 'budget-plan-not-approved':
      return 'budget-plans.action.error.notApproved'
    case 'budget-plan-invalid-transition':
      return 'budget-plans.action.error.invalidTransition'
    case 'invalid-input':
      return 'budget-plans.action.error.invalidInput'
    case 'budget-plan-already-exists':
    case 'budget-plan-not-editable': // escrita de estrutura (feature 061) — não ocorre nas ações do menu
    case 'unexpected':
      return 'budget-plans.action.error.unexpected'
    default: {
      const _exhaustive: never = error
      return _exhaustive
    }
  }
}

export type ConfirmSpec = Readonly<{
  action: ConfirmableAction
  /** Botão de confirmação em vermelho (ação destrutiva). */
  danger: boolean
  /** Exibe o campo "Nome" (ex.: Criar Cenário). */
  needsName: boolean
}>

/** Retorna o spec de confirmação da ação, ou null se a ação não abre modal nesta fatia. */
export const confirmSpecFor = (action: PlanAction): ConfirmSpec | null => {
  switch (action) {
    case 'approve':
      return { action, danger: false, needsName: false }
    case 'delete':
      return { action, danger: true, needsName: false }
    case 'start-calibration':
      return { action, danger: false, needsName: false }
    case 'create-scenery':
      return { action, danger: false, needsName: true }
    case 'share':
    case 'planned-vs-actual':
    case 'export-csv':
      return null // ações de outras telas/features — não abrem confirmação aqui
    default: {
      const _exhaustive: never = action
      return _exhaustive
    }
  }
}
