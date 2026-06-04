/**
 * Tipos e schemas compartilhados do domínio de contratos (server-side).
 * Definidos no server para evitar import circular client→server.
 */
import * as z from 'zod'

export const ContractClassificationSchema = z.enum(['Contract', 'ServiceOrder'])
export type ContractClassification = z.infer<typeof ContractClassificationSchema>

export const ContractModelSchema = z.enum(['Service', 'Donation'])
export type ContractModel = z.infer<typeof ContractModelSchema>

export const ContractTypeSchema = z.enum(['Supplier', 'Financier', 'Collaborator', 'ACT'])
export type ContractType = z.infer<typeof ContractTypeSchema>

export const ContractStatusSchema = z.enum(['Pendente', 'Em Andamento', 'Finalizado', 'Distrato'])
export type ContractStatus = z.infer<typeof ContractStatusSchema>

export const AmendmentTypeSchema = z.enum(['prazo', 'valor', 'escopo', 'outro', 'distrato'])
export type AmendmentType = z.infer<typeof AmendmentTypeSchema>

export const AmendmentStatusSchema = z.enum(['Pendente', 'Homologado'])
export type AmendmentStatus = z.infer<typeof AmendmentStatusSchema>

export const MoneySchema = z.object({ cents: z.int() })
export type Money = z.infer<typeof MoneySchema>

export const PeriodSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
})
export type Period = z.infer<typeof PeriodSchema>

export const PartnerSnapshotSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  document: z.string().trim(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
})
export type PartnerSnapshot = z.infer<typeof PartnerSnapshotSchema>

export const BankInfoSchema = z.object({
  bank: z.string().trim(),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  dv: z.string().trim(),
  updatedAt: z.date(),
})
export type BankInfo = z.infer<typeof BankInfoSchema>

export const PixInfoSchema = z.object({
  keyType: z.string().trim(),
  key: z.string().trim(),
  updatedAt: z.date(),
})
export type PixInfo = z.infer<typeof PixInfoSchema>

export const AmendmentSchema = z.object({
  id: z.uuid(),
  amendmentNumber: z.string().trim(),
  type: AmendmentTypeSchema,
  description: z.string().trim().optional(),
  impactValueCents: z.int().optional(),
  newEndDate: z.date().optional(),
  startDate: z.date().optional(),
  status: AmendmentStatusSchema,
  signedAt: z.date().optional(),
  signedContractUrl: z.string().trim().optional(),
  createdAt: z.date(),
})
export type Amendment = z.infer<typeof AmendmentSchema>

export const ContractFileSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  url: z.string().trim(),
  size: z.number().optional(),
  uploadedAt: z.date(),
  uploadedBy: z.string().trim().optional(),
})
export type ContractFile = z.infer<typeof ContractFileSchema>

export const ContractSchema = z.object({
  id: z.uuid(),
  sequentialNumber: z.string().trim(),
  title: z.string().trim(),
  objective: z.string().trim(),
  originalValue: MoneySchema,
  originalPeriod: PeriodSchema,
  status: ContractStatusSchema,
  signedAt: z.date().nullable(),
  currentValue: MoneySchema,
  currentPeriod: PeriodSchema.nullable(),
  endedAt: z.date().nullable(),
  classification: ContractClassificationSchema,
  contractModel: ContractModelSchema,
  contractType: ContractTypeSchema,
  supplierId: z.string().trim().optional(),
  financierId: z.string().trim().optional(),
  collaboratorId: z.string().trim().optional(),
  supplier: PartnerSnapshotSchema.optional(),
  financier: PartnerSnapshotSchema.optional(),
  collaborator: PartnerSnapshotSchema.optional(),
  programId: z.number().optional(),
  program: z.object({ id: z.number(), name: z.string().trim() }).optional(),
  budgetPlanId: z.number().optional(),
  budgetPlan: z.object({ id: z.number(), scenarioName: z.string().trim(), year: z.number(), version: z.number() }).optional(),
  categorizacao: z.enum(['Avaliação', 'Operacional', 'Processo']).optional(),
  centroDeCusto: z.enum(['RH', 'Serviços Gerais', 'Eventos']).optional(),
  observations: z.string().trim().optional(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  bancaryInfo: BankInfoSchema.optional(),
  pixInfo: PixInfoSchema.optional(),
  origin: z.string().trim().optional(),
  createdAt: z.date(),
  updatedAt: z.date().optional(),
  children: z.array(AmendmentSchema),
  files: z.array(ContractFileSchema),
})
export type Contract = z.infer<typeof ContractSchema>

export const ListContractsInputSchema = z.object({
  page: z.int().min(1).default(1),
  limit: z.int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  contractType: ContractTypeSchema.optional(),
  status: ContractStatusSchema.optional(),
  contractPeriodStart: z.date().optional(),
  contractPeriodEnd: z.date().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional(),
  budgetPlanId: z.number().optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})
export type ListContractsInput = z.infer<typeof ListContractsInputSchema>

export const CreateContractInputSchema = z.object({
  title: z.string().trim().min(1),
  objective: z.string().trim().min(1),
  originalValueCents: z.int().positive(),
  originalPeriod: PeriodSchema,
  classification: ContractClassificationSchema,
  contractModel: ContractModelSchema,
  contractType: ContractTypeSchema,
  supplierId: z.string().trim().optional(),
  financierId: z.string().trim().optional(),
  collaboratorId: z.string().trim().optional(),
  programId: z.number().optional(),
  budgetPlanId: z.number().optional(),
  categorizacao: z.enum(['Avaliação', 'Operacional', 'Processo']).optional(),
  centroDeCusto: z.enum(['RH', 'Serviços Gerais', 'Eventos']).optional(),
  observations: z.string().trim().optional(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  bancaryInfo: BankInfoSchema.omit({ updatedAt: true }).optional(),
  pixInfo: PixInfoSchema.omit({ updatedAt: true }).optional(),
})
export type CreateContractInput = z.infer<typeof CreateContractInputSchema>

export const UpdateContractInputSchema = z.object({
  id: z.uuid(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  observations: z.string().trim().optional(),
})
export type UpdateContractInput = z.infer<typeof UpdateContractInputSchema>

export const CreateAmendmentInputSchema = z.object({
  type: AmendmentTypeSchema,
  description: z.string().trim().optional(),
  impactValueCents: z.int().optional(),
  newEndDate: z.date().optional(),
  startDate: z.date().optional(),
  signedAt: z.date().optional(),
})
export type CreateAmendmentInput = z.infer<typeof CreateAmendmentInputSchema>

// ContractHistoryEvent — evento de auditoria do contrato (server-domain para evitar cross-layer import).
export type ContractHistoryEvent = Readonly<{
  eventId: string
  contractId: string
  kind: string
  description: string
  occurredAt: string
  userName?: string
  metadata?: Record<string, string | number | boolean | null>
}>

export const ListContractsResponseSchema = z.object({
  items: z.array(ContractSchema),
  meta: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})
export type ListContractsResponse = z.infer<typeof ListContractsResponseSchema>
