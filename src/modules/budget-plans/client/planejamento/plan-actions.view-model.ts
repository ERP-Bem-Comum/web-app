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
 * tiver, deixe desativado"), com tooltip i18n. `share`/`planned-vs-actual` não têm rota.
 *
 * `delete` saiu daqui na feature 076: o `DELETE /budget-plans/:id` existe (core-api #453). Ele passou a ser
 * gated por STATUS + CENÁRIOS, como o `create-scenery` — não mais por ausência de rota.
 */
const ACTIONS_WITHOUT_ENDPOINT: ReadonlySet<PlanAction> = new Set<PlanAction>(['share', 'planned-vs-actual'])

/**
 * A ação está DISPONÍVEL? (false ⇒ o item do menu fica `disabled` + tooltip). Dois eixos (§V, regra da P.O.):
 *  1. endpoint real (as de `ACTIONS_WITHOUT_ENDPOINT` nunca habilitam);
 *  2. STATUS do plano (quando informado): `create-scenery` só em plano NÃO aprovado; `start-calibration` só em
 *     plano APROVADO — espelha a regra de domínio do backend (409 `scenery-needs-draft`/`not-approved`).
 * Sem `status`, só o eixo (1) é avaliado (compat. com chamadas legadas / quando o status não é conhecido).
 */
/**
 * Teto de cenários por plano — ESPELHA `MAX_SCENERIES` do domínio do core-api
 * (`budget-plans/domain/budget-plan/budget-plan.ts`). Duplicar regra de domínio no front é um mal necessário
 * aqui: sem isto o menu OFERECE a ação, o backend devolve 409 e a P.O. leva uma mensagem de erro no lugar de
 * um item desabilitado com o motivo. Se o backend mudar o teto, isto precisa acompanhar.
 */
export const MAX_SCENERIES = 2

/**
 * Contexto da LINHA que o gate de `create-scenery` precisa além do status. O backend recusa em 3 casos
 * (`budget-plan.ts:145-148`) e o front só conhecia o 1º:
 *   1. plano APROVADO            → `budget-plan-already-approved`
 *   2. o próprio nó é um CENÁRIO → `budget-plan-is-scenario`     (cenário não gera cenário)
 *   3. já tem MAX_SCENERIES      → `budget-plan-scenery-limit`
 */
export type SceneryContext = Readonly<{
  /** O nó é um cenário? (tem `scenarioName`). */
  isScenario?: boolean
  /** Quantos cenários já pendem deste plano. */
  sceneryCount?: number
}>

export const isActionEnabled = (
  action: PlanAction,
  status?: BudgetPlanStatus,
  ctx?: SceneryContext,
): boolean => {
  if (ACTIONS_WITHOUT_ENDPOINT.has(action)) return false
  if (status === undefined) return true
  if (action === 'create-scenery') {
    if (status === 'APROVADO') return false
    if (ctx?.isScenario === true) return false
    return (ctx?.sceneryCount ?? 0) < MAX_SCENERIES
  }
  // `delete` (feature 076): ESPELHA as 2 recusas do domínio do core (`delete-budget-plan.ts`, #453). Duplicar
  // regra de domínio aqui é o mesmo mal necessário do `create-scenery` acima — e aqui pesa mais: os dois 409 do
  // DELETE são INDISTINGUÍVEIS na resposta (o core esconde o slug), então sem este gate a usuária confirmaria
  // uma ação IRREVERSÍVEL e levaria "não foi possível excluir" sem saber por quê. Se o backend afrouxar, isto
  // acompanha.
  if (action === 'delete') {
    if (status === 'APROVADO') return false // aprovado é imutável: o Consolidado ABC agrega aprovados
    return (ctx?.sceneryCount ?? 0) === 0 // apaga-se de baixo pra cima: cenário-filho barra o pai
  }
  if (action === 'start-calibration') return status === 'APROVADO'
  return true
}

/**
 * Chave i18n do tooltip do item DESABILITADO, por ação × status (§V). As gated-by-status trazem o motivo certo;
 * as demais (sem endpoint) caem no genérico `noEndpoint`. A view traduz — o ViewModel é puro (sem i18n).
 */
export const actionDisabledTitleKey = (
  action: PlanAction,
  status?: BudgetPlanStatus,
  ctx?: SceneryContext,
): string => {
  if (action === 'create-scenery' && status === 'APROVADO') {
    return 'budget-plans.action.disabled.sceneryNeedsDraft'
  }
  // Ordem importa: o motivo mais específico primeiro, senão o tooltip mente (foi o que aconteceu em tela).
  if (action === 'create-scenery' && ctx?.isScenario === true) {
    return 'budget-plans.action.disabled.sceneryFromScenery'
  }
  if (action === 'create-scenery' && (ctx?.sceneryCount ?? 0) >= MAX_SCENERIES) {
    return 'budget-plans.action.disabled.sceneryLimit'
  }
  if (action === 'start-calibration' && status !== undefined && status !== 'APROVADO') {
    return 'budget-plans.action.disabled.calibrationNeedsApproved'
  }
  // `delete` (feature 076). Ordem: o motivo mais específico primeiro, senão o tooltip mente — a mesma lição que
  // o `create-scenery` acima aprendeu em tela. Um plano aprovado COM cenário é barrado pelos dois; citar o
  // aprovado é o mais útil (é o estado que a usuária vê na linha).
  if (action === 'delete' && status === 'APROVADO') {
    return 'budget-plans.action.disabled.deleteApproved'
  }
  if (action === 'delete' && (ctx?.sceneryCount ?? 0) > 0) {
    return 'budget-plans.action.disabled.deleteHasChildren'
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
    // 403 ≠ erro inesperado: a mensagem NÃO manda "tentar novamente" — permissão não se resolve tentando.
    case 'forbidden':
      return 'budget-plans.action.error.forbidden'
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
    // DELETE (feature 076): 409 por aprovado OU por ter cenário — indistinguíveis, uma mensagem cobre os dois.
    // Só chega em CORRIDA (aprovaram/criaram cenário entre o render e o clique); no normal o item já está
    // desabilitado com o motivo certo.
    case 'budget-plan-not-deletable':
      return 'budget-plans.action.error.notDeletable'
    case 'invalid-input':
      return 'budget-plans.action.error.invalidInput'
    case 'budget-plan-already-exists':
    case 'budget-plan-not-editable': // escrita de estrutura (feature 061) — não ocorre nas ações do menu
    case 'cost-node-not-found': // PATCH de nó (feature 075) — idem: só o modal §1.5 edita a árvore
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
