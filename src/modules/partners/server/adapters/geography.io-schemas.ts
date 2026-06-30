/**
 * Schemas Zod de I/O da geografia de parceria — vivem na BORDA (adapters), não no domínio (C2 do
 * review: domínio puro, sem Zod). Os tipos correspondentes são escritos à mão em
 * `../domain/geography/geography.io.ts`; os guards no fim travam o drift schema↔tipo.
 */
import * as z from 'zod'

import type * as D from '../domain/geography/geography.io.ts'

export const TogglePartnerStateInputSchema = z.object({
  uf: z.string().trim().min(2).max(2),
  isPartner: z.boolean(),
})

export const ListMunicipalitiesByUfInputSchema = z.object({
  uf: z.string().trim().min(2).max(2),
})

export const TogglePartnerMunicipalityInputSchema = z.object({
  ibgeCode: z.string().trim().length(7),
  isPartner: z.boolean(),
})

type AssertEqual<A, B> = [A] extends [B] ? true : never
 
const _g_toggleState: AssertEqual<z.infer<typeof TogglePartnerStateInputSchema>, D.TogglePartnerStateInput> = true
const _g_listMun: AssertEqual<z.infer<typeof ListMunicipalitiesByUfInputSchema>, D.ListMunicipalitiesByUfInput> = true
const _g_toggleMun: AssertEqual<z.infer<typeof TogglePartnerMunicipalityInputSchema>, D.TogglePartnerMunicipalityInput> = true
 
void [_g_toggleState, _g_listMun, _g_toggleMun]
