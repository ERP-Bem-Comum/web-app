/**
 * Schemas Zod do domínio de contratos — vivem na BORDA (adapters), não no domínio (C2 do review:
 * domínio é puro, sem Zod — DDD/Evans). Os TIPOS correspondentes são escritos à mão em
 * `../domain/contracts.types.ts`; os guards no fim deste arquivo travam o drift entre schema e tipo.
 */
import * as z from 'zod'

import type * as D from '../domain/contracts.types.ts'

export const ContractClassificationSchema = z.enum(['Contract', 'ServiceOrder'])
export const ContractModelSchema = z.enum(['Service', 'Donation'])
export const ContractTypeSchema = z.enum(['Supplier', 'Financier', 'Collaborator', 'ACT'])
export const ContractStatusSchema = z.enum([
  'Pendente',
  'Em Andamento',
  'Finalizado',
  'Distrato',
  'Cancelado',
])
export const AmendmentTypeSchema = z.enum(['prazo', 'valor', 'escopo', 'outro', 'distrato'])
export const AmendmentStatusSchema = z.enum(['Pendente', 'Homologado'])

export const MoneySchema = z.object({ cents: z.int().nonnegative() }) // ≥ 0 (M7)

export const PeriodSchema = z.object({
  start: z.coerce.date(),
  end: z.coerce.date(),
})

export const PartnerSnapshotSchema = z.object({
  id: z.string().trim(),
  name: z.string().trim(),
  document: z.string().trim(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
})

export const BankInfoSchema = z.object({
  bank: z.string().trim(),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  dv: z.string().trim(),
  updatedAt: z.date(),
})

export const PixInfoSchema = z.object({
  keyType: z.string().trim(),
  key: z.string().trim(),
  updatedAt: z.date(),
})

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

export const ContractFileSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  url: z.string().trim(),
  size: z.number().optional(),
  uploadedAt: z.date(),
  uploadedBy: z.string().trim().optional(),
  parentType: z.enum(['Contract', 'Amendment']).optional(),
  parentId: z.string().trim().optional(),
  categoria: z.string().trim().optional(),
})

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
  // IDs técnicos = UUID string (ADR-0013). `program` é o bloco composto pelo backend (id+nome+sigla).
  programId: z.uuid().optional(),
  program: z.object({ id: z.uuid(), name: z.string().trim(), sigla: z.string().trim() }).optional(),
  budgetPlanId: z.uuid().optional(),
  // budgetPlan (bloco) ainda não retornado pelo #32 (só budgetPlanId) → opcional/undefined (follow-up).
  budgetPlan: z
    .object({ id: z.uuid(), scenarioName: z.string().trim(), year: z.number(), version: z.number() })
    .optional(),
  categorizacao: z.string().trim().optional(),
  centroDeCusto: z.string().trim().optional(),
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
  budgetPlanId: z.uuid().optional(),
  // #116: filtro por contraparte (server-side). contractorType minúsculo = enum do core-api (= PartnerKind).
  contractorId: z.string().trim().optional(),
  contractorType: z.enum(['supplier', 'financier', 'collaborator', 'act']).optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

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
  actId: z.string().trim().optional(),
  programId: z.uuid().optional(),
  budgetPlanId: z.uuid().optional(),
  categorizacao: z.string().trim().optional(),
  centroDeCusto: z.string().trim().optional(),
  observations: z.string().trim().optional(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  bancaryInfo: BankInfoSchema.omit({ updatedAt: true }).optional(),
  pixInfo: PixInfoSchema.omit({ updatedAt: true }).optional(),
})

export const AttachSignedDocumentInputSchema = z.object({
  contractId: z.uuid(),
  fileBase64: z.string().trim().min(1),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\:*?"<>|]+$/, 'invalid-file-name'),
  // String ISO (ex.: "2026-06-01") vinda do <input type="date">. Validação de data válida/não-futura
  // acontece na borda da server fn (decodificação + checagem), não aqui.
  signedAt: z.string().trim().min(1),
})

export const AttachAmendmentDocumentInputSchema = z.object({
  contractId: z.uuid(),
  amendmentId: z.uuid(),
  fileBase64: z.string().trim().min(1),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\:*?"<>|]+$/, 'invalid-file-name'),
  signedAt: z.string().trim().min(1),
})

