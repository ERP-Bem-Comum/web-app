import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { serverFetch } from '@/server/http/result-fetch'
import { authMiddleware } from '@/server/middleware/auth'
import { GetByIdSchema } from '../domain/schemas'
import { ContractId, mapBackendStatus } from '../domain/types'
import type { Contract, Money } from '../domain/types'

const backendDocumentSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().optional(),
  mimeType: z.string().optional(),
  url: z.string().optional(),
  bucket: z.string().optional(),
  storageKey: z.string().optional(),
})

const backendAmendmentSchema = z.object({
  id: z.string().uuid(),
  contractId: z.string().uuid(),
  amendmentNumber: z.string().optional(),
  description: z.string().optional(),
  createdAt: z.string(),
  status: z.string(),
  kind: z.string().optional(),
  impactValue: z.object({ cents: z.number().int() }).optional(),
  newEndDate: z.string().optional(),
  signedDocumentRef: z.string().nullish(),
  homologatedAt: z.string().nullish(),
})

const backendContractDetailSchema = z.object({
  id: z.string().uuid(),
  sequentialNumber: z.string().optional(),
  title: z.string().optional(),
  objective: z.string().optional(),
  signedAt: z.string().optional(),
  originalValueCents: z.number().int().optional(),
  currentValueCents: z.number().int().optional(),
  originalPeriod: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  currentPeriod: z
    .object({
      start: z.string().optional(),
      end: z.string().optional(),
    })
    .optional(),
  status: z.string(),
  endedAt: z.string().nullish(),
  counterpartyId: z.string().optional(),
  contractType: z.string().optional(),
  contractModel: z.string().optional(),
  cooperativeAgreement: z.boolean().optional(),
  programId: z.string().optional(),
  budgetPlanId: z.string().optional(),
  signedDocumentRef: z.string().optional(),
  amendments: z.array(backendAmendmentSchema).optional(),
  documents: z.array(backendDocumentSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

function mapAmendmentToChild(amendment: z.infer<typeof backendAmendmentSchema>): any {
  const kindMap: Record<string, string> = {
    Addition: 'valor',
    TermChange: 'prazo',
    Misc: 'outro',
    Suppression: 'valor',
  }

  const statusMap: Record<string, string> = {
    Pending: 'Pendente',
    Homologated: 'Homologado',
  }

  const impactValueCents = amendment.impactValue?.cents ?? 0
  const isSuppression = amendment.kind === 'Suppression'

  return {
    id: amendment.id,
    contractCode: amendment.amendmentNumber || 'AD-0000',
    object: amendment.description || '—',
    totalValue: isSuppression ? -(impactValueCents / 100) : impactValueCents / 100,
    aditivoType: kindMap[amendment.kind || ''] || 'outro',
    aditivoStatus: statusMap[amendment.status] || amendment.status,
    createdAt: new Date(amendment.createdAt),
    updatedAt: new Date(amendment.createdAt),
    signedContractUrl: amendment.signedDocumentRef || null,
    parentId: amendment.contractId,
    contractPeriod: amendment.newEndDate
      ? { start: new Date(amendment.createdAt), end: new Date(amendment.newEndDate) }
      : undefined,
  }
}

function mapDocumentToFile(doc: z.infer<typeof backendDocumentSchema>): any {
  return {
    id: doc.id,
    fileUrl: doc.url || `/api/v2/documents/${doc.id}/download`,
  }
}

export const getContract = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator(GetByIdSchema)
  .handler(async ({ data, context }) => {
    const result = await serverFetch<unknown>(`/contracts/${data.id}`, {
      headers: {
        authorization: `Bearer ${context.accessToken}`,
      },
    })

    if (result.isErr()) {
      if (result.error.kind === 'http' && result.error.status === 404) {
        throw new Response('Contrato não encontrado', { status: 404 })
      }
      if (result.error.kind === 'http' && result.error.status === 403) {
        throw new Response('Sem permissão', { status: 403 })
      }
      if (result.error.kind === 'http') {
        throw new Response(JSON.stringify(result.error.body), { status: result.error.status })
      }
      throw new Response('Failed to fetch contract', { status: 500 })
    }

    const parsed = backendContractDetailSchema.safeParse(result.value)
    if (!parsed.success) {
      throw new Response('Invalid contract response', { status: 500 })
    }

    const dto = parsed.data

    const originalValueCents = dto.originalValueCents ?? 0
    const currentValueCents = dto.currentValueCents ?? originalValueCents

    const periodStart = dto.currentPeriod?.start
      ? new Date(dto.currentPeriod.start)
      : new Date()
    const periodEnd = dto.currentPeriod?.end ? new Date(dto.currentPeriod.end) : new Date()

    const originalPeriodStart = dto.originalPeriod?.start
      ? new Date(dto.originalPeriod.start)
      : periodStart
    const originalPeriodEnd = dto.originalPeriod?.end
      ? new Date(dto.originalPeriod.end)
      : periodEnd

    const children = (dto.amendments || []).map(mapAmendmentToChild)
    const files = (dto.documents || []).map(mapDocumentToFile)

    const contract: Contract = {
      id: ContractId(dto.id),
      contractCode: (dto.sequentialNumber || dto.title || '—') as any,
      classification: 'Contrato' as any,
      contractModel: (dto.contractModel || 'Serviço') as any,
      object: dto.objective || dto.title || '—',
      totalValue: (currentValueCents / 100) as Money,
      contractPeriod: { start: periodStart, end: periodEnd },
      contractType: (dto.contractType || 'Fornecedor') as any,
      supplierId: null,
      financierId: null,
      collaboratorId: null,
      budgetPlanId: dto.budgetPlanId || null,
      programId: dto.programId || null,
      supplier: null,
      financier: null,
      collaborator: null,
      program: dto.programId ? { id: dto.programId, name: '—' } : null,
      budgetPlan: dto.budgetPlanId ? { id: dto.budgetPlanId, scenarioName: '—', year: 0, version: 0 } : null,
      contractStatus: mapBackendStatus(dto.status),
      backendStatus: dto.status,
      files,
      children,
      createdAt: new Date(dto.createdAt),
      updatedAt: new Date(dto.updatedAt),
      originalContractPeriod: { start: originalPeriodStart, end: originalPeriodEnd },
      dataAssinatura: dto.signedAt || null,
      signedContractUrl: dto.signedDocumentRef || null,
      observations: null,
    }

    return contract
  })
