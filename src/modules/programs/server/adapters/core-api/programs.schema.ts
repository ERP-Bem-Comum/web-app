/**
 * Zod dos responses do core-api `/api/v1/programs` (boundary §VI). Valida o que entra do backend antes de
 * virar Model. Shape alinhado ao contrato REAL (`schemas.ts` do core-api).
 */
import * as z from 'zod'

export const CoreApiProgramItemSchema = z.object({
  id: z.uuid(),
  programNumber: z.int(),
  name: z.string().trim(),
  sigla: z.string().trim(),
  generalCharacteristics: z.string().trim().nullable(),
  logoKey: z.string().trim().nullable(),
  status: z.enum(['ATIVO', 'INATIVO']),
})
export type CoreApiProgramItem = z.infer<typeof CoreApiProgramItemSchema>

export const CoreApiProgramDetailSchema = z.object({
  id: z.uuid(),
  programNumber: z.int(),
  name: z.string().trim(),
  sigla: z.string().trim(),
  director: z.string().trim().nullable(),
  generalCharacteristics: z.string().trim().nullable(),
  logoKey: z.string().trim().nullable(),
  status: z.enum(['ATIVO', 'INATIVO']),
  version: z.int(),
  createdAt: z.string().trim(),
  updatedAt: z.string().trim(),
})
export type CoreApiProgramDetail = z.infer<typeof CoreApiProgramDetailSchema>

export const CoreApiProgramPaginationMetaSchema = z.object({
  currentPage: z.int(),
  itemsPerPage: z.int(),
  itemCount: z.int(),
  totalItems: z.int(),
  totalPages: z.int(),
})

export const CoreApiProgramListSchema = z.object({
  items: z.array(CoreApiProgramItemSchema),
  meta: CoreApiProgramPaginationMetaSchema,
})
