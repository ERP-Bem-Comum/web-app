/**
 * Binding do Histórico do documento (aba do drawer) — ADAPTER React. Busca a trilha enriquecida
 * (GET /:id/timeline, autor já resolvido no BFF) e entrega a lista de linhas PURAS (`deriveTimelineRows`).
 * `id === null` ou `enabled === false` (aba inativa) → query desabilitada. União discriminada §IV.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { deriveTimelineRows, type TimelineRow } from './document-timeline.view-model.ts'

export type DocumentTimelineState =
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error' }>
  | Readonly<{ status: 'empty' }>
  | Readonly<{ status: 'ready'; rows: readonly TimelineRow[] }>

export function useDocumentTimeline(
  id: string | null,
  enabled: boolean,
): Readonly<{ state: DocumentTimelineState }> {
  const query = useQuery({
    queryKey: ['financial', 'documents', 'timeline', id] as const,
    enabled: id !== null && enabled,
    queryFn: () => financialRepository.getTimeline(id ?? ''),
  })

  const state = useMemo<DocumentTimelineState>(() => {
    if (query.isLoading || query.data === undefined) return { status: 'loading' }
    if (!query.data.ok) return { status: 'error' }
    const rows = deriveTimelineRows(query.data.value)
    return rows.length === 0 ? { status: 'empty' } : { status: 'ready', rows }
  }, [query.isLoading, query.data])

  return { state }
}
