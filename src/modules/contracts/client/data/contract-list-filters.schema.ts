/**
 * Schema dos filtros da listagem de contratos (search params da rota). Vive na camada `data` do
 * client (a borda de validação), NÃO no domínio — domínio é puro, sem Zod (C2 do review). Consumido
 * pela rota (`validateSearch`) e reexportado o tipo pela view-model.
 */
import * as z from 'zod'

import { ContractStatus, ContractType } from '#modules/contracts/client/domain/types.ts'

export const ContractListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().optional(),
  budgetPlanId: z.string().trim().nullish(),
  contractPeriodStart: z.iso.date().optional(),
  contractPeriodEnd: z.iso.date().optional(),
  contractType: z.enum(Object.values(ContractType) as [string, ...string[]]).optional(),
  contractStatus: z.enum(Object.values(ContractStatus) as [string, ...string[]]).optional(),
  vencendo: z.coerce.boolean().optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type ContractListFilters = z.infer<typeof ContractListFiltersSchema>
