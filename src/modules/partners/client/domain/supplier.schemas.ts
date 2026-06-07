/**
 * Schemas Zod do CLIENT (borda do usuário) — filtros da listagem (search params) e valores do
 * formulário (create/edit). Validação na fronteira do cliente (§IX). NÃO importa server/domain.
 */
import * as z from 'zod'

// ── Filtros da listagem (search params da rota; coerção pois vêm da URL) ──
export const SupplierListFiltersSchema = z.object({
  search: z.string().trim().max(120).optional(),
  active: z.coerce.boolean().optional(),
  categories: z.array(z.string().trim().max(80)).optional(),
  order: z.enum(['ASC', 'DESC']).default('ASC'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(5),
})
export type SupplierListFilters = z.infer<typeof SupplierListFiltersSchema>

// ── Formulário (create/edit) ──
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CNPJ: aceita com ou sem máscara; normaliza para 14 dígitos (o server fn aceita 14–18). */
export const CnpjFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length === 14, { error: 'cnpj-invalid' })

export const BankAccountFormSchema = z.object({
  bank: z.string().trim().min(1).max(20),
  agency: z.string().trim().min(1).max(20),
  accountNumber: z.string().trim().min(1).max(30),
  checkDigit: z.string().trim().max(5),
})

export const PixKeyFormSchema = z.object({
  keyType: z.enum(['cpf', 'cnpj', 'email', 'phone', 'random-key']),
  key: z.string().trim().min(1).max(140),
})

export const SupplierFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  corporateName: z.string().trim().min(1).max(200),
  fantasyName: z.string().trim().min(1).max(200),
  email: z.email(),
  cnpj: CnpjFieldSchema,
  serviceCategory: z.string().trim().min(1).max(80),
  // Grupos sensíveis: "tudo ou nada" — quando presentes, os subcampos obrigatórios já são exigidos acima.
  bankAccount: BankAccountFormSchema.nullable().default(null),
  pixKey: PixKeyFormSchema.nullable().default(null),
})
export type SupplierFormValues = z.infer<typeof SupplierFormSchema>
