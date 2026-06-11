/**
 * Model do client (client-data) — tipos de I/O do repository, espelhando o contrato do BFF.
 * Definidos localmente (não importa server/domain nem public-api — boundary §I); a validação do
 * response contra o core-api já acontece na server fn (§IX). Camada `data`.
 * Aqui também vive o schema Zod do FORMULÁRIO (validação na borda do cliente) — fica em `data` para
 * o controller poder consumi-lo sem furar a fronteira client-controller↛client-domain.
 */
import * as z from 'zod'

export type ActivationStatus = 'active' | 'inactive'

/** Tipos de chave PIX aceitos pelo contrato do core-api (client). FONTE ÚNICA: `type`, `z.enum` e a
 * lista de `<option>` derivam daqui — `as const` evita drift entre as 4 materializações anteriores. */
export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export const isPixKeyType = (v: string): v is PixKeyType =>
  (PIX_KEY_TYPES as readonly string[]).includes(v)

/** Níveis de avaliação de serviço (§1.6). Enum FIXO no front (D1) — não consome GET /service-ratings.
 *  `null` = sem avaliação (D2). FONTE ÚNICA: `type`, `z.enum` e a lista de `<option>` derivam daqui. */
export const SERVICE_RATINGS = ['RUIM', 'REGULAR', 'BOM', 'OTIMO'] as const
export type ServiceRating = (typeof SERVICE_RATINGS)[number]

export const isServiceRating = (v: string): v is ServiceRating =>
  (SERVICE_RATINGS as readonly string[]).includes(v)

export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

export type SupplierPixKey = Readonly<{
  keyType: PixKeyType
  key: string
}>

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
    // Avaliação de serviço (§1.6) — null = sem avaliação (D2).
    serviceRating: ServiceRating | null
    ratingComment: string | null
  }>

export type SupplierListResponse = Readonly<{
  items: readonly SupplierListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type SupplierListInput = Readonly<{
  search?: string
  active?: boolean
  // mutável: a server fn (Zod) espera string[]; é input efêmero, não estado.
  categories?: string[]
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}>

export type SupplierWriteInput = Readonly<{
  name: string
  corporateName: string
  fantasyName: string
  email: string
  cnpj: string
  serviceCategory: string
  bankAccount: BankAccount | null
  pixKey: SupplierPixKey | null
  // Avaliação de serviço (§1.6) — null = sem avaliação (D2).
  serviceRating: ServiceRating | null
  ratingComment: string | null
}>

// ── Schema do formulário (validação na borda do cliente) ──
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CNPJ: aceita com/sem máscara; normaliza para 14 dígitos (o server fn aceita 14–18). */
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
  keyType: z.enum(PIX_KEY_TYPES),
  key: z.string().trim().min(1).max(140),
})

export const SupplierFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  corporateName: z.string().trim().min(1).max(200),
  fantasyName: z.string().trim().min(1).max(200),
  email: z.email(),
  cnpj: CnpjFieldSchema,
  serviceCategory: z.string().trim().min(1).max(80),
  bankAccount: BankAccountFormSchema.nullable().default(null),
  pixKey: PixKeyFormSchema.nullable().default(null),
  // Avaliação de serviço (§1.6) — opcionais; null = sem avaliação (D2). Comentário só faz sentido com
  // nível, mas não obrigamos (defesa no backend); o textarea vira null quando vazio.
  serviceRating: z.enum(SERVICE_RATINGS).nullable().default(null),
  ratingComment: z.string().trim().max(500).nullable().default(null),
})
export type SupplierFormValues = z.infer<typeof SupplierFormSchema>
