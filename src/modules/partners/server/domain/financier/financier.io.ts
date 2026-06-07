/**
 * Financier — contratos de I/O da fronteira (Zod). Input das server fns (§VI) + Model que a UI consome.
 * Alinhado ao contrato REAL (`financier-schemas.ts`): PJ-only (6 campos obrigatórios), query
 * page/limit/order/search/active, create/update = PUT total. Sem `categories`, sem payment-target.
 */
import * as z from 'zod'
import type { ActivationStatus } from './financier.types.ts'

export const ListFinanciersInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})
export type ListFinanciersInput = z.infer<typeof ListFinanciersInputSchema>

export const GetFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type GetFinancierInput = z.infer<typeof GetFinancierInputSchema>

export const CreateFinancierInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  corporateName: z.string().trim().min(1).max(200),
  legalRepresentative: z.string().trim().min(1).max(200),
  cnpj: z.string().trim().min(14).max(18), // aceita máscara; o client normaliza p/ 14 dígitos
  telephone: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(300),
})
export type CreateFinancierInput = z.infer<typeof CreateFinancierInputSchema>

export const UpdateFinancierInputSchema = CreateFinancierInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})
export type UpdateFinancierInput = z.infer<typeof UpdateFinancierInputSchema>

export const DeactivateFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type DeactivateFinancierInput = z.infer<typeof DeactivateFinancierInputSchema>

export const ReactivateFinancierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type ReactivateFinancierInput = z.infer<typeof ReactivateFinancierInputSchema>

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type FinancierListItem = Readonly<{
  id: string
  name: string
  corporateName: string
  cnpj: string
  telephone: string
  activation: ActivationStatus
}>

export type FinancierDetail = FinancierListItem &
  Readonly<{
    legalRepresentative: string
    address: string
  }>

export type FinancierListResponse = Readonly<{
  items: readonly FinancierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
