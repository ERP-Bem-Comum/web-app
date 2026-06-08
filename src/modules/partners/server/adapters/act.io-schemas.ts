/**
 * Schemas Zod de I/O de Act — vivem na BORDA (adapters), não no domínio (C2 do review). Os tipos
 * correspondentes são escritos à mão em `../domain/act/act.io.ts`; guards travam o drift.
 */
import * as z from 'zod'

import type * as D from '../domain/act/act.io.ts'

const OccupationAreaSchema = z.enum(['PARC', 'DDI', 'DCE', 'EPV'])
const EmploymentRelationshipSchema = z.enum(['CLT', 'PJ'])

export const ListActsInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})

export const GetActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const CreateActInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cpf: z.string().trim().min(11).max(14),
  occupationArea: OccupationAreaSchema,
  role: z.string().trim().min(1).max(120),
  startOfContract: z.iso.date(), // YYYY-MM-DD (validado na borda)
  employmentRelationship: EmploymentRelationshipSchema,
})

// Edição (PUT /acts/:id) — substituição total dos 7 campos cadastrais.
export const UpdateActInputSchema = CreateActInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})

// Desativar: SEM motivo (o core-api não recebe body). Idempotente.
export const DeactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const ReactivateActInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

type AssertEqual<A, B> = [A] extends [B] ? true : never
 
const _g_list: AssertEqual<z.infer<typeof ListActsInputSchema>, D.ListActsInput> = true
const _g_get: AssertEqual<z.infer<typeof GetActInputSchema>, D.GetActInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateActInputSchema>, D.CreateActInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateActInputSchema>, D.UpdateActInput> = true
const _g_deact: AssertEqual<z.infer<typeof DeactivateActInputSchema>, D.DeactivateActInput> = true
const _g_react: AssertEqual<z.infer<typeof ReactivateActInputSchema>, D.ReactivateActInput> = true
 
void [_g_list, _g_get, _g_create, _g_update, _g_deact, _g_react]
