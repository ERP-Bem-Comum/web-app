/**
 * Binding do PRÉ-VOO da remessa (VAN, core-api#728) — ADAPTER React (o único lugar do núcleo que conhece
 * React/Query, ADR-0009). Orquestra: seleção → server fn → ViewModel puro.
 *
 * É `useMutation`, não `useQuery`, e a razão não é o verbo HTTP: o pré-voo roda quando o operador PEDE
 * (abrir a conferência), não quando a tela monta. Um `useQuery` re-buscaria sozinho a cada foco/reconexão
 * com a seleção de antes — e conferência que muda sozinha debaixo do olho de quem confere é pior que
 * nenhuma. Nada é invalidado no cache: leitura pura não mexe em título nem em remessa.
 */
import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import { reconciliationRepository } from '#modules/financial/client/data/repository/reconciliation.repository.instance.ts'
import type {
  RemittancePreview,
  GeneratedRemittance,
} from '#modules/financial/client/data/model/remittance.model.ts'
import type { ReconciliationAccount } from '#modules/financial/client/data/model/reconciliation.model.ts'

export type RemittancePreviewBinding = Readonly<{
  open: boolean
  running: boolean
  preview: RemittancePreview | null
  errorTag: string | null
  /**
   * Títulos que o operador DESMARCOU. Guardamos a exceção, não a seleção: o padrão é "vai tudo o que
   * pode ir", e um conjunto de exceções não precisa ser re-semeado quando o pré-voo volta.
   */
  unchecked: ReadonlySet<string>
  toggle: (payableId: string) => void
  /** Abre a conferência e dispara o pré-voo dos documentos informados. */
  start: (documentIds: readonly string[]) => void
  close: () => void

  // ── Geração (S3) — ⚠️ enfileira pagamento no banco ────────────────────────────
  /** Contas-cedente elegíveis a pagar. Vazio enquanto carrega ou se a listagem falhar. */
  accounts: readonly ReconciliationAccount[]
  cedenteAccountId: string
  setCedenteAccountId: (id: string) => void
  /** Confirmação armada: o clique em "Gerar" pede um segundo passo antes de mover dinheiro. */
  confirming: boolean
  arm: () => void
  disarm: () => void
  generating: boolean
  /** Comprovante do que foi gerado. Enquanto existe, o modal mostra o resultado, não a conferência. */
  generated: GeneratedRemittance | null
  /** Tag i18n da falha (comportamento) — §V. */
  generateErrorTag: string | null
  /** Mensagem PT-BR do core-api (texto). É ela que distingue as quatro recusas que chegam como 422. */
  generateErrorMessage: string | null
  generate: (documentIds: readonly string[]) => void
}>

export function useRemittancePreview(): RemittancePreviewBinding {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(() => new Set())
  const [cedenteAccountId, setCedenteAccountId] = useState('')
  const [confirming, setConfirming] = useState(false)

  // Contas-cedente: só busca com o modal aberto. Compartilha a queryKey do grid de contas (#168).
  const accountsQuery = useQuery({
    queryKey: ['financial', 'reconciliation', 'accounts'] as const,
    queryFn: () => reconciliationRepository.listAccounts(),
    staleTime: 60_000,
    enabled: open,
  })
  const accounts =
    accountsQuery.data?.ok === true ? accountsQuery.data.value.filter((a) => a.status !== 'Closed') : []

  const previewMut = useMutation({
    mutationKey: ['financial', 'remittances', 'preview'] as const,
    mutationFn: (documentIds: readonly string[]) => financialRepository.previewRemittance({ documentIds }),
  })

  const { mutate, reset } = previewMut

  // ⚠️ GERAÇÃO — a única chamada da tela que move dinheiro. Sem retry automático: repetir sozinha uma
  // requisição que pode ter enfileirado o pagamento é a receita para pagar duas vezes. Se o resultado for
  // incerto, quem decide reenviar é o operador (e o backend recusa o documento já preso).
  const generateMut = useMutation({
    mutationKey: ['financial', 'remittances', 'generate'] as const,
    retry: false,
    mutationFn: (documentIds: readonly string[]) =>
      financialRepository.generateRemittance({ cedenteAccountId, documentIds }),
    onSuccess: (res) => {
      if (!isOk(res)) return
      // Os títulos viraram Transmitido: a listagem e as contagens precisam refletir isso na hora, ou o
      // operador reenvia o que já foi ao banco.
      void queryClient.invalidateQueries({ queryKey: ['financial', 'payable-titles'] })
      void queryClient.invalidateQueries({ queryKey: ['financial', 'documents', 'list'] })
    },
  })

  const { mutate: mutateGenerate, reset: resetGenerate } = generateMut

  const start = useCallback(
    (documentIds: readonly string[]): void => {
      if (documentIds.length === 0) return
      setOpen(true)
      setUnchecked(new Set()) // nova conferência começa com tudo o que pode ir, marcado
      setConfirming(false)
      resetGenerate()
      mutate(documentIds)
    },
    [mutate, resetGenerate],
  )

  const toggle = useCallback((payableId: string): void => {
    setUnchecked((prev) => {
      const next = new Set(prev)
      if (next.has(payableId)) next.delete(payableId)
      else next.add(payableId)
      return next
    })
  }, [])

  const close = useCallback((): void => {
    setOpen(false)
    setConfirming(false)
    reset() // não guarda pré-voo velho: reabrir com outra seleção não pode mostrar o resultado da anterior
    resetGenerate() // nem comprovante velho: ele é de um pagamento que já aconteceu
  }, [reset, resetGenerate])

  const result = previewMut.data
  const preview = result !== undefined && isOk(result) ? result.value : null
  const errorTag = result !== undefined && !isOk(result) ? financialErrorTag(result.error) : null

  const genResult = generateMut.data
  const generated = genResult !== undefined && isOk(genResult) ? genResult.value : null
  const genFailure = genResult !== undefined && !isOk(genResult) ? genResult.error : null

  return {
    open,
    running: previewMut.isPending,
    preview,
    errorTag,
    unchecked,
    toggle,
    start,
    close,
    accounts,
    cedenteAccountId,
    setCedenteAccountId,
    confirming,
    arm: () => {
      setConfirming(true)
    },
    disarm: () => {
      setConfirming(false)
    },
    generating: generateMut.isPending,
    generated,
    generateErrorTag: genFailure === null ? null : financialErrorTag(genFailure.error),
    generateErrorMessage: genFailure?.message ?? null,
    generate: (documentIds) => {
      if (documentIds.length === 0 || cedenteAccountId === '') return
      setConfirming(false)
      mutateGenerate(documentIds)
    },
  }
}
