/**
 * Zod schemas para validação dos responses do core-api contracts.
 * Server-only (adapters/core-api). Converte o formato cru da API para o nosso domínio.
 */
import * as z from 'zod'

export const CoreApiContractSchema = z.object({
  id: z.uuid(),
  sequentialNumber: z.string().trim(),
  title: z.string().trim(),
  objective: z.string().trim(),
  originalValue: z.object({ cents: z.number() }),
  originalPeriod: z.object({ start: z.iso.datetime(), end: z.iso.datetime() }),
  status: z.string().trim(),
  signedAt: z.iso.datetime().nullable(),
  currentValue: z.object({ cents: z.number() }),
  currentPeriod: z.object({ start: z.iso.datetime(), end: z.iso.datetime() }).nullable(),
  endedAt: z.iso.datetime().nullable(),
})

export const CoreApiAmendmentSchema = z.object({
  id: z.uuid(),
  amendmentNumber: z.string().trim(),
  type: z.string().trim(),
  description: z.string().trim().optional(),
  impactValueCents: z.number().optional(),
  newEndDate: z.iso.datetime().optional(),
  startDate: z.iso.datetime().optional(),
  status: z.string().trim(),
  signedAt: z.iso.datetime().optional(),
  signedContractUrl: z.string().trim().optional(),
  createdAt: z.iso.datetime(),
})

export const CoreApiContractFileSchema = z.object({
  id: z.uuid(),
  name: z.string().trim(),
  url: z.string().trim(),
  size: z.number().optional(),
  uploadedAt: z.iso.datetime(),
  uploadedBy: z.string().trim().optional(),
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
