/**
 * Schemas Zod da BORDA (§IX) — espelham os DTOs REAIS do core-api novo (`/api/v2/budget-plans`, Fatia 1 #315
 * + detalhe #316). Fonte: `core-api origin/go-live` (os endpoints ainda não estão em `dev`; sobem no go-live
 * coordenado). A resposta do core é validada por estes schemas antes de qualquer mapeamento (anti-corrupção).
 */
import * as z from 'zod'

const coreStatusSchema = z.enum(['RASCUNHO', 'EM_CALIBRACAO', 'APROVADO'])

/** Item de `GET /budget-plans` (envelope `{ items, total }`). `id`/`programRef` UUID; `version` string. */
export const coreListItemSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  status: coreStatusSchema,
  version: z.string().trim(),
  programRef: z.uuid(),
  programName: z.string().trim(),
  totalInCents: z.int(),
  updatedAt: z.string().trim(),
})

export const coreListResponseSchema = z.object({
  items: z.array(coreListItemSchema),
  total: z.int().nonnegative(),
})

/** `GET /budget-plans/options` — insumos da criação (programas c/ abreviação, anos, redes). */
export const coreOptionsSchema = z.object({
  programs: z.array(z.object({ ref: z.uuid(), name: z.string().trim(), abbreviation: z.string().trim() })),
  years: z.array(z.int()),
  redes: z.array(
    z.object({
      kind: z.enum(['state', 'municipality']),
      ref: z.uuid(),
      name: z.string().trim(),
      uf: z.string().trim(),
    }),
  ),
})

/** `GET /budget-plans/:id` — detalhe c/ `budgets[]` (fonte INTERINA de partnersCount/networkKind, core-api#372). */
export const coreDetailSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  status: coreStatusSchema,
  version: z.string().trim(),
  programRef: z.uuid(),
  programName: z.string().trim(),
  budgets: z.array(
    z.object({
      id: z.uuid(),
      partner: z.object({ kind: z.enum(['state', 'municipality']), ref: z.uuid() }),
      valueInCents: z.int(),
    }),
  ),
  totalInCents: z.int(),
  createdAt: z.string().trim(),
  updatedAt: z.string().trim(),
})
