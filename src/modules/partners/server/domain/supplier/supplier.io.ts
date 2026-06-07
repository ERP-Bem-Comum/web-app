/**
 * Supplier — contratos de I/O da fronteira (Zod). Input das server fns (validação na borda §VI) + Model
 * que a UI consome. Alinhado ao contrato REAL (`supplier-schemas.ts` do core-api): query
 * page/limit/order/search/active/categories; create/update = PUT total dos campos; bankAccount/pixKey
 * coesos (ou null). A invariante "≥1 payment target" e o catálogo de categorias são validados pelo core-api.
 */
import * as z from 'zod'
import type { ActivationStatus, BankAccount, SupplierPixKey } from './supplier.types.ts'

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

// ── Input (validado na server fn) ──────────────────────────────────────────────
export const ListSuppliersInputSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.boolean().optional(),
  categories: z.array(z.string().trim().max(80)).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(5),
})
export type ListSuppliersInput = z.infer<typeof ListSuppliersInputSchema>

export const GetSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type GetSupplierInput = z.infer<typeof GetSupplierInputSchema>

export const CreateSupplierInputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cnpj: z.string().trim().min(14).max(18), // aceita máscara; o client normaliza p/ 14 dígitos
  corporateName: z.string().trim().min(1).max(200),
  fantasyName: z.string().trim().min(1).max(200),
  serviceCategory: z.string().trim().min(1).max(80),
  bankAccount: BankAccountSchema.nullable().default(null),
  pixKey: PixKeySchema.nullable().default(null),
})
export type CreateSupplierInput = z.infer<typeof CreateSupplierInputSchema>

export const UpdateSupplierInputSchema = CreateSupplierInputSchema.extend({
  id: z.string().trim().min(1).max(64),
})
export type UpdateSupplierInput = z.infer<typeof UpdateSupplierInputSchema>

export const DeactivateSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type DeactivateSupplierInput = z.infer<typeof DeactivateSupplierInputSchema>

export const ReactivateSupplierInputSchema = z.object({ id: z.string().trim().min(1).max(64) })
export type ReactivateSupplierInput = z.infer<typeof ReactivateSupplierInputSchema>

// ── Model (o que a UI consome) ─────────────────────────────────────────────────
export type SupplierListItem = Readonly<{
  id: string
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  serviceCategory: string
  activation: ActivationStatus
}>

export type SupplierDetail = SupplierListItem &
  Readonly<{
    bankAccount: BankAccount | null
    pixKey: SupplierPixKey | null
  }>

export type SupplierListResponse = Readonly<{
  items: readonly SupplierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>
