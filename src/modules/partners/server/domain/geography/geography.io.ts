/**
 * Geography — contratos de I/O da fronteira (Zod). Input das server fns (§VI). O Model que a UI consome
 * são os próprios tipos `PartnerState`/`PartnerMunicipality`. `togglePartner*` recebe `isPartner` (o BFF
 * traduz para POST=ativar / DELETE=desativar). A listagem de municípios exige `uf` (obrigatório).
 */
import * as z from 'zod'

export const TogglePartnerStateInputSchema = z.object({
  uf: z.string().trim().min(2).max(2),
  isPartner: z.boolean(),
})
export type TogglePartnerStateInput = z.infer<typeof TogglePartnerStateInputSchema>

export const ListMunicipalitiesByUfInputSchema = z.object({
  uf: z.string().trim().min(2).max(2),
})
export type ListMunicipalitiesByUfInput = z.infer<typeof ListMunicipalitiesByUfInputSchema>

export const TogglePartnerMunicipalityInputSchema = z.object({
  ibgeCode: z.string().trim().length(7),
  isPartner: z.boolean(),
})
export type TogglePartnerMunicipalityInput = z.infer<typeof TogglePartnerMunicipalityInputSchema>
