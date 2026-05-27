import { ContractClassification, ContractModel, ContractStatus, ContractType } from '@/enums/contracts'
import { z } from 'zod/v3'
import { bancaryInfoRefined, pixInfoRefined, bancaryInfoSchema, pixInfoSchema } from './global'
import { isAllEmpty } from '@/utils/emptyFilled'


const handleTypeError = (field: string, type: string) => {
  return `O campo ${field} deve ser um(a) ${type}.`
}

const handleRequiredError = (field: string) => {
  return `O campo ${field} é obrigatório.`
}

const handleErrorMessage = (field: string, type?: string) => {
  return {
    invalid_type_error: handleTypeError(field, type ?? 'das opções disponíveis'),
    required_error: handleRequiredError(field),
  }
}

export const filterContractsSchema = z.object({
  budgetPlanId: z.number().nullish(),
  contractPeriod: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .nullish(),
  contractType: z.nativeEnum(ContractType).nullish(),
  contractStatus: z.nativeEnum(ContractStatus).nullish(),
})

const contractorSchema = z.object({
  id: z.number().nullish(),
  name: z.string().nullish(),
  email: z.string().nullish(),
  telephone: z.string().nullish(),
  cnpj: z.string().nullish(),
  cpf: z.string().nullish(),
  corporateName: z.string().nullish(),
  fantasyName: z.string().nullish(),
  serviceCategory: z.string().nullish(),
  role: z.string().nullish(),
  address: z.string().nullish(),
  bancaryInfo: bancaryInfoSchema.nullish(),
  pixInfo: pixInfoSchema.nullish(),
})

const commonContractSchema = z.object({
  classification: z.nativeEnum(ContractClassification, handleErrorMessage('Classificação da contratação')).default(ContractClassification.CONTRACT),
  contractModel: z.nativeEnum(ContractModel, handleErrorMessage('Modelo de contrato')),
  object: z.string().min(1, 'Objeto é obrigatório.'),
  totalValue: z.number(handleErrorMessage('valor total')).refine(
    (val) => val !== undefined && val !== null,
    { message: 'Valor original é obrigatório.' }
  ),
  contractPeriod: z
    .object({
      start: z.date(handleErrorMessage('Inicio do periodo', 'data')),
      end: z.date(handleErrorMessage('Fim do periodo', 'data')),
    })
    .refine(
      (data) => data.end > data.start,
      {
        message: 'Fim do periodo deve ser posterior ao início.',
        path: ['end'],
      },
    ),
  supplierId: z.number(handleErrorMessage('Fornecedor')).nullish(),
  financierId: z.number(handleErrorMessage('Financiador')).nullish(),
  collaboratorId: z.number(handleErrorMessage('Colaborador')).nullish(),
  supplier: contractorSchema.nullish(),
  financier: contractorSchema.nullish(),
  collaborator: contractorSchema.nullish(),
  parentId: z.number().nullish(),
  pixInfo: pixInfoRefined.nullish(),
  bancaryInfo: bancaryInfoRefined.nullish(),
  createdById: z.number().nullish(),
  updatedBy: z.number().nullish(),
  contractStatus: z.nativeEnum(ContractStatus).nullish(),
  dataAssinatura: z.string().nullish(),
  signedContractUrl: z.string().nullish(),
  observations: z.string().nullish(),
  categorizacao: z.array(z.string()).nullish(),
  centroDeCusto: z.array(z.string()).nullish(),
})

export const defaultFullContractSchema = z
  .object({
    budgetPlanId: z.number(handleErrorMessage('Budget plan')),
    programId: z.number(handleErrorMessage('Programa')),
  })
  .merge(commonContractSchema)

export const collaboratorContractSchema = z
  .object({
    contractType: z.literal(ContractType.COLLABORATOR),
  })
  .merge(defaultFullContractSchema)

export const supplierContractSchema = z
  .object({
    contractType: z.literal(ContractType.SUPPLIER),
  })
  .merge(defaultFullContractSchema)

const actContractSchema = z
  .object({
    contractType: z.literal(ContractType.ACT),
  })
  .merge(defaultFullContractSchema)

const financierContractSchema = z
  .object({
    contractType: z.literal(ContractType.FINANCIER),
  })
  .merge(commonContractSchema)

const MAX_SERVICE_ORDER_VALUE = 9999.99

export const contractSchema = z
  .discriminatedUnion('contractType', [
    financierContractSchema,
    collaboratorContractSchema,
    supplierContractSchema,
    actContractSchema,
  ])
  .superRefine((values, ctx) => {
    // Validação de teto para Ordem de Serviço
    if (values.classification === ContractClassification.SERVICE_ORDER && values.totalValue > MAX_SERVICE_ORDER_VALUE) {
      ctx.addIssue({
        path: ['totalValue'],
        code: z.ZodIssueCode.custom,
        message: 'Para Ordem de Serviço, o valor original máximo permitido é R$ 9.999,99.',
      })
    }
    if (
      values.contractType === ContractType.COLLABORATOR ||
      values.contractType === ContractType.SUPPLIER ||
      values.contractType === ContractType.ACT
    ) {
      const isPixInfoEmpty = isAllEmpty(values.pixInfo)
      const { accountNumber, agency, bank } = values.bancaryInfo || {}
      const isBancaryInfoEmpty = isAllEmpty({ accountNumber, agency, bank })
      if (isPixInfoEmpty && isBancaryInfoEmpty) {
        ctx.addIssue({
          path: ['pixInfo'],
          code: z.ZodIssueCode.custom,
          message: 'É obrigatório informação bancária ou pix.',
        })
        ctx.addIssue({
          path: ['bancaryInfo.accountNumber', 'bancaryInfo.agency', 'bancaryInfo.bank'],
          code: z.ZodIssueCode.custom,
          message: 'É obrigatório informação bancária ou pix.',
        })
      }
    }
  })
  .transform((data) => {
    if (
      data.contractType === ContractType.COLLABORATOR ||
      data.contractType === ContractType.SUPPLIER ||
      data.contractType === ContractType.ACT
    ) {
      const { accountNumber, agency, bank } = data.bancaryInfo || {}

      if (isAllEmpty({ accountNumber, agency, bank })) {
        return {
          ...data,
          pixInfo: data.pixInfo,
          bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null },
        }
      }
      if (isAllEmpty(data.pixInfo)) {
        return {
          ...data,
          bancaryInfo: data.bancaryInfo,
          pixInfo: { key: null, key_type: null },
        }
      }
    } else {
      return { ...data, bancaryInfo: undefined, pixInfo: undefined }
    }
    return data
  })
