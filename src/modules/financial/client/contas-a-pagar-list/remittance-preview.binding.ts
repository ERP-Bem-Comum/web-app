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
import { useMutation } from '@tanstack/react-query'

import { isOk } from '#shared/primitives/result.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { financialErrorTag } from '#modules/financial/client/data/helpers/financial-error-tag.ts'
import type { RemittancePreview } from '#modules/financial/client/data/model/remittance.model.ts'

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
}>

export function useRemittancePreview(): RemittancePreviewBinding {
  const [open, setOpen] = useState(false)
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(() => new Set())

  const previewMut = useMutation({
    mutationKey: ['financial', 'remittances', 'preview'] as const,
    mutationFn: (documentIds: readonly string[]) => financialRepository.previewRemittance({ documentIds }),
  })

  const { mutate, reset } = previewMut

  const start = useCallback(
    (documentIds: readonly string[]): void => {
      if (documentIds.length === 0) return
      setOpen(true)
      setUnchecked(new Set()) // nova conferência começa com tudo o que pode ir, marcado
      mutate(documentIds)
    },
    [mutate],
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
    reset() // não guarda pré-voo velho: reabrir com outra seleção não pode mostrar o resultado da anterior
  }, [reset])

  const result = previewMut.data
  const preview = result !== undefined && isOk(result) ? result.value : null
  const errorTag = result !== undefined && !isOk(result) ? financialErrorTag(result.error) : null

  return { open, running: previewMut.isPending, preview, errorTag, unchecked, toggle, start, close }
}
