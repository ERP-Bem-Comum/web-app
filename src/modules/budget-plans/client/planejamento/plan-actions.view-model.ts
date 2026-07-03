/**
 * ViewModel PURO (§XI) das confirmações do menu "…" (HANDBOOK §2.5). Mapeia a ação para o "spec" de
 * confirmação (perigosa? pede nome?) e sinaliza quais ações abrem modal. Sem React/i18n — o texto (com
 * interpolação de {nome}) é montado na view. Front-first: a execução real depende das mutations (#113).
 */
import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'

/** Ações que abrem um modal de confirmação nesta fatia (as demais são outras features/telas). */
export type ConfirmableAction = 'approve' | 'delete' | 'start-calibration' | 'create-scenery'

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
