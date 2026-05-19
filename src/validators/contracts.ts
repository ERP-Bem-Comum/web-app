import { ContractModel, ContractStatus, ContractType } from '@/enums/contracts'
import { z } from 'zod'
import { bancaryInfoRefined, pixInfoRefined } from './global'
import { isAllEmpty } from '@/utils/emptyFilled'
import { BancaryInfo, PixInfo } from '@/types/global'

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
  agreement: z.coerce.number().nullish(),
  contractType: z.nativeEnum(ContractType).nullish(),
  contractStatus: z.nativeEnum(ContractStatus).nullish(),
})

const commonContractSchema = z.object({
  contractModel: z.nativeEnum(ContractModel, handleErrorMessage('Modelo de contrato')),
  object: z.string().min(1, 'Objeto é obrigatório.'),
  totalValue: z.number(handleErrorMessage('valor total')),
  agreement: z.coerce.boolean(handleErrorMessage('acordo')),
  contractPeriod: z
    .object({
      start: z.date(handleErrorMessage('Inicio do periodo', 'data')),
      end: z.date(handleErrorMessage('Fim do periodo', 'data')).nullable().optional(),
      isIndefinite: z
        .boolean()
        .nullable()
        .optional()
        .transform((val) => val ?? false),
    })
    .refine(
      (data) => data.isIndefinite || data.end !== null,
      {
        message: 'Fim do periodo é obrigatório quando não for prazo indeterminado.',
        path: ['end'],
      },
    )
    .refine(
      (data) => !data.end || !data.start || data.end > data.start,
      {
        message: 'Fim do periodo deve ser posterior ao início.',
        path: ['end'],
      },
    ),
  supplierId: z.number(handleErrorMessage('Fornecedor')).nullish(),
  financierId: z.number(handleErrorMessage('Financiador')).nullish(),
  collaboratorId: z.number(handleErrorMessage('Colaborador')).nullish(),
  parentId: z.number().nullish(),
  pixInfo: pixInfoRefined.nullish(),
  bancaryInfo: bancaryInfoRefined.nullish(),
  createdById: z.number().nullish(),
  updatedBy: z.number().nullish(),
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

const financierContractSchema = z
  .object({
    contractType: z.literal(ContractType.FINANCIER),
  })
  .merge(commonContractSchema)

export const contractSchema = z
  .discriminatedUnion('contractType', [
    financierContractSchema,
    collaboratorContractSchema,
    supplierContractSchema,
  ])
  .superRefine((values, ctx) => {
    if (
      values.contractType === ContractType.COLLABORATOR ||
      values.contractType === ContractType.SUPPLIER
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
      data.contractType === ContractType.SUPPLIER
    ) {
      const { accountNumber, agency, bank } = data.bancaryInfo || {}

      if (isAllEmpty({ accountNumber, agency, bank })) {
        return {
          ...data,
          pixInfo: data.pixInfo,
          bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null } as BancaryInfo,
        }
      }
      if (isAllEmpty(data.pixInfo)) {
        return {
          ...data,
          bancaryInfo: data.bancaryInfo,
          pixInfo: { key: null, key_type: null } as PixInfo,
        }
      }
    } else {
      return { ...data, bancaryInfo: undefined, pixInfo: undefined }
    }
    return data
  })
