/**
 * Binding de "Alterar vencimento" por TÍTULO ISOLADO (#270) — ADAPTER React. Cada título selecionado (Aberto)
 * tem o vencimento alterado numa chamada PRÓPRIA ao `PATCH /financial/documents/:id/payables/:payableId`, que
 * **NÃO propaga** ao documento-pai nem aos irmãos (títulos são independentes — pedido da P.O.). Como não há
 * endpoint de lote isolado, N chamadas: SEQUENCIAIS por documento (o `version` é do doc e cada alteração o
 * incrementa → encadeamos a version devolvida), PARALELAS entre documentos. Contamos as falhas p/ sucesso/
 * parcial. Erros como valores; invalida lista + detalhe + grid por título. (Substitui o "vencimento em lote"
 * #162, que propagava pai↔filhos via `PATCH /documents/due-date`.)
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'

import type { FinancialError } from '#modules/financial/client/data/repository/financial-error.ts'

import type { IsolatedDueDateTarget } from './contas-a-pagar.view-model.ts'

export type IsolatedDueDateBinding = Readonly<{
  apply: (targets: readonly IsolatedDueDateTarget[], dueIso: string) => void
  running: boolean
  errorTag: string | null
  /** Quantos títulos NÃO foram alterados. 0 quando tudo passou — a UI usa no texto do erro. */
  failedCount: number
}>

/**
 * Falha TRANSITÓRIA: repetir costuma resolver, porque não há nada errado com o pedido.
 *
 * O caso medido é do backend: salvar documento COM RETENÇÃO re-insere as linhas de
 * `fin_retentions`/`fin_registered_taxes`, e sob chamadas concorrentes isso quebra de forma
 * intermitente (503 `document-repository-failure`, core-api#794). Como este binding dispara os
 * documentos em PARALELO de propósito, quanto mais documentos com imposto na seleção, maior a chance.
 *
 * `conflict`/`invalid-transition` ficam de FORA: ali o pedido está mesmo desatualizado, e repetir com
 * a mesma version só produziria o mesmo 409.
 */
/**
 * ⚠️ `connectivity` SAIU daqui (core-api ADR-0063). Enquanto o lock era a version do documento, repetir
 * era inofensivo: a mesma version ou gravava, ou dava 409 honesto. Com o CAS por VALOR
 * (`expectedDueDate`), repetir deixou de ser idempotente —
 *
 *   tentativa 1 → grava 20/08 → 10/09, com SUCESSO no banco, e a resposta se perde
 *   retry       → manda expectedDueDate=20/08, mas o título já está 10/09 → 409
 *   nós         → contaríamos como `stale` e mandaríamos o operador "atualizar a lista"
 *
 * ou seja, reportaríamos falha numa operação que deu certo, e pediríamos para refazer o que já está
 * feito. Resposta perdida é justamente o caso em que NÃO dá para saber se gravou; a resposta honesta é
 * não repetir e deixar o operador reler.
 *
 * `server` fica: a falha medida (503 do `document-repository-failure` sob concorrência) acontece ANTES
 * da gravação e a transação inteira reverte, então o título continua com o vencimento antigo e o mesmo
 * `expectedDueDate` volta a valer.
 */
const TRANSIENT: ReadonlySet<FinancialError> = new Set<FinancialError>(['server'])

// Duas repetições, com espera curta e crescente. Não é política de rede genérica: é o tempo de a
// transação concorrente terminar. Mais que isso faria o operador esperar por um erro que não vai passar.
const RETRY_DELAYS_MS = [150, 400] as const

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * O desfecho do lote, CLASSIFICADO. Antes era só um contador, e a tela dizia "versão desatualizada ou
 * status incompatível" para qualquer falha — inclusive para um 503 do servidor, que não é nem uma
 * coisa nem outra, e cuja orientação ("atualize a lista") manda fazer o que não resolve.
 */
