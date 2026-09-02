/**
 * Model do client (client-data) — tipos de I/O do repository, espelhando o contrato do BFF.
 * Definidos localmente (não importa server/domain nem public-api — boundary §I); a validação do
 * response contra o core-api já acontece na server fn (§IX). Camada `data`.
 * Aqui também vive o schema Zod do FORMULÁRIO (validação na borda do cliente) — fica em `data` para
 * o controller poder consumi-lo sem furar a fronteira client-controller↛client-domain.
 */
import * as z from 'zod'

import { normalizeCnpj, isValidCnpjFormat } from '#shared/document/cnpj.ts'

export type ActivationStatus = 'active' | 'inactive'

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
  cnpj: string
  corporateName: string
  fantasyName: string
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
/** CNPJ (Serpro/2026): aceita com/sem máscara; normaliza p/ 14 alfanuméricos maiúsculos e valida formato. */
export const CnpjFieldSchema = z
  .string()
  .trim()
  .transform(normalizeCnpj)
  .refine(isValidCnpjFormat, { error: 'cnpj-invalid' })

// ⚠️ Cada regra carrega um erro NOMEADO (specs/114, #359), e o valor é um slug `kebab-case` EN — a
// tradução mora no catálogo, nunca aqui: o model é consumido pelo client e pelo server, e um texto
// PT gravado no schema seria string de UI fora do i18n (§XI).
//
// O slug sozinho não bastava: o controller descartava o motivo (`Record<string, boolean>`) e a view
// exibia uma constante. A prova é o `cnpj-invalid` acima — nomeado desde sempre, e que nunca chegou
// a uma tela. Nomear e transportar andam juntos; quem mexer numa metade sem a outra reconstrói o
// código morto que a specs/114 removeu.
//
// Regra ainda SEM nome cai na frase genérica de hoje, por desenho — ver `form-error-labels.ts`.
export const BankAccountFormSchema = z.object({
  bank: z.string().trim().min(1, { error: 'bank-required' }).max(20, { error: 'bank-too-long' }),
  agency: z.string().trim().min(1, { error: 'agency-required' }).max(20, { error: 'agency-too-long' }),
  accountNumber: z
    .string()
    .trim()
    .min(1, { error: 'account-number-required' })
    .max(30, { error: 'account-number-too-long' }),
  checkDigit: z.string().trim().max(5, { error: 'check-digit-too-long' }),
})

export const PixKeyFormSchema = z.object({
  keyType: z.enum(PIX_KEY_TYPES, { error: 'pix-key-type-invalid' }),
  // ⚠️ O teto de 140 NÃO é o do arquivo: o CNAB reserva 99 posições para a chave (G101, 128-226), e
  // uma chave entre 100 e 140 é aceita aqui e recusada na geração da remessa. É defeito real e é da
  // #360 — apertar o limite dentro desta fatia mudaria comportamento de cadastro sob o disfarce de
  // mensagem de erro. A frase abaixo diz o limite QUE EXISTE, não o que deveria existir.
  key: z.string().trim().min(1, { error: 'pix-key-required' }).max(140, { error: 'pix-key-too-long' }),
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
