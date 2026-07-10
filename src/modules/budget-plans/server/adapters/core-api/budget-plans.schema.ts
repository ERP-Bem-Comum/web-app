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

/** `POST /budget-plans` — 201 do plano recém-criado (feature 058). `version` string; `programRef`/`id` UUID. */
export const coreCreateResponseSchema = z.object({
  id: z.uuid(),
  year: z.int(),
  programRef: z.uuid(),
  status: coreStatusSchema,
  version: z.string().trim(),
  totalInCents: z.int(),
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

/**
 * `GET /budget-plans/:id/cost-structure` (feature 059) — SÓ a árvore Centro → Categoria → Subcategoria
 * (nomes/estrutura, SEM valores). `direction`/`launchType` validados como STRING tolerante (fail-soft: os
 * literais exatos do backend NÃO estão pinados — o MAPPER faz o lookup, com fallback). Anti-corrupção: valida
 * antes de mapear. `budgetPlanId`/`id` UUID.
 */
export const coreCostStructureSchema = z.object({
  budgetPlanId: z.uuid(),
  costCenters: z.array(
    z.object({
      id: z.uuid(),
      name: z.string().trim(),
      direction: z.string().trim(),
      categories: z.array(
        z.object({
          id: z.uuid(),
          name: z.string().trim(),
          subcategories: z.array(
            z.object({
              id: z.uuid(),
              name: z.string().trim(),
              launchType: z.string().trim(),
            }),
          ),
        }),
      ),
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
