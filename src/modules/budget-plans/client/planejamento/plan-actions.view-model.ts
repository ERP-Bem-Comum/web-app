/**
 * ViewModel PURO (§XI) das confirmações do menu "…" (HANDBOOK §2.5). Mapeia a ação para o "spec" de
 * confirmação (perigosa? pede nome?) e sinaliza quais ações abrem modal. Sem React/i18n — o texto (com
 * interpolação de {nome}) é montado na view. Front-first: a execução real depende das mutations (#113).
 */
import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import type { BudgetPlanStatus } from '#modules/budget-plans/client/data/model/enums.ts'
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

/**
 * A ação está DISPONÍVEL? (false ⇒ o item do menu fica `disabled` + tooltip). Dois eixos (§V, regra da P.O.):
 *  1. endpoint real (as de `ACTIONS_WITHOUT_ENDPOINT` nunca habilitam);
 *  2. STATUS do plano (quando informado): `create-scenery` só em plano NÃO aprovado; `start-calibration` só em
 *     plano APROVADO — espelha a regra de domínio do backend (409 `scenery-needs-draft`/`not-approved`).
 * Sem `status`, só o eixo (1) é avaliado (compat. com chamadas legadas / quando o status não é conhecido).
 */
export const isActionEnabled = (action: PlanAction, status?: BudgetPlanStatus): boolean => {
  if (ACTIONS_WITHOUT_ENDPOINT.has(action)) return false
  if (status === undefined) return true
  if (action === 'create-scenery') return status !== 'APROVADO'
  if (action === 'start-calibration') return status === 'APROVADO'
  return true
}

/**
 * Chave i18n do tooltip do item DESABILITADO, por ação × status (§V). As gated-by-status trazem o motivo certo;
 * as demais (sem endpoint) caem no genérico `noEndpoint`. A view traduz — o ViewModel é puro (sem i18n).
 */
export const actionDisabledTitleKey = (action: PlanAction, status?: BudgetPlanStatus): string => {
  if (action === 'create-scenery' && status === 'APROVADO') {
    return 'budget-plans.action.disabled.sceneryNeedsDraft'
  }
  if (action === 'start-calibration' && status !== undefined && status !== 'APROVADO') {
    return 'budget-plans.action.disabled.calibrationNeedsApproved'
  }
  return 'budget-plans.action.noEndpoint'
}

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
    case 'budget-plan-not-approved': // start-calibration em plano NÃO aprovado
      return 'budget-plans.action.error.notApproved'
    case 'budget-plan-scenery-needs-draft': // scenery em plano APROVADO
      return 'budget-plans.action.error.sceneryNeedsDraft'
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
