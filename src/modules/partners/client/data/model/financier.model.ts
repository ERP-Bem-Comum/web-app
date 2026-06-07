/**
 * Model do client (client-data) — tipos de I/O do repository de Financiadores, espelhando o contrato
 * do BFF (`financier.io.ts`). Definidos localmente (não importa server/domain nem public-api — boundary
 * §I); a validação do response contra o core-api já acontece na server fn (§IX). Camada `data`.
 * Aqui também vive o schema Zod do FORMULÁRIO (validação na borda do cliente), para o controller poder
 * consumi-lo sem furar a fronteira client-controller↛client-domain.
 *
 * Financiador é PJ-only: 6 campos. Diferente do fornecedor: SEM categorias, SEM dados bancários/PIX,
 * SEM e-mail/nome-fantasia.
 */
import * as z from 'zod'

export type ActivationStatus = 'active' | 'inactive'

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

// ── Inputs enviados pelo repository (a server fn valida no server) ──
export type FinancierListInput = Readonly<{
  search?: string
  active?: boolean
  order: 'ASC' | 'DESC'
  page: number
  limit: number
}>

export type FinancierWriteInput = Readonly<{
  name: string
  corporateName: string
  legalRepresentative: string
  cnpj: string
  telephone: string
  address: string
}>

// ── Schema do formulário (validação na borda do cliente) ──
const onlyDigits = (raw: string): string => raw.replace(/\D/g, '')

/** CNPJ: aceita com/sem máscara; normaliza para 14 dígitos (o server fn aceita 14–18). */
export const CnpjFieldSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((d) => d.length === 14, { error: 'cnpj-invalid' })

/** Formulário PJ-only — os 6 campos obrigatórios do contrato. */
export const FinancierFormSchema = z.object({
  name: z.string().trim().min(1).max(200),
  corporateName: z.string().trim().min(1).max(200),
  legalRepresentative: z.string().trim().min(1).max(200),
  cnpj: CnpjFieldSchema,
  telephone: z.string().trim().min(1).max(20),
  address: z.string().trim().min(1).max(300),
})
export type FinancierFormValues = z.infer<typeof FinancierFormSchema>
