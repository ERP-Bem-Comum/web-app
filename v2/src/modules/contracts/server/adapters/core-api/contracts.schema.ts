/**
 * Zod schemas para validação dos responses do core-api contracts.
 * Server-only (adapters/core-api). Converte o formato cru da API para o nosso domínio.
 */
import * as z from 'zod'

export const CoreApiContractSchema = z.object({
  id: z.string().uuid(),
  sequentialNumber: z.string(),
  title: z.string(),
  objective: z.string(),
  originalValue: z.object({ cents: z.number() }),
  originalPeriod: z.object({ start: z.string().datetime(), end: z.string().datetime() }),
  status: z.string(),
  signedAt: z.string().datetime().nullable(),
  currentValue: z.object({ cents: z.number() }),
  currentPeriod: z.object({ start: z.string().datetime(), end: z.string().datetime() }).nullable(),
  endedAt: z.string().datetime().nullable(),
})

export const CoreApiAmendmentSchema = z.object({
  id: z.string().uuid(),
  amendmentNumber: z.string(),
  type: z.string(),
  description: z.string().optional(),
  impactValueCents: z.number().optional(),
  newEndDate: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  status: z.string(),
  signedAt: z.string().datetime().optional(),
  signedContractUrl: z.string().optional(),
  createdAt: z.string().datetime(),
})

export const CoreApiContractFileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  url: z.string(),
  size: z.number().optional(),
  uploadedAt: z.string().datetime(),
  uploadedBy: z.string().optional(),
})

export const CoreApiListResponseSchema = z.object({
  items: z.array(CoreApiContractSchema),
  meta: z.object({
    page: z.number(),
    totalPages: z.number(),
    total: z.number(),
    limit: z.number(),
  }),
})