// Distrato (#32): input da server fn `end-contract`. `terminatedAt` (data efetiva, YYYY-MM-DD) e
// `reason` (motivo) obrigatórios; a checagem de data válida/não-futura acontece na borda da fn
// (via validateSignedDocument), não aqui — aqui só garantimos presença/forma.
export const EndContractInputSchema = z.object({
  contractId: z.uuid(),
  fileBase64: z.string().trim().min(1),
  fileName: z
    .string()
    .trim()
    .min(1)
    .max(255)
    .regex(/^[^/\\:*?"<>|]+$/, 'invalid-file-name'),
  terminatedAt: z.string().trim().min(1),
  reason: z.string().trim().min(1),
})

export const UpdateContractInputSchema = z.object({
  id: z.uuid(),
  email: z.email().optional(),
  telephone: z.string().trim().optional(),
  observations: z.string().trim().optional(),
})

// Cancelamento (§1.7): input da server fn `cancel-contract`. Só o id do contrato (uuid).
export const CancelContractInputSchema = z.object({
  contractId: z.uuid(),
})

export const CreateAmendmentInputSchema = z.object({
  type: AmendmentTypeSchema,
  description: z.string().trim().optional(),
  impactValueCents: z.int().optional(),
  newEndDate: z.date().optional(),
  startDate: z.date().optional(),
  signedAt: z.date().optional(),
})

export const ListContractsResponseSchema = z.object({
  items: z.array(ContractSchema),
  meta: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})

// ── Drift guards: a SAÍDA do schema deve ser atribuível ao tipo (readonly) do domínio ───────────
// Direção que importa: dado validado precisa caber no tipo do domínio. Se divergir, o `true` deixa
// de ser atribuível e o typecheck falha AQUI (não nos consumidores). Unidirecional por causa do
// readonly do domínio vs. arrays mutáveis do z.infer.
type AssertEqual<A, B> = [A] extends [B] ? true : never

const _g_money: AssertEqual<z.infer<typeof MoneySchema>, D.Money> = true
const _g_period: AssertEqual<z.infer<typeof PeriodSchema>, D.Period> = true
const _g_partner: AssertEqual<z.infer<typeof PartnerSnapshotSchema>, D.PartnerSnapshot> = true
const _g_bank: AssertEqual<z.infer<typeof BankInfoSchema>, D.BankInfo> = true
const _g_pix: AssertEqual<z.infer<typeof PixInfoSchema>, D.PixInfo> = true
const _g_amendment: AssertEqual<z.infer<typeof AmendmentSchema>, D.Amendment> = true
const _g_file: AssertEqual<z.infer<typeof ContractFileSchema>, D.ContractFile> = true
const _g_contract: AssertEqual<z.infer<typeof ContractSchema>, D.Contract> = true
const _g_listInput: AssertEqual<z.infer<typeof ListContractsInputSchema>, D.ListContractsInput> = true
const _g_createInput: AssertEqual<z.infer<typeof CreateContractInputSchema>, D.CreateContractInput> = true
const _g_attachSigned: AssertEqual<
  z.infer<typeof AttachSignedDocumentInputSchema>,
  D.AttachSignedDocumentInput
> = true
const _g_attachAmend: AssertEqual<
  z.infer<typeof AttachAmendmentDocumentInputSchema>,
  D.AttachAmendmentDocumentInput
> = true
const _g_endInput: AssertEqual<z.infer<typeof EndContractInputSchema>, D.EndContractInput> = true
const _g_updateInput: AssertEqual<z.infer<typeof UpdateContractInputSchema>, D.UpdateContractInput> = true
const _g_cancelInput: AssertEqual<z.infer<typeof CancelContractInputSchema>, D.CancelContractInput> = true
const _g_createAmend: AssertEqual<z.infer<typeof CreateAmendmentInputSchema>, D.CreateAmendmentInput> = true
const _g_listResp: AssertEqual<z.infer<typeof ListContractsResponseSchema>, D.ListContractsResponse> = true

void [
  _g_money,
  _g_period,
  _g_partner,
  _g_bank,
  _g_pix,
  _g_amendment,
  _g_file,
  _g_contract,
  _g_listInput,
  _g_createInput,
  _g_attachSigned,
  _g_attachAmend,
  _g_endInput,
  _g_updateInput,
  _g_cancelInput,
  _g_createAmend,
  _g_listResp,
]
