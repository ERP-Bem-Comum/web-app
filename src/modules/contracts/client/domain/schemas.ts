import * as z from 'zod'
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
  search: z.string().trim().optional(),
  budgetPlanId: z.string().trim().nullish(),
  contractPeriodStart: z.iso.date().optional(),
  contractPeriodEnd: z.iso.date().optional(),
  contractType: z
    .enum(Object.values(ContractType) as [string, ...string[]])
    .optional(),
  contractStatus: z
    .enum(Object.values(ContractStatus) as [string, ...string[]])
    .optional(),
  vencendo: z.coerce.boolean().optional(),
  minValue: z.coerce.number().min(0).optional(),
  maxValue: z.coerce.number().min(0).optional(),
  order: z.enum(['ASC', 'DESC']).default('DESC'),
})

export type ContractListFilters = z.infer<typeof ContractListFiltersSchema>

export const GetByIdSchema = z.object({ id: z.uuid() })

export const BancaryInfoSchema = z.object({
  bank: z.string().trim().nullish(),
  agency: z.string().trim().nullish(),
  accountNumber: z.string().trim().nullish(),
  dv: z.string().trim().nullish(),
})

export const PixInfoSchema = z.object({
  key_type: z.string().trim().nullish(),
  key: z.string().trim().nullish(),
})

const BaseContractCreateSchema = z.object({
  classification: z.enum(
    Object.values(ContractClassification) as [string, ...string[]],
  ),
  contractModel: z.enum(
    Object.values(ContractModel) as [string, ...string[]],
  ),
  object: z.string().trim().min(1, 'Objeto é obrigatório'),
  totalValue: z.number().min(0),
  contractPeriod: z
    .object({
      start: z.date().optional(),
      end: z.date().optional(),
    })
    .optional(),
  contractType: z.enum(Object.values(ContractType) as [string, ...string[]]),
  supplierId: z.string().trim().nullish(),
  financierId: z.string().trim().nullish(),
  collaboratorId: z.string().trim().nullish(),
  budgetPlanId: z.string().trim().nullish(),
  programId: z.string().trim().nullish(),
  supplier: z.unknown().nullish(),
  financier: z.unknown().nullish(),
  collaborator: z.unknown().nullish(),
  parentId: z.string().trim().nullish(),
  contractStatus: z
    .enum(Object.values(ContractStatus) as [string, ...string[]])
    .optional(),
  dataAssinatura: z.string().trim().nullish(),
  signedContractUrl: z.string().trim().nullish(),
  observations: z.string().trim().nullish(),
  categorizacao: z
    .enum(Object.values(Categoria) as [string, ...string[]])
    .nullish(),
  centroDeCusto: z
    .enum(Object.values(CentroDeCusto) as [string, ...string[]])
    .nullish(),
  bancaryInfo: BancaryInfoSchema.nullish(),
  pixInfo: PixInfoSchema.nullish(),
  email: z.email('E-mail inválido').nullish(),
  telephone: z.string().trim().nullish(),
})

export const ContractCreateInputSchema = BaseContractCreateSchema.superRefine(
  (data, ctx) => {
    if (!data.totalValue || data.totalValue <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalValue'],
        message: 'Valor original deve ser maior que zero',
      })
    }

    if (
      data.classification === ContractClassification.SERVICE_ORDER &&
      data.totalValue > 9_999.99
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalValue'],
        message: 'Ordem de Serviço não pode ultrapassar R$ 9.999,99',
      })
    }

    const needsPaymentInfo =
      data.contractType === ContractType.SUPPLIER ||
      data.contractType === ContractType.COLLABORATOR ||
      data.contractType === ContractType.ACT

    if (needsPaymentInfo) {
      const hasBank =
        data.bancaryInfo?.bank ??
        data.bancaryInfo?.agency ??
        data.bancaryInfo?.accountNumber
      const hasPix = data.pixInfo?.key_type && data.pixInfo.key

      if (!hasBank && !hasPix) {
        ctx.addIssue({
          code: 'custom',
          path: ['bancaryInfo'],
          message: 'Informe dados bancários ou chave PIX',
        })
      }
    }

    if (data.contractType === ContractType.SUPPLIER && !data.supplierId) {
      ctx.addIssue({
        code: 'custom',
        path: ['supplierId'],
        message: 'Fornecedor é obrigatório',
      })
    }
    if (data.contractType === ContractType.FINANCIER && !data.financierId) {
      ctx.addIssue({
        code: 'custom',
        path: ['financierId'],
        message: 'Financiador é obrigatório',
      })
    }
    if (
      data.contractType === ContractType.COLLABORATOR &&
      !data.collaboratorId
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['collaboratorId'],
        message: 'Colaborador é obrigatório',
      })
    }

    if (!data.contractPeriod?.start) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractPeriod', 'start'],
        message: 'Data de início é obrigatória',
      })
    }
    if (!data.contractPeriod?.end) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractPeriod', 'end'],
        message: 'Data de fim é obrigatória',
      })
    }
  },
)

export type ContractCreateInput = z.infer<typeof ContractCreateInputSchema>

export const AditiveTypeSchema = z.enum([
  'prazo',
  'valor',
  'escopo',
  'outro',
  'distrato',
])
export type AditiveType = z.infer<typeof AditiveTypeSchema>

export const AditiveCreateInputSchema = z
  .object({
    parentId: z.uuid(),
    aditivoType: AditiveTypeSchema,
    object: z.string().trim().min(1, 'Resumo é obrigatório'),
    totalValue: z.number().optional(),
    contractPeriod: z
      .object({
        start: z.coerce.date().optional(),
        end: z.coerce.date().optional(),
      })
      .optional(),
    dataAssinatura: z.string().trim().nullish(),
    signedContractUrl: z.string().trim().nullish(),
    observations: z.string().trim().nullish(),
    aditivoStatus: z.string().trim().optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.aditivoType === 'valor' &&
      data.totalValue === undefined
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['totalValue'],
        message: 'Valor é obrigatório para aditivo de valor',
      })
    }
    if (data.aditivoType === 'prazo' && !data.contractPeriod?.end) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractPeriod', 'end'],
        message: 'Nova data fim é obrigatória para aditivo de prazo',
      })
    }
  })

export type AditiveCreateInput = z.infer<typeof AditiveCreateInputSchema>
