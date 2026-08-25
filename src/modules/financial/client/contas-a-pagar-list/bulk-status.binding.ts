/**
 * Binding de "Mudar Status" em MASSA — ADAPTER React. Aplica `approve` (Aberto→Aprovado) ou
 * `undo-approval` (Aprovado→Aberto) a cada linha selecionada, levando o `version` (optimistic lock) de
 * cada uma. Erros são VALORES (sem throw): roda `Promise.all`, colhe as falhas e, no fim, invalida a
 * lista + o detalhe. Se tudo passou, chama `onCompleted` (a page limpa a seleção).
 *
 * ⚠️ **As falhas são REPORTADAS, não só contadas.** Antes este binding descartava `.error` e a tela
 * caía numa frase única — "Algumas ações não foram concluídas (atualize e tente de novo)" —, que é
 * falsa em quase todo caso real: o backend responde com precisão, e o motivo mais comum do approve não
 * tem nada a ver com "tentar de novo". As quatro recusas do aprovador (não cadastrado, sem permissão,
 * alçada insuficiente, leitura do auth indisponível) chegam TODAS como 422 → `validation`, e só a
 * MENSAGEM PT-BR do core-api as separa. Mandar o operador atualizar e repetir, ali, é mandá-lo repetir
 * o que vai falhar de novo.
 *
 * Só `approve`/`undo-approval` existem na borda HTTP; submit/pay/transmit/reconcile seguem chrome (#91 etc.).
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk, type Result } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import type { DocumentDetail } from '#modules/financial/client/data/model/document.model.ts'
import type { FinancialFailure } from '#modules/financial/client/data/model/remittance.model.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'

import type { StatusTarget } from './contas-a-pagar.view-model.ts'

type BulkResult = readonly Result<DocumentDetail, FinancialFailure>[]

/**
 * Uma falha, pronta para a tela. `documentNumber` identifica QUAL documento — numa seleção de vinte,
 * "algumas falharam" não diz ao operador onde mexer.
 *
 * `message` é o texto do core-api quando existe; `tag` é o fallback por comportamento (§V). Nunca os
 * dois na tela: a mensagem específica ganha da genérica.
 */
export type BulkFailure = Readonly<{
  documentNumber: string
  message: string | null
  tag: string
}>

export type BulkStatusBinding = Readonly<{
  approve: (targets: readonly StatusTarget[]) => void
  reopen: (targets: readonly StatusTarget[]) => void
  running: boolean
  errorTag: string | null
  /** Uma entrada por documento que falhou, na ordem da seleção. Vazio quando tudo passou. */
  failures: readonly BulkFailure[]
}>

// Casa resultado com alvo pelo ÍNDICE: `Promise.all` preserva a ordem de entrada, e é o único vínculo
// disponível — a falha não carrega o id do documento, só o motivo.
const collectFailures = (
  data: BulkResult | undefined,
  targets: readonly StatusTarget[],
): readonly BulkFailure[] => {
  if (data === undefined) return []
  const out: BulkFailure[] = []
  data.forEach((r, i) => {
    if (isOk(r)) return
    out.push({
      // Sem número (rascunho sem numeração), o id ainda localiza a linha — melhor que nada nenhum.
      documentNumber: targets[i]?.documentNumber ?? targets[i]?.id ?? '—',
      message: r.error.message,
      tag: financialErrorTag(r.error.error),
    })
  })
  return out
}

export function useBulkStatus(onCompleted: () => void): BulkStatusBinding {
  const queryClient = useQueryClient()

  const afterRun = (data: BulkResult): void => {
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
    void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
    // #201: o grid por título também reflete a transição.
    void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
    if (data.every(isOk)) onCompleted()
  }

  const approveMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-approve'] as const,
    mutationFn: (targets: readonly StatusTarget[]): Promise<BulkResult> =>
      Promise.all(targets.map((t) => financialRepository.approve(t))),
    onSuccess: afterRun,
  })
  const reopenMut = useMutation({
    mutationKey: ['financial', 'documents', 'bulk-reopen'] as const,
    mutationFn: (targets: readonly StatusTarget[]): Promise<BulkResult> =>
      Promise.all(targets.map((t) => financialRepository.undoApproval(t))),
    onSuccess: afterRun,
  })

  const running = approveMut.isPending || reopenMut.isPending
  // `variables` é a seleção que a mutation recebeu — é ela que casa com `data` por índice.
  const failures = running
    ? []
    : [
        ...collectFailures(approveMut.data, approveMut.variables ?? []),
        ...collectFailures(reopenMut.data, reopenMut.variables ?? []),
      ]

  return {
    approve: (targets) => {
      if (targets.length > 0) approveMut.mutate(targets)
    },
    reopen: (targets) => {
      if (targets.length > 0) reopenMut.mutate(targets)
    },
    running,
    // Cabeçalho do bloco de erros — o detalhe vem em `failures`. Segue `null` quando nada falhou.
    errorTag: failures.length === 0 ? null : 'financial.list.status.bulkError',
    failures,
  }
}
