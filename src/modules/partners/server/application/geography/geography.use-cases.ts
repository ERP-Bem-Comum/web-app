/**
 * Use-cases de Geography (application) — orquestram o client do core-api. Thin sobre a borda; sem I/O
 * direto (o client é injetado). Result em tudo (§II). Exercita os VOs branded UF/IbgeCode na escrita (§IV)
 * antes de tocar o core-api — falha vira `invalid-state`/`invalid-ibge-code` (mesmos slugs do backend).
 */
import { err, isErr, type Result } from '#shared/primitives/result.ts'
import { UF } from '#modules/partners/server/domain/value-objects/uf.value-object.ts'
import { IbgeCode } from '#modules/partners/server/domain/value-objects/ibge-code.value-object.ts'
import type { PartnersError } from '#modules/partners/server/domain/errors/partners.errors.ts'
import type { PartnerState, PartnerMunicipality } from '#modules/partners/server/domain/geography/geography.types.ts'

export type GeographyClient = Readonly<{
  listPartnerStates: (token: string) => Promise<Result<readonly PartnerState[], PartnersError>>
  setPartnerState: (uf: string, isPartner: boolean, token: string) => Promise<Result<PartnerState, PartnersError>>
  listMunicipalitiesByUf: (uf: string, token: string) => Promise<Result<readonly PartnerMunicipality[], PartnersError>>
  setPartnerMunicipality: (ibgeCode: string, isPartner: boolean, token: string) => Promise<Result<PartnerMunicipality, PartnersError>>
}>

type Deps = Readonly<{ client: GeographyClient }>

export const createListPartnerStates =
  (deps: Deps) =>
  (token: string): Promise<Result<readonly PartnerState[], PartnersError>> =>
    deps.client.listPartnerStates(token)

export const createTogglePartnerState =
  (deps: Deps) =>
  (uf: string, isPartner: boolean, token: string): Promise<Result<PartnerState, PartnersError>> =>
    isErr(UF(uf)) ? Promise.resolve(err('invalid-state')) : deps.client.setPartnerState(uf, isPartner, token)

export const createListMunicipalitiesByUf =
  (deps: Deps) =>
  (uf: string, token: string): Promise<Result<readonly PartnerMunicipality[], PartnersError>> =>
    isErr(UF(uf)) ? Promise.resolve(err('invalid-state')) : deps.client.listMunicipalitiesByUf(uf, token)

export const createTogglePartnerMunicipality =
  (deps: Deps) =>
  (ibgeCode: string, isPartner: boolean, token: string): Promise<Result<PartnerMunicipality, PartnersError>> =>
    isErr(IbgeCode(ibgeCode))
      ? Promise.resolve(err('invalid-ibge-code'))
      : deps.client.setPartnerMunicipality(ibgeCode, isPartner, token)
