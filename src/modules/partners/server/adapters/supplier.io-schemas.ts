/**
 * Schemas Zod de I/O de Supplier — vivem na BORDA (adapters), não no domínio (C2 do review). Os tipos
 * correspondentes são escritos à mão em `../domain/supplier/supplier.io.ts`; guards travam o drift.
 */
import * as z from 'zod'

import type * as D from '../domain/supplier/supplier.io.ts'

const BankAccountSchema = z.object({
  bank: z.string().trim().min(1).max(20),
  agency: z.string().trim().min(1).max(20),
  accountNumber: z.string().trim().min(1).max(30),
  checkDigit: z.string().trim().max(5),
})

// No body de create/update o core-api aceita keyType livre (validado no domínio); espelhamos a união real.
const PixKeySchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim().min(1).max(140),
})

export const ListSuppliersInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  categories: z.array(z.string().trim().max(80)).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})

export const GetSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const CreateSupplierInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cnpj: z.string().trim().min(14).max(18), // aceita máscara; o client normaliza p/ 14 dígitos
  corporateName: z.string().trim().min(1).max(200),
  fantasyName: z.string().trim().min(1).max(200),
  serviceCategory: z.string().trim().min(1).max(80),
  bankAccount: BankAccountSchema.nullable().default(null),
  pixKey: PixKeySchema.nullable().default(null),
  // Avaliação de serviço (§1.6) — enum FIXO (D1) + comentário; ambos opcionais (null = sem avaliação).
  serviceRating: z.enum(['RUIM', 'REGULAR', 'BOM', 'OTIMO']).nullable().default(null),
  ratingComment: z.string().trim().max(500).nullable().default(null),
})

export const UpdateSupplierInputSchema = CreateSupplierInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})

export const DeactivateSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

export const ReactivateSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })

type AssertEqual<A, B> = [A] extends [B] ? true : never
 
const _g_list: AssertEqual<z.infer<typeof ListSuppliersInputSchema>, D.ListSuppliersInput> = true
const _g_get: AssertEqual<z.infer<typeof GetSupplierInputSchema>, D.GetSupplierInput> = true
const _g_create: AssertEqual<z.infer<typeof CreateSupplierInputSchema>, D.CreateSupplierInput> = true
const _g_update: AssertEqual<z.infer<typeof UpdateSupplierInputSchema>, D.UpdateSupplierInput> = true
const _g_deact: AssertEqual<z.infer<typeof DeactivateSupplierInputSchema>, D.DeactivateSupplierInput> = true
const _g_react: AssertEqual<z.infer<typeof ReactivateSupplierInputSchema>, D.ReactivateSupplierInput> = true
 
void [_g_list, _g_get, _g_create, _g_update, _g_deact, _g_react]
