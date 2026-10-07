/**
 * Model do client (client-data) — tipos de I/O do repository, espelhando o contrato do BFF.
 * Definidos localmente (não importa server/domain nem public-api — boundary §I); a validação do
 * response contra o core-api já acontece na server fn (§IX). Camada `data`.
 * Aqui também vive o schema Zod do FORMULÁRIO (validação na borda do cliente) — fica em `data` para
 * o controller poder consumi-lo sem furar a fronteira client-controller↛client-domain.
 */
import * as z from 'zod'

import { normalizeCnpj, isValidCnpjFormat } from '#shared/document/cnpj.ts'
import { normalizeCpf, isValidCpf } from '#shared/document/cpf.ts'

export type ActivationStatus = 'active' | 'inactive'

/** Tipo de pessoa do fornecedor (#1022). LEITURA do documento (CPF → PF, CNPJ → PJ) devolvida pelo BFF —
 *  o front nunca o deduz do tipo de parceiro. Na tela, PJ vem primeiro (é a maioria dos fornecedores). */
export const PERSON_TYPES = ['PJ', 'PF'] as const
export type PersonType = (typeof PERSON_TYPES)[number]

export const isPersonType = (v: string): v is PersonType => (PERSON_TYPES as readonly string[]).includes(v)

/** Tipos de chave PIX aceitos pelo contrato do core-api (client). FONTE ÚNICA: `type`, `z.enum` e a
 * lista de `<option>` derivam daqui — `as const` evita drift entre as 4 materializações anteriores. */
export const PIX_KEY_TYPES = ['cpf', 'cnpj', 'email', 'phone', 'random-key'] as const
export type PixKeyType = (typeof PIX_KEY_TYPES)[number]

export const isPixKeyType = (v: string): v is PixKeyType => (PIX_KEY_TYPES as readonly string[]).includes(v)

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
  // CPF (11) ou CNPJ (14), sem máscara.
  document: string
  personType: PersonType
  // `null` na pessoa física.
  corporateName: string | null
  fantasyName: string | null
  serviceCategory: string
  activation: ActivationStatus
  contractCount: number
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
  // `null` na pessoa física (o core-api recusa PF com esses campos preenchidos).
  corporateName: string | null
  fantasyName: string | null
  email: string
  // CPF ou CNPJ, sem máscara.
  document: string
  serviceCategory: string
  bankAccount: BankAccount | null
  pixKey: SupplierPixKey | null
  // Avaliação de serviço (§1.6) — null = sem avaliação (D2).
  serviceRating: ServiceRating | null
  ratingComment: string | null
}>

// ── Schema do formulário (validação na borda do cliente) ──
/** CNPJ (Serpro/2026): aceita com/sem máscara; normaliza p/ 14 alfanuméricos maiúsculos e valida formato. */
export const CnpjFieldSchema = z
  .string()
  .trim()
  .transform(normalizeCnpj)
  .refine(isValidCnpjFormat, { error: 'cnpj-invalid' })

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

const NAME_MAX = 200
const companyNameOk = (v: string): boolean => v.length >= 1 && v.length <= NAME_MAX

/**
 * Formulário do fornecedor. O `personType` (chave da tela) decide a identidade (#1022):
 *  - PJ: CNPJ (formato Serpro; o DV é do VO do BFF) + Razão Social + Nome Fantasia obrigatórios;
 *  - PF: CPF (formato + DV), sem Razão Social/Nome Fantasia — saem `null` mesmo que a tela os guarde.
 * A saída já vem normalizada (documento sem máscara), pronta para o `SupplierWriteInput`.
 */
export const SupplierFormSchema = z
  .object({
    personType: z.enum(PERSON_TYPES),
    name: z.string().trim().min(1).max(NAME_MAX),
    corporateName: z.string().trim(),
    fantasyName: z.string().trim(),
    email: z.email(),
    document: z.string().trim(),
    serviceCategory: z.string().trim().min(1).max(80),
    bankAccount: BankAccountFormSchema.nullable().default(null),
    pixKey: PixKeyFormSchema.nullable().default(null),
    // Avaliação de serviço (§1.6) — opcionais; null = sem avaliação (D2). Comentário só faz sentido com
    // nível, mas não obrigamos (defesa no backend); o textarea vira null quando vazio.
    serviceRating: z.enum(SERVICE_RATINGS).nullable().default(null),
    ratingComment: z.string().trim().max(500).nullable().default(null),
  })
  .superRefine((v, ctx) => {
    if (v.personType === 'PF') {
      if (!isValidCpf(v.document))
        ctx.addIssue({ code: 'custom', path: ['document'], message: 'cpf-invalid' })
      return
    }
    if (!isValidCnpjFormat(v.document)) {
      ctx.addIssue({ code: 'custom', path: ['document'], message: 'cnpj-invalid' })
    }
    if (!companyNameOk(v.corporateName)) {
      ctx.addIssue({ code: 'custom', path: ['corporateName'], message: 'required' })
    }
    if (!companyNameOk(v.fantasyName)) {
      ctx.addIssue({ code: 'custom', path: ['fantasyName'], message: 'required' })
    }
  })
  .transform((v) => {
    const pf = v.personType === 'PF'
    return {
      ...v,
      document: pf ? normalizeCpf(v.document) : normalizeCnpj(v.document),
      corporateName: pf ? null : v.corporateName,
      fantasyName: pf ? null : v.fantasyName,
    }
  })
export type SupplierFormValues = z.infer<typeof SupplierFormSchema>
