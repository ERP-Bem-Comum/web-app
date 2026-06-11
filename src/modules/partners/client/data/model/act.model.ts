/**
 * Model do client (client-data) — tipos de I/O do repository de ACTs, espelhando `act.io.ts`. Tipos
 * locais (não importa server/domain nem public-api — boundary §I). ACT = Acordo de Cooperação Técnica
 * (instituição/CNPJ): vigência, repasse financeiro (conta bancária + PIX), área de atuação.
 * Aqui também vive o schema Zod do FORMULÁRIO (validação na borda do cliente).
 */
import * as z from 'zod'

export const OCCUPATION_AREAS = ['PARC', 'DDI', 'DCE', 'EPV'] as const
export type OccupationArea = (typeof OCCUPATION_AREAS)[number]

/** Tipos de chave PIX aceitos pelo contrato do core-api (client). FONTE ÚNICA: `type`, `z.enum` e a
 * lista de `<option>` derivam daqui — `as const` evita drift. */
export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export const isPixKeyType = (v: string): v is PixKeyType =>
  (PIX_KEY_TYPES as readonly string[]).includes(v)

export type BankAccount = Readonly<{
  bank: string
  agency: string
  accountNumber: string
  checkDigit: string
}>

export type PixKey = Readonly<{ keyType: PixKeyType; key: string }>

export type ActListItem = Readonly<{
  id: string
  actNumber: string
  name: string
  email: string
  corporateName: string
  fantasyName: string
  occupationArea: string // tolerante a valores legados fora do enum (a UI mapeia p/ label quando casa)
  hasFinancialTransfer: boolean
  active: boolean
}>

export type ActDetail = ActListItem &
  Readonly<{
    legacyId: number | null
    cnpj: string
    legalRepresentative: string
    startDate: string
    endDate: string
    bankAccount: BankAccount | null
    pixKey: PixKey | null
    createdAt: string
    updatedAt: string
  }>

export type ActListResponse = Readonly<{
  items: readonly ActListItem[]
  meta: Readonly<{ page: number; limit: number; total: number }>
}>

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type ActListInput = Readonly<{
  search?: string
  active?: boolean
  hasFinancialTransfer?: boolean
  occupationArea?: OccupationArea
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}>

export type ActWriteInput = Readonly<{
  actNumber: string
  name: string
  email: string
  cnpj: string
  corporateName: string
  fantasyName: string
  occupationArea: OccupationArea
  legalRepresentative: string
  startDate: string
  endDate: string
  hasFinancialTransfer: boolean
  bankAccount: BankAccount | null
  pixKey: PixKey | null
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

/** Formulário do Acordo. Regra de repasse/vigência é validada no controller (UI) + borda Zod (server). */
export const ActFormSchema = z.object({
  actNumber: z.string().trim().min(1).max(120),
  name: z.string().trim().min(1).max(200),
  email: z.email(),
  cnpj: CnpjFieldSchema,
  corporateName: z.string().trim().min(1).max(200),
  fantasyName: z.string().trim().min(1).max(200),
  occupationArea: z.enum(OCCUPATION_AREAS),
  legalRepresentative: z.string().trim().min(1).max(200),
  startDate: z.iso.date(), // YYYY-MM-DD
  endDate: z.iso.date(), // YYYY-MM-DD
  hasFinancialTransfer: z.boolean(),
  bankAccount: BankAccountFormSchema.nullable().default(null),
  pixKey: PixKeyFormSchema.nullable().default(null),
})
export type ActFormValues = z.infer<typeof ActFormSchema>
