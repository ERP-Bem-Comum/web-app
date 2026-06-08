/**
 * Schemas Zod de I/O de Financier — vivem na BORDA (adapters), não no domínio (C2 do review). Os tipos
 * correspondentes são escritos à mão em `../domain/financier/financier.io.ts`; guards travam o drift.
 */
import * as z from 'zod'

import type * as D from '../domain/financier/financier.io.ts'

export const ListFinanciersInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})

export const GetFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const CreateFinancierInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  corporateName: z.string().trim().min(1).max(200),
  legalRepresentative: z.string().trim().min(1).max(200),
  cnpj: z.string().trim().min(14).max(18), // aceita máscara; o client normaliza p/ 14 dígitos
  telephone: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(300),
})

export const UpdateFinancierInputSchema = CreateFinancierInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})

export const DeactivateFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const ReactivateFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

type AssertEqual<A, B> = [A] extends [B] ? true : never
 
const _g_list: AssertEqual<z.infer<typeof ListFinanciersInputSchema>, D.ListFinanciersInput> = true
const _g_get: AssertEqual<z.infer<typeof GetFinancierInputSchema>, D.GetFinancierInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateFinancierInputSchema>, D.CreateFinancierInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateFinancierInputSchema>, D.UpdateFinancierInput> = true
const _g_deact: AssertEqual<z.infer<typeof DeactivateFinancierInputSchema>, D.DeactivateFinancierInput> = true
const _g_react: AssertEqual<z.infer<typeof ReactivateFinancierInputSchema>, D.ReactivateFinancierInput> = true
 
void [_g_list, _g_get, _g_create, _g_update, _g_deact, _g_react]
