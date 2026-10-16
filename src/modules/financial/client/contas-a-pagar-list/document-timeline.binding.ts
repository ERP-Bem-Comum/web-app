/**
 * Binding do Histórico do documento (aba do drawer) — ADAPTER React. Busca a trilha enriquecida
 * (GET /:id/timeline, autor já resolvido no BFF) e entrega a lista de linhas PURAS (`deriveTimelineRows`).
 * `id === null` ou `enabled === false` (aba inativa) → query desabilitada. União discriminada §IV.
 */
import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'

import { createTranslator } from '#shared/i18n/index.ts'
import { ptBR } from '#shared/i18n/catalog.pt-BR.ts'
import { financialRepository } from '#modules/financial/client/data/repository/financial.repository.instance.ts'
import { referenceOptionsQuery } from '../document-create/category-options.binding.ts'
import { programOptionsQueryOptions } from '../document-create/program-options.binding.ts'
import {
  buildCategorizationResolvers,
  documentDetailQueryOptions,
  planCategorizationQueryOptions,
} from './document-categorization.binding.ts'
import {
  buildTimelineValueResolver,
  deriveTimelineRows,
  type TimelineRow,
} from './document-timeline.view-model.ts'

const t = createTranslator(ptBR)

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
  // spec 125: nomes da categorização/forma no diff — MESMAS queries (e cache) do drawer, sem request a mais.
  const references = useQuery(referenceOptionsQuery)
  const programs = useQuery(programOptionsQueryOptions)
  const detail = useQuery(documentDetailQueryOptions(id))
  const plan = useQuery(planCategorizationQueryOptions(detail.data?.budgetPlanRef ?? null))
  const resolve = useMemo(
    () =>
      buildTimelineValueResolver(
        buildCategorizationResolvers(references.data, programs.data, plan.data ?? null),
        t,
      ),
    [references.data, programs.data, plan.data],
  )

  const state = useMemo<DocumentTimelineState>(() => {
    if (query.isLoading || query.data === undefined) return { status: 'loading' }
    if (!query.data.ok) return { status: 'error' }
    const rows = deriveTimelineRows(query.data.value, resolve)
    return rows.length === 0 ? { status: 'empty' } : { status: 'ready', rows }
  }, [query.isLoading, query.data, resolve])

  return { state }
}
