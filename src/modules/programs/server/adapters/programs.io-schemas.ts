/**
 * Schemas Zod de I/O de Programs — vivem na BORDA (adapters), não no domínio (C2). Os tipos
 * correspondentes são escritos à mão em `../domain/program.io.ts`; guards travam o drift.
 * Alinhado ao `GET/POST/PUT /api/v1/programs` (limit ∈ {5,10,25}, status ATIVO|INATIVO).
 */
import * as z from 'zod'

import type * as D from '../domain/program.io.ts'

export const ListProgramsInputSchema = z.object({
  search: z.string().trim().max(128).optional(),
  status: z.enum(['ATIVO', 'INATIVO']).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.union([z.literal(5), z.literal(10), z.literal(25)]).default(5),
})

export const CreateProgramInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  sigla: z.string().trim().min(1).max(40),
  director: z.string().trim().max(200).nullable(),
  generalCharacteristics: z.string().trim().max(2000).nullable(),
})

export const UpdateProgramInputSchema = CreateProgramInputSchema.extend({
  version: z.int().min(1),
})

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : never) : never
const _g_list: AssertEqual<z.infer<typeof ListProgramsInputSchema>, D.ListProgramsInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateProgramInputSchema>, D.CreateProgramInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateProgramInputSchema>, D.UpdateProgramInput> = true
void [_g_list, _g_create, _g_update]
