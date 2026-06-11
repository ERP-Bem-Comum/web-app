/**
 * Binding da geografia — ADAPTER React (§XI). Modelo dual-list (Lista Geral × Parceiros Adicionados),
 * por seção (Estados / Municípios). Liga queries + mutations de toggle OTIMISTAS (add = isPartner true,
 * remove = false) ao TanStack Query + RBAC. Buscas e UF selecionada são UI-state (useState).
 *
 * Otimista: `onMutate` aplica o toggle no cache (view-model puro) + snapshot; erro de NEGÓCIO chega no
 * `onSuccess` (Result.err) → reverte; `onError` cobre falha LANÇADA (rede). Sem refetch (o DTO confirma).
 *
 * Municípios "Adicionados" (todos os estados) depende de endpoint inexistente no core-api
 * (ver ticket PAR-GEO-ADDED-MUNICIPALITIES) → exposto como `municipalitiesAddedPending`.
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
  stateName,
  UF_NAMES,
} from './geography.view-model.ts'

export type ColumnItem = Readonly<{ key: string; label: string; added: boolean }>

export type GeoPanel =
  | Readonly<{ status: 'idle' }>
  | Readonly<{ status: 'loading' }>
  | Readonly<{ status: 'error'; errorTag: string }>
  | Readonly<{ status: 'ready'; items: readonly ColumnItem[] }>

export type UfOption = Readonly<{ uf: string; name: string }>

export type GeographyBinding = Readonly<{
  // Estados
  statesGeneral: GeoPanel
  statesAdded: GeoPanel
  statesCount: string | null
  statesGeneralSearch: string
  setStatesGeneralSearch: (v: string) => void
  statesAddedSearch: string
  setStatesAddedSearch: (v: string) => void
  addState: (uf: string) => void
  removeState: (uf: string) => void
  // Municípios
  ufOptions: readonly UfOption[]
  selectedUf: string | null
  selectUf: (uf: string) => void
  municipalitiesGeneral: GeoPanel
  municipalitiesGeneralSearch: string
  setMunicipalitiesGeneralSearch: (v: string) => void
  municipalitiesAddedSearch: string
  setMunicipalitiesAddedSearch: (v: string) => void
  /** Painel "Adicionados (todos os estados)" pendente de endpoint no core-api. */
  municipalitiesAddedPending: boolean
  addMunicipality: (ibgeCode: string) => void
  removeMunicipality: (ibgeCode: string) => void
  // Comuns
  canWrite: boolean
  toggleErrorTag: string | null
  togglePending: boolean
}>

type StatesData = Result<readonly PartnerState[], PartnersError>
type MunisData = Result<readonly PartnerMunicipality[], PartnersError>

const UF_OPTIONS: readonly UfOption[] = Object.keys(UF_NAMES)
  .map((uf) => ({ uf, name: stateName(uf) }))
  .sort((a, b) => a.name.localeCompare(b.name))

const matches = (label: string, search: string): boolean =>
  label.toLowerCase().includes(search.trim().toLowerCase())

export function useGeographyBinding(): GeographyBinding {
  const queryClient = useQueryClient()
  const current = useCurrentUser()
  const canWrite = can(grantedPermissions(current.user?.permissions), 'geography:write')

  const [selectedUf, setSelectedUf] = useState<string | null>(null)
  const [toggleErrorTag, setToggleErrorTag] = useState<string | null>(null)
  const [statesGeneralSearch, setStatesGeneralSearch] = useState('')
  const [statesAddedSearch, setStatesAddedSearch] = useState('')
  const [municipalitiesGeneralSearch, setMunicipalitiesGeneralSearch] = useState('')
  const [municipalitiesAddedSearch, setMunicipalitiesAddedSearch] = useState('')

  const statesQuery = useQuery(partnerStatesQueryOptions())
  const munisQuery = useQuery({
    ...municipalitiesQueryOptions(selectedUf ?? ''),
    enabled: selectedUf !== null,
  })

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
    setSelectedUf(uf === '' ? null : uf)
    setToggleErrorTag(null)
    setMunicipalitiesGeneralSearch('')
  }, [])

  // ── Estados: lista completa (com nome) derivada da query ──
  const allStates: readonly ColumnItem[] | null =
    statesQuery.data !== undefined && isOk(statesQuery.data)
      ? [...statesQuery.data.value]
          .map((s) => ({ key: s.uf, label: stateName(s.uf), added: s.isPartner }))
          .sort((a, b) => a.label.localeCompare(b.label))
      : null

  const statesGeneral = panelFrom(statesQuery, allStates, (items) =>
    items.filter((i) => matches(i.label, statesGeneralSearch)),
  )
  const statesAdded = panelFrom(statesQuery, allStates, (items) =>
    items.filter((i) => i.added && matches(i.label, statesAddedSearch)),
  )
  const statesCount =
    allStates === null ? null : `${String(allStates.filter((i) => i.added).length)}/${String(allStates.length)}`

  // ── Municípios da UF selecionada (Lista Geral) ──
  const allMunis: readonly ColumnItem[] | null =
    selectedUf !== null && munisQuery.data !== undefined && isOk(munisQuery.data)
      ? sortMunicipalities(munisQuery.data.value).map((m) => ({ key: m.ibgeCode, label: m.name, added: m.isPartner }))
      : null

  const municipalitiesGeneral: GeoPanel =
    selectedUf === null
      ? { status: 'idle' }
      : panelFrom(munisQuery, allMunis, (items) => items.filter((i) => matches(i.label, municipalitiesGeneralSearch)))

  return {
    statesGeneral,
    statesAdded,
    statesCount,
    statesGeneralSearch,
    setStatesGeneralSearch,
    statesAddedSearch,
    setStatesAddedSearch,
    addState: (uf) => { stateMutation.mutate({ uf, isPartner: true }) },
    removeState: (uf) => { stateMutation.mutate({ uf, isPartner: false }) },

    ufOptions: UF_OPTIONS,
    selectedUf,
    selectUf,
    municipalitiesGeneral,
    municipalitiesGeneralSearch,
    setMunicipalitiesGeneralSearch,
    municipalitiesAddedSearch,
    setMunicipalitiesAddedSearch,
    municipalitiesAddedPending: true,
    addMunicipality: (ibgeCode) => { muniMutation.mutate({ ibgeCode, isPartner: true }) },
    removeMunicipality: (ibgeCode) => { muniMutation.mutate({ ibgeCode, isPartner: false }) },

    canWrite,
    toggleErrorTag,
    togglePending: stateMutation.isPending || muniMutation.isPending,
  }
}

/** Deriva GeoPanel (loading/error/ready) aplicando `transform` sobre os itens já mapeados. */
function panelFrom(
  query: Readonly<{ isPending: boolean; isError: boolean }>,
  items: readonly ColumnItem[] | null,
  transform: (items: readonly ColumnItem[]) => readonly ColumnItem[],
): GeoPanel {
  if (query.isPending) return { status: 'loading' }
  if (query.isError || items === null) return { status: 'error', errorTag: 'partners.error.server' }
  return { status: 'ready', items: transform(items) }
}
