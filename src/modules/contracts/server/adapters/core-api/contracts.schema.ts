/**
 * Zod schemas para validação dos responses do core-api contracts.
 * Server-only (adapters/core-api). Converte o formato cru da API para o nosso domínio.
 *
 * Alinhado com a API real do backend (branch dev, commit 9ffd07d):
 *  - Status em inglês: Pending | Active | Expired | Terminated
 *  - Period discriminated: { kind: 'Fixed', start: string, end: string } | { kind: 'Indefinite', start: string }
 *  - Money: { cents: number }
 *  - Amendments discriminados por kind: Addition | Suppression | TermChange | Misc
 *  - Documents com metadados de storage (sem URL direta)
 */
import * as z from 'zod'

// ─── Contrato (item de lista / detalhe base) ────────────────────────────────

const MoneyDtoSchema = z.object({ cents: z.int() })

const PeriodDtoSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('Fixed'), start: z.string().trim(), end: z.string().trim() }),
  z.object({ kind: z.literal('Indefinite'), start: z.string().trim() }),
])

const ContractListItemBaseSchema = z.object({
  id: z.uuid(),
  sequentialNumber: z.string().trim(),
  title: z.string().trim(),
  objective: z.string().trim(),
  originalValue: MoneyDtoSchema,
  originalPeriod: PeriodDtoSchema,
})

export const CoreApiContractListItemSchema = z.discriminatedUnion('status', [
  z.object({ ...ContractListItemBaseSchema.shape, status: z.literal('Pending') }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    status: z.literal('Active'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
  }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    status: z.literal('Expired'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
    endedAt: z.string().trim(),
  }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    status: z.literal('Terminated'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
    endedAt: z.string().trim(),
  }),
])

export type CoreApiContractListItem = z.infer<typeof CoreApiContractListItemSchema>

// ─── Detalhe enriquecido (GET /contracts/:id) ───────────────────────────────

const AmendmentDtoSchema = z.discriminatedUnion('kind', [
  z.object({
    id: z.uuid(),
    contractId: z.uuid(),
    amendmentNumber: z.string().trim(),
    description: z.string().trim(),
    status: z.string().trim(),
    createdAt: z.string().trim(),
    kind: z.literal('Addition'),
    impactValueCents: z.int(),
  }),
  z.object({
    id: z.uuid(),
    contractId: z.uuid(),
    amendmentNumber: z.string().trim(),
    description: z.string().trim(),
    status: z.string().trim(),
    createdAt: z.string().trim(),
    kind: z.literal('Suppression'),
    impactValueCents: z.int(),
  }),
  z.object({
    id: z.uuid(),
    contractId: z.uuid(),
    amendmentNumber: z.string().trim(),
    description: z.string().trim(),
    status: z.string().trim(),
    createdAt: z.string().trim(),
    kind: z.literal('TermChange'),
    newEndDate: z.string().trim(),
  }),
  z.object({
    id: z.uuid(),
    contractId: z.uuid(),
    amendmentNumber: z.string().trim(),
    description: z.string().trim(),
    status: z.string().trim(),
    createdAt: z.string().trim(),
    kind: z.literal('Misc'),
  }),
])

export const CoreApiDocumentSchema = z.object({
  id: z.uuid(),
  parentType: z.enum(['Contract', 'Amendment']),
  parentId: z.string().trim(),
  categoria: z.string().trim(),
  fileName: z.string().trim(),
  mimeType: z.string().trim(),
  sizeBytes: z.int().nonnegative(),
  hashSha256: z.string().trim(),
  bucket: z.string().trim(),
  storageKey: z.string().trim(),
  version: z.int(),
  status: z.string().trim(),
  uploadedAt: z.string().trim(),
})

// Contratado — o detalhe (GET /:id) devolve `contractor` com o snapshot (nome/documento/banco/PIX).
const CoreApiContractorBankSchema = z.object({
  bank: z.string().trim(),
  agency: z.string().trim(),
  accountNumber: z.string().trim(),
  checkDigit: z.string().trim(),
})
const CoreApiContractorPixSchema = z.object({
  keyType: z.string().trim(),
  key: z.string().trim(),
})
export const CoreApiContractorSchema = z.object({
  type: z.enum(['supplier', 'financier', 'collaborator', 'act']),
  id: z.string().trim(),
  snapshot: z.object({
    name: z.string().trim(),
    document: z.string().trim(),
    updatedAt: z.string().trim().optional(),
    bankAccount: CoreApiContractorBankSchema.nullable().optional(),
    pixKey: CoreApiContractorPixSchema.nullable().optional(),
  }),
})

// Metadados editáveis via PATCH /api/v2/contracts/:id — a rota gorda GET /:id os
// devolve no detalhe (opcionais/ausentes quando nunca preenchidos).
const detailMetaShape = {
  // O backend devolve null (não ausente) quando vazios — precisa aceitar null, senão o parse do
  // detalhe inteiro falha e cai no fallback de list-item (perdendo contractor/documents/etc.).
  observations: z.string().trim().nullable().optional(),
  email: z.string().trim().nullable().optional(),
  telephone: z.string().trim().nullable().optional(),
  contractor: CoreApiContractorSchema.nullable().optional(),
}

export const CoreApiContractDetailSchema = z.discriminatedUnion('status', [
  z.object({
    ...ContractListItemBaseSchema.shape,
    ...detailMetaShape,
    status: z.literal('Pending'),
    amendments: z.array(AmendmentDtoSchema),
    documents: z.array(CoreApiDocumentSchema),
  }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    ...detailMetaShape,
    status: z.literal('Active'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
    amendments: z.array(AmendmentDtoSchema),
    documents: z.array(CoreApiDocumentSchema),
  }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    ...detailMetaShape,
    status: z.literal('Expired'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
    endedAt: z.string().trim(),
    amendments: z.array(AmendmentDtoSchema),
    documents: z.array(CoreApiDocumentSchema),
  }),
  z.object({
    ...ContractListItemBaseSchema.shape,
    ...detailMetaShape,
    status: z.literal('Terminated'),
    signedAt: z.string().trim(),
    currentValue: MoneyDtoSchema,
    currentPeriod: PeriodDtoSchema,
    endedAt: z.string().trim(),
    amendments: z.array(AmendmentDtoSchema),
    documents: z.array(CoreApiDocumentSchema),
  }),
])

export type CoreApiContractDetail = z.infer<typeof CoreApiContractDetailSchema>

// ─── Listagem paginada ──────────────────────────────────────────────────────

export const CoreApiListResponseSchema = z.object({
  items: z.array(CoreApiContractListItemSchema),
  meta: z.object({
    page: z.int(),
    totalPages: z.int(),
    total: z.int(),
    limit: z.int(),
  }),
})

// ─── Timeline / History ─────────────────────────────────────────────────────

export const CoreApiTimelineEntrySchema = z.object({
  eventId: z.string().trim(),
  contractId: z.string().trim(),
  kind: z.string().trim(),
  occurredAt: z.string().trim(),
  actor: z.string().trim().nullable(),
  subjectAmendmentId: z.string().trim().nullable(),
})

export const CoreApiTimelineSchema = z.array(CoreApiTimelineEntrySchema)

// ─── Amendment (resposta de criação) ────────────────────────────────────────

export const CoreApiAmendmentSchema = AmendmentDtoSchema
