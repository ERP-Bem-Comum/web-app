import { z } from 'zod'
import {
  ContractClassification,
  ContractModel,
  ContractStatus,
  ContractType,
  Categoria,
  CentroDeCusto,
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
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type ContractListFilters = z.infer<typeof ContractListFiltersSchema>

/* ── Dados bancários ── */
export const BancaryInfoSchema = z.object({
  bank: z.string().nullish(),
  agency: z.string().nullish(),
  accountNumber: z.string().nullish(),
  dv: z.string().nullish(),
})

export const PixInfoSchema = z.object({
  key_type: z.string().nullish(),
  key: z.string().nullish(),
})

/* ── Schema base de criação ── */
const BaseContractCreateSchema = z.object({
  classification: z.nativeEnum(ContractClassification),
  contractModel: z.nativeEnum(ContractModel),
  object: z.string().min(1, 'Objeto é obrigatório'),
  totalValue: z.number().min(0),
  contractPeriod: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }).optional(),
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
  categorizacao: z.nativeEnum(Categoria).nullish(),
  centroDeCusto: z.nativeEnum(CentroDeCusto).nullish(),
  bancaryInfo: BancaryInfoSchema.nullish(),
  pixInfo: PixInfoSchema.nullish(),
  email: z.string().email('E-mail inválido').nullish(),
  telephone: z.string().nullish(),
})

/* ── Schema com regras de negócio ── */
export const ContractCreateInputSchema = BaseContractCreateSchema.superRefine((data, ctx) => {
  /* Regra 1: valor original deve ser maior que zero */
  if (!data.totalValue || data.totalValue <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalValue'],
      message: 'Valor original deve ser maior que zero',
    })
  }

  /* Regra 2: teto de Ordem de Serviço */
  if (
    data.classification === ContractClassification.SERVICE_ORDER &&
    data.totalValue > 9999.99
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalValue'],
      message: 'Ordem de Serviço não pode ultrapassar R$ 9.999,99',
    })
  }

  /* Regra 3: pelo menos um método de pagamento para SUPPLIER / COLLABORATOR / ACT */
  const needsPaymentInfo =
    data.contractType === ContractType.SUPPLIER ||
    data.contractType === ContractType.COLLABORATOR ||
    data.contractType === ContractType.ACT

  if (needsPaymentInfo) {
    const hasBank =
      data.bancaryInfo?.bank ||
      data.bancaryInfo?.agency ||
      data.bancaryInfo?.accountNumber
    const hasPix = data.pixInfo?.key_type && data.pixInfo?.key

    if (!hasBank && !hasPix) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['bancaryInfo'],
        message: 'Informe dados bancários ou chave PIX',
      })
    }
  }

  /* Regra 4: contratante obrigatório conforme tipo */
  if (data.contractType === ContractType.SUPPLIER && !data.supplierId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['supplierId'],
      message: 'Fornecedor é obrigatório',
    })
  }
  if (data.contractType === ContractType.FINANCIER && !data.financierId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['financierId'],
      message: 'Financiador é obrigatório',
    })
  }
  if (data.contractType === ContractType.COLLABORATOR && !data.collaboratorId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['collaboratorId'],
      message: 'Colaborador é obrigatório',
    })
  }

  /* Regra 5: período de vigência é obrigatório */
  if (!data.contractPeriod?.start) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contractPeriod', 'start'],
      message: 'Data de início é obrigatória',
    })
  }
  if (!data.contractPeriod?.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contractPeriod', 'end'],
      message: 'Data de fim é obrigatória',
    })
  }
})

export type ContractCreateInput = z.infer<typeof ContractCreateInputSchema>

/* ── Schema de criação de aditivo ── */
export const AditiveTypeSchema = z.enum(['prazo', 'valor', 'escopo', 'outro', 'distrato'])
export type AditiveType = z.infer<typeof AditiveTypeSchema>

export const AditiveCreateInputSchema = z.object({
  parentId: z.number(),
  aditivoType: AditiveTypeSchema,
  object: z.string().min(1, 'Resumo é obrigatório'),
  totalValue: z.number().optional(),
  contractPeriod: z.object({
    start: z.coerce.date().optional(),
    end: z.coerce.date().optional(),
  }).optional(),
  dataAssinatura: z.string().nullish(),
  signedContractUrl: z.string().nullish(),
  observations: z.string().nullish(),
  aditivoStatus: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.aditivoType === 'valor' && (data.totalValue === undefined || data.totalValue === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['totalValue'],
      message: 'Valor é obrigatório para aditivo de valor',
    })
  }
  if (data.aditivoType === 'prazo' && !data.contractPeriod?.end) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['contractPeriod', 'end'],
      message: 'Nova data fim é obrigatória para aditivo de prazo',
    })
  }
})

export type AditiveCreateInput = z.infer<typeof AditiveCreateInputSchema>
