/**
 * GeographyRepository — porta do client para o BFF. Converte `{ ok, data|error }` → `Result` (§II).
 * Tipos do `data/model`; `PartnersError`/`FnResult` do `partners-error.ts` neutro (boundary §I). Fns
 * injetadas (testável). NÃO é CRUD: listar/alternar estados e municípios (toggle idempotente).
 */
import { ok, err, type Result } from '#shared/primitives/result.ts'
import type {
  PartnerMunicipality,
  PartnerState,
  ToggleMunicipalityInput,
  ToggleStateInput,
} from '#modules/partners/client/data/model/geography.model.ts'
import type { PartnersError, FnResult } from '#modules/partners/client/data/repository/partners-error.ts'

type ListStatesFn = () => Promise<FnResult<readonly PartnerState[]>>
type ToggleStateFn = (opts: { data: ToggleStateInput }) => Promise<FnResult<PartnerState>>
type ListMunicipalitiesFn = (opts: { data: { uf: string } }) => Promise<FnResult<readonly PartnerMunicipality[]>>
type ToggleMunicipalityFn = (opts: { data: ToggleMunicipalityInput }) => Promise<FnResult<PartnerMunicipality>>

export type GeographyRepository = Readonly<{
  listStates: () => Promise<Result<readonly PartnerState[], PartnersError>>
  toggleState: (input: ToggleStateInput) => Promise<Result<PartnerState, PartnersError>>
  listMunicipalities: (uf: string) => Promise<Result<readonly PartnerMunicipality[], PartnersError>>
  toggleMunicipality: (input: ToggleMunicipalityInput) => Promise<Result<PartnerMunicipality, PartnersError>>
}>

export const createGeographyRepository = (
  deps: Readonly<{
    listPartnerStatesFn: ListStatesFn
    togglePartnerStateFn: ToggleStateFn
    listMunicipalitiesByUfFn: ListMunicipalitiesFn
    togglePartnerMunicipalityFn: ToggleMunicipalityFn
  }>,
): GeographyRepository => ({
  listStates: async () => {
    const res = await deps.listPartnerStatesFn()
    return res.ok ? ok(res.data) : err(res.error)
  },
  toggleState: async (input) => {
    const res = await deps.togglePartnerStateFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
  listMunicipalities: async (uf) => {
    const res = await deps.listMunicipalitiesByUfFn({ data: { uf } })
    return res.ok ? ok(res.data) : err(res.error)
  },
  toggleMunicipality: async (input) => {
    const res = await deps.togglePartnerMunicipalityFn({ data: input })
    return res.ok ? ok(res.data) : err(res.error)
  },
})
