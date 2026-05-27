import { z } from 'zod'
import {
  ContractClassification,
  ContractModel,
  ContractStatus,
  ContractType,
} from './types'

export const ContractListFiltersSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  budgetPlanId: z.number().nullish(),
  contractPeriodStart: z.string().date().optional(),
  contractPeriodEnd: z.string().date().optional(),
  contractType: z.nativeEnum(ContractType).optional(),
  contractStatus: z.nativeEnum(ContractStatus).optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type ContractListFilters = z.infer<typeof ContractListFiltersSchema>

export const ContractCreateInputSchema = z.object({
  classification: z.nativeEnum(ContractClassification),
  contractModel: z.nativeEnum(ContractModel),
  object: z.string().min(1, 'Objeto é obrigatório'),
  totalValue: z.number().min(0),
  contractPeriod: z.object({
    start: z.date(),
    end: z.date(),
  }),
  contractType: z.nativeEnum(ContractType),
  supplierId: z.number().nullish(),
  financierId: z.number().nullish(),
  collaboratorId: z.number().nullish(),
  budgetPlanId: z.number().nullish(),
  programId: z.number().nullish(),
  supplier: z.any().nullish(),
  financier: z.any().nullish(),
  collaborator: z.any().nullish(),
  parentId: z.number().nullish(),
  contractStatus: z.nativeEnum(ContractStatus).optional(),
  dataAssinatura: z.string().nullish(),
  signedContractUrl: z.string().nullish(),
  observations: z.string().nullish(),
  categorizacao: z.array(z.string()).nullish(),
  centroDeCusto: z.array(z.string()).nullish(),
})

export type ContractCreateInput = z.infer<typeof ContractCreateInputSchema>
