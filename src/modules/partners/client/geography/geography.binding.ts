/**
 * Binding da geografia — ADAPTER React (§XI). Liga as queries (estados/municípios) e as mutations de
 * toggle (OTIMISTAS, com rollback) ao TanStack Query + RBAC. UI-state `selectedUf` (useState — o painel
 * de municípios depende dele). Entrega listas já formatadas p/ o `territory-list` (page burra) + comandos.
 *
 * Otimista: `onMutate` aplica o toggle no cache (via view-model puro) e guarda o snapshot; como o
 * repository devolve `Result` (não lança), o ERRO DE NEGÓCIO chega no `onSuccess` (Result.err) → reverte;
 * o `onError` cobre falha LANÇADA (rede). Sem refetch (o DTO confirma) — §XII/otimista.
 */
import { useCallback, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { useCurrentUser } from '#modules/auth/public-api/index.ts'
import { ok, isOk, isErr, type Result } from '#shared/primitives/result.ts'
import { can, grantedPermissions } from '#modules/partners/client/data/helpers/can.ts'
import { partnersErrorTag } from '#modules/partners/client/data/helpers/partners-error-tag.ts'
import type { PartnersError } from '#modules/partners/client/data/repository/partners-error.ts'
import type { PartnerMunicipality, PartnerState } from '#modules/partners/client/data/model/geography.model.ts'
import { geographyRepository } from '#modules/partners/client/data/repository/geography.repository.instance.ts'

import {
  partnerStatesQueryOptions,
  municipalitiesQueryOptions,
  partnerStatesQueryKey,
  municipalitiesQueryKey,
} from './geography.query.ts'
import {
  applyMunicipalityToggle,
  applyStateToggle,
  sortMunicipalities,
  sortStates,
} from './geography.view-model.ts'

/** Item formatado para o `territory-list` (burro). `key` = uf (estado) ou ibgeCode (município). */
export type TerritoryItem = Readonly<{ key: string; label: string; checked: boolean }>

export type PanelState<T> =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; items: readonly T[] }>

export type GeographyBinding = Readonly<{
  states: PanelState<TerritoryItem>
  municipalities: PanelState<TerritoryItem>
  selectedUf: string | null
  selectUf: (uf: string) => void
  canWrite: boolean
  toggleErrorTag: string | null
  toggleState: (uf: string, isPartner: boolean) => void
  toggleMunicipality: (ibgeCode: string, isPartner: boolean) => void
  togglePending: boolean
}>

type StatesData = Result<readonly PartnerState[], PartnersError>
type MunisData = Result<readonly PartnerMunicipality[], PartnersError>

export function useGeographyBinding(): GeographyBinding {
  const queryClient = useQueryClient()
  const current = useCurrentUser()
  const canWrite = can(grantedPermissions(current.user?.permissions), 'geography:write')

  const [selectedUf, setSelectedUf] = useState<string | null>(null)
  const [toggleErrorTag, setToggleErrorTag] = useState<string | null>(null)

  const statesQuery = useQuery(partnerStatesQueryOptions())
  const munisQuery = useQuery({
    ...municipalitiesQueryOptions(selectedUf ?? ''),
    enabled: selectedUf !== null,
  })

  // ── toggles otimistas ──
  const stateMutation = useMutation({
    mutationFn: (vars: Readonly<{ uf: string; isPartner: boolean }>) => geographyRepository.toggleState(vars),
    onMutate: async (vars) => {
      setToggleErrorTag(null)
      await queryClient.cancelQueries({ queryKey: partnerStatesQueryKey })
      const prev = queryClient.getQueryData<StatesData>(partnerStatesQueryKey)
      queryClient.setQueryData<StatesData>(partnerStatesQueryKey, (old) =>
        old !== undefined && isOk(old) ? ok(applyStateToggle(old.value, vars.uf, vars.isPartner)) : old,
      )
      return { prev }
    },
    onSuccess: (result, _vars, ctx) => {
      if (isErr(result)) {
        if (ctx.prev !== undefined) queryClient.setQueryData(partnerStatesQueryKey, ctx.prev)
        setToggleErrorTag(partnersErrorTag(result.error))
      }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(partnerStatesQueryKey, ctx.prev)
      setToggleErrorTag('partners.error.server')
    },
  })

  const muniMutation = useMutation({
    mutationFn: (vars: Readonly<{ ibgeCode: string; isPartner: boolean }>) =>
      geographyRepository.toggleMunicipality(vars),
    onMutate: async (vars) => {
      setToggleErrorTag(null)
      const key = municipalitiesQueryKey(selectedUf ?? '')
      await queryClient.cancelQueries({ queryKey: key })
      const prev = queryClient.getQueryData<MunisData>(key)
      queryClient.setQueryData<MunisData>(key, (old) =>
        old !== undefined && isOk(old) ? ok(applyMunicipalityToggle(old.value, vars.ibgeCode, vars.isPartner)) : old,
      )
      return { prev, key }
    },
    onSuccess: (result, _vars, ctx) => {
      if (isErr(result)) {
        if (ctx.prev !== undefined) queryClient.setQueryData(ctx.key, ctx.prev)
        setToggleErrorTag(partnersErrorTag(result.error))
      }
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev !== undefined) queryClient.setQueryData(ctx.key, ctx.prev)
      setToggleErrorTag('partners.error.server')
    },
  })

  const selectUf = useCallback((uf: string) => {
    setSelectedUf(uf)
    setToggleErrorTag(null)
  }, [])

  return {
    states: derivePanel(statesQuery, (data) =>
      sortStates(data).map((s) => ({ key: s.uf, label: s.uf, checked: s.isPartner })),
    ),
    municipalities:
      selectedUf === null
        ? { status: 'idle' }
        : derivePanel(munisQuery, (data) =>
            sortMunicipalities(data).map((m) => ({ key: m.ibgeCode, label: m.name, checked: m.isPartner })),
          ),
    selectedUf,
    selectUf,
    canWrite,
    toggleErrorTag,
    toggleState: (uf, isPartner) => {
      stateMutation.mutate({ uf, isPartner })
    },
    toggleMunicipality: (ibgeCode, isPartner) => {
      muniMutation.mutate({ ibgeCode, isPartner })
    },
    togglePending: stateMutation.isPending || muniMutation.isPending,
  }
}

/** Deriva o estado de painel (loading/error/ready) de uma query cujo `data` é um `Result`. */
function derivePanel<TData, TItem>(
  query: Readonly<{ isPending: boolean; isError: boolean; data: Result<readonly TData[], PartnersError> | undefined }>,
  toItems: (data: readonly TData[]) => readonly TItem[],
): PanelState<TItem> {
  if (query.isPending) return { status: 'loading' }
  const res = query.data
  if (query.isError || res === undefined) return { status: 'error', errorTag: 'partners.error.server' }
  if (!isOk(res)) return { status: 'error', errorTag: partnersErrorTag(res.error) }
  return { status: 'ready', items: toItems(res.value) }
}
