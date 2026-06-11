/**
 * Query options da geografia — AGNÓSTICO (puro, zero React). Sobre o repository.
 */
import { geographyRepository } from '#modules/partners/client/data/repository/geography.repository.instance.ts'

export const partnerStatesQueryKey = ['geography', 'states'] as const

export const partnerStatesQueryOptions = () => ({
  queryKey: partnerStatesQueryKey,
  queryFn: () => geographyRepository.listStates(),
})

export const municipalitiesQueryKey = (uf: string) => ['geography', 'municipalities', uf] as const

export const municipalitiesQueryOptions = (uf: string) => ({
  queryKey: municipalitiesQueryKey(uf),
  queryFn: () => geographyRepository.listMunicipalities(uf),
})

// Municípios parceiros de TODAS as UFs (cross-state) — painel "Adicionados".
export const addedMunicipalitiesQueryKey = ['geography', 'municipalities', 'added'] as const

export const addedMunicipalitiesQueryOptions = () => ({
  queryKey: addedMunicipalitiesQueryKey,
  queryFn: () => geographyRepository.listAddedMunicipalities(),
})
