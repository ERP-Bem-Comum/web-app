/**
 * Binding da listagem de Programas — ADAPTER React. `useQuery` → estado da tabela + RBAC (`program:write`
 * para habilitar "Adicionar Programa").
 */
import { useQueries, useQuery } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { can, grantedPermissions } from '#modules/programs/client/data/helpers/can.ts'
import type { ProgramsListFilters } from '#modules/programs/client/data/programs-list-filters.schema.ts'
import type { ListProgramsInput } from '#modules/programs/client/data/model/program.model.ts'
import { programLogoQueryOptions } from '#modules/programs/client/data/program-logo.query.ts'

import { programsListQueryOptions } from './programs-list.query.ts'
import { deriveListState, type ProgramsListState } from './programs-list.view-model.ts'

export type ProgramsListBinding = Readonly<{
  state: ProgramsListState
  canCreate: boolean
  /** Logo (data URL) por id de programa — só para linhas com `logoKey`. */
  logos: ReadonlyMap<string, string>
}>

export function useProgramsListBinding(filters: ProgramsListFilters): ProgramsListBinding {
  const input: ListProgramsInput = {
    order: filters.order,
    page: filters.page,
    limit: filters.limit,
    ...(filters.search !== undefined ? { search: filters.search } : {}),
    ...(filters.status !== undefined ? { status: filters.status } : {}),
  }
  const query = useQuery(programsListQueryOptions(input))
  const current = useCurrentUser()
  const granted = grantedPermissions(current.user?.permissions)

  // Resolve o logo (bytes→data URL) das linhas que TÊM logoKey — uma query por linha (cacheada).
  const withLogo = query.data?.ok === true ? query.data.value.items.filter((p) => p.logoKey !== null) : []
  const logoResults = useQueries({ queries: withLogo.map((p) => programLogoQueryOptions(p.id)) })
  const logos = new Map<string, string>()
  withLogo.forEach((p, i) => {
    const url = logoResults[i]?.data
    if (typeof url === 'string') logos.set(p.id, url)
  })

  const state: ProgramsListState = ((): ProgramsListState => {
    if (query.isPending) return { status: 'loading' }
    const res = query.data
    if (query.isError || res === undefined) return { status: 'error', errorTag: 'programs.error.server' }
    return deriveListState(res)
  })()

  return { state, canCreate: can(granted, 'program:write'), logos }
}
