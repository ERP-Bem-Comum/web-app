/**
 * Binding das AÇÕES do menu "…" — ADAPTER React (§XI). Orquestra as mutations REAIS (approve / start-calibration
 * / create-scenery / export-csv) via `budgetPlansRepository`. Após uma ação que muda estado (approve/calibration/
 * scenery), INVALIDA a lista (`planejamentoListQueryKey`) e o detalhe (`planDetailQueryKey(id)`) — a grid e o
 * detalhe relêem o status/versão novos (§XI server-state). O export CSV NÃO invalida (só baixa o artefato do BFF).
 *
 * Usado pela lista E pelo detalhe: o resultado (sucesso/erro) volta por callback (`onOutcome`) para o pai
 * decidir o feedback (toast). Erros como valores (§V): a tag do BFF vira mensagem via `actionErrorTag` (puro).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { Result } from '#shared/primitives/result.ts'
import { budgetPlansRepository } from '#modules/budget-plans/client/data/repository/budget-plans.repository.instance.ts'
import type { BudgetPlanCsvFile } from '#modules/budget-plans/client/data/model/plan-actions.model.ts'
import type { BudgetPlansError } from '#modules/budget-plans/client/data/repository/budget-plans-error.ts'
import type { PlanAction } from '#modules/budget-plans/client/planejamento/planejamento-list.view-model.ts'
import { actionErrorTag } from '#modules/budget-plans/client/planejamento/plan-actions.view-model.ts'
import { planejamentoListQueryKey } from '#modules/budget-plans/client/planejamento/planejamento-list.binding.ts'
import { planDetailQueryKey } from '#modules/budget-plans/client/planejamento/detalhe/plan-detail.binding.ts'

/** Ações do menu com endpoint REAL (as demais ficam desabilitadas — ver `isActionEnabled`). */
export type RunnableAction = 'approve' | 'start-calibration' | 'create-scenery' | 'export-csv'

export type ActionOutcome =
  | Readonly<{ action: RunnableAction; ok: true }>
  | Readonly<{ action: RunnableAction; ok: false; errorTag: string }>

type ActionVars =
  | Readonly<{ action: 'approve' | 'start-calibration' | 'export-csv'; id: string }>
  | Readonly<{ action: 'create-scenery'; id: string; name: string }>

export type PlanActionsBinding = Readonly<{
  /** Dispara a ação real. `name` é obrigatório só para `create-scenery` (ignorado nas demais). */
  runAction: (action: PlanAction, id: string, name?: string) => void
  /** Ação em andamento (para o item do menu/botão mostrar pending) — null quando ociosa. */
  pendingAction: RunnableAction | null
}>

/** Dispara o download do CSV no navegador (efeito de UI idempotente; não lança). Espelha o export do Consolidado. */
const triggerDownload = (file: BudgetPlanCsvFile): void => {
  const blob = new Blob([file.content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = file.filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Saída NORMALIZADA da mutation (§IV união discriminada). Normalizar aqui — em vez de propagar a união dos 4
 * `Result` distintos — deixa o `onSuccess` narrable sem casts: `csv` só aparece no sucesso do export.
 */
type ActionSettled =
  | Readonly<{ vars: ActionVars; ok: true; csv?: BudgetPlanCsvFile }>
  | Readonly<{ vars: ActionVars; ok: false; errorTag: string }>

const settle = (
  vars: ActionVars,
  result: Result<unknown, BudgetPlansError>,
  csv?: BudgetPlanCsvFile,
): ActionSettled =>
  result.ok ? { vars, ok: true, csv } : { vars, ok: false, errorTag: actionErrorTag(result.error) }

export function usePlanActions(onOutcome: (outcome: ActionOutcome) => void): PlanActionsBinding {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (vars: ActionVars): Promise<ActionSettled> => {
      switch (vars.action) {
        case 'approve': {
          const r = await budgetPlansRepository.approvePlan(vars.id)
          return settle(vars, r)
        }
        case 'start-calibration': {
          const r = await budgetPlansRepository.startCalibration(vars.id)
          return settle(vars, r)
        }
        case 'create-scenery': {
          const r = await budgetPlansRepository.createScenery(vars.id, vars.name)
          return settle(vars, r)
        }
        case 'export-csv': {
          const r = await budgetPlansRepository.exportPlanCsv(vars.id)
          return settle(vars, r, r.ok ? r.value : undefined)
        }
        default: {
          const _exhaustive: never = vars
          return _exhaustive
        }
      }
    },
    onSuccess: (settled) => {
      if (!settled.ok) {
        onOutcome({ action: settled.vars.action, ok: false, errorTag: settled.errorTag })
        return
      }
      if (settled.csv !== undefined) {
        triggerDownload(settled.csv) // export-csv: só baixa o artefato do BFF (não invalida)
      } else {
        // Mudou o estado do plano → a lista e o detalhe relêem o real (status/versão novos).
        void queryClient.invalidateQueries({ queryKey: planejamentoListQueryKey })
        void queryClient.invalidateQueries({ queryKey: planDetailQueryKey(settled.vars.id) })
      }
      onOutcome({ action: settled.vars.action, ok: true })
    },
    onError: (_e, vars) => {
      onOutcome({ action: vars.action, ok: false, errorTag: 'budget-plans.action.error.unexpected' })
    },
  })

  return {
    runAction: (action, id, name) => {
      switch (action) {
        case 'approve':
        case 'start-calibration':
        case 'export-csv':
          mutation.mutate({ action, id })
          return
        case 'create-scenery':
          mutation.mutate({ action, id, name: name ?? '' })
          return
        // share/planned-vs-actual/delete não têm endpoint — o menu já os desabilita (isActionEnabled).
        case 'share':
        case 'planned-vs-actual':
        case 'delete':
          return
        default: {
          const _exhaustive: never = action
          return _exhaustive
        }
      }
    },
    pendingAction: mutation.isPending ? mutation.variables.action : null,
  }
}
