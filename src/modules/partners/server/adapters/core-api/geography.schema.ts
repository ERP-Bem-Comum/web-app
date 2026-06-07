/**
 * Zod dos responses do core-api de geografia (boundary §VI). Shape alinhado a
 * `partner-geography-schemas.ts`: estados `{ uf, isPartner }`; municípios `{ ibgeCode, uf, name, isPartner }`.
 * GET devolve array puro (sem paginação); POST/DELETE devolvem o DTO do item (200).
 */
import * as z from 'zod'

export const CoreApiPartnerStateSchema = z.object({
  uf: z.string().trim(),
  isPartner: z.boolean(),
})
export const CoreApiPartnerStateListSchema = z.array(CoreApiPartnerStateSchema)

export const CoreApiPartnerMunicipalitySchema = z.object({
  ibgeCode: z.string().trim(),
  uf: z.string().trim(),
  name: z.string().trim(),
  isPartner: z.boolean(),
})
export const CoreApiPartnerMunicipalityListSchema = z.array(CoreApiPartnerMunicipalitySchema)