export type DueDateOutcome = Readonly<{
  failed: number
  /** Pedido realmente desatualizado (409 / transição inválida): atualizar a lista É a ação certa. */
  stale: number
  /** Falhou do lado do servidor mesmo depois das repetições: repetir é a ação certa. */
  serverSide: number
}>

export function useIsolatedDueDate(onCompleted: () => void): IsolatedDueDateBinding {
  const queryClient = useQueryClient()

  const mut = useMutation({
    mutationKey: ['financial', 'documents', 'isolated-due-date'] as const,
    mutationFn: async (
      args: Readonly<{ targets: readonly IsolatedDueDateTarget[]; dueIso: string }>,
    ): Promise<DueDateOutcome> => {
      // O `version` (optimistic lock) é do DOCUMENTO e CADA alteração isolada o incrementa. Então títulos do
      // MESMO documento têm de ir em SEQUÊNCIA, encadeando a version devolvida na resposta — senão o 2º título
      // bate com version velha (conflito). Documentos DISTINTOS rodam em paralelo. Retorna o total de falhas.
      const byDoc = new Map<string, IsolatedDueDateTarget[]>()
      for (const t of args.targets) {
        const arr = byDoc.get(t.documentId)
        if (arr === undefined) byDoc.set(t.documentId, [t])
        else arr.push(t)
      }
      const perDoc = await Promise.all(
        [...byDoc.values()].map(async (group): Promise<DueDateOutcome> => {
          let version = group[0]?.version ?? 0
          let stale = 0
          let serverSide = 0
          for (const t of group) {
            // Repete só o transitório — e o conjunto encolheu: ver a nota do `TRANSIENT`. O PATCH
            // deixou de ser idempotente com o CAS por valor, então repetir só é seguro quando se sabe
            // que a gravação NÃO aconteceu.
            let lastError: FinancialError | null = null
            for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt += 1) {
              const res = await financialRepository.updatePayableDueDate({
                documentId: t.documentId,
                payableId: t.payableId,
                version,
                dueDate: args.dueIso,
                expectedDueDate: t.expectedDueDate,
              })
              if (isOk(res)) {
                version = res.value.version // nova version do documento p/ o próximo título
                lastError = null
                break
              }
              lastError = res.error
              if (!TRANSIENT.has(res.error) || attempt === RETRY_DELAYS_MS.length) break
              await sleep(RETRY_DELAYS_MS[attempt] ?? 0)
            }
            if (lastError !== null) {
              if (lastError === 'conflict' || lastError === 'invalid-transition') stale += 1
              else serverSide += 1
            }
          }
          return { failed: stale + serverSide, stale, serverSide }
        }),
      )
      return perDoc.reduce<DueDateOutcome>(
        (acc, o) => ({
          failed: acc.failed + o.failed,
          stale: acc.stale + o.stale,
          serverSide: acc.serverSide + o.serverSide,
        }),
        { failed: 0, stale: 0, serverSide: 0 },
      )
    },
    onSuccess: (outcome) => {
      // Mesmo com falha parcial, algo pode ter passado → invalida sempre.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'detail'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      if (outcome.failed === 0) onCompleted()
    },
  })

  // A mensagem segue o MOTIVO, porque a ação do operador difere: pedido desatualizado pede atualizar a
  // lista; falha do servidor pede repetir. Um texto só para os dois mandava metade das pessoas fazer o
  // que não resolve. Com os dois motivos juntos, vence o `stale` — é o que exige releitura antes de
  // qualquer nova tentativa.
  const outcome = mut.data
  const errorTag = mut.isPending
    ? null
    : mut.isError
      ? 'financial.list.dueDate.error' // erro global (transporte)
      : outcome === undefined || outcome.failed === 0
        ? null
        : outcome.stale > 0
          ? 'financial.list.dueDate.errorPartial'
          : 'financial.list.dueDate.errorPartialServer'

  return {
    apply: (targets, dueIso) => {
      if (targets.length > 0 && dueIso !== '') mut.mutate({ targets, dueIso })
    },
    running: mut.isPending,
    errorTag,
    failedCount: outcome?.failed ?? 0,
  }
}
