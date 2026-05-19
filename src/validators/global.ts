import { isAllEmpty, isAllFilled } from '@/utils/emptyFilled'
import { isValidCNPJ } from '@/utils/validateCnpj'
import { isValidCPF } from '@/utils/validateCpf'
import { z } from 'zod'
import { BancaryInfo, PixInfo } from '@/types/global'
import { handleErrorMessage } from '@/utils/handleTypeErrorMessage'

type handleErrorMessage = (
  field: string,
  type?: string,
) => { invalid_type_error: string; required_error: string }

const bancaryInfoSchema = z
  .object({
    bank: z.string().nullish(),
    agency: z
      .string()
      .refine((value) => value === '' || /^\d{4}-\d{1}$/.test(value), {
        message: 'A agência e o dv da agência devem ser informados no formato 0000-0',
      })
      .nullish(),
    accountNumber: z.string().nullish(),
    dv: z.string().max(1).nullish(),
  })
  .optional()

export const bancaryInfoRefined = bancaryInfoSchema.refine((data) => {
  const { accountNumber, agency, bank } = data || {}
  const isBancaryInfoEmpty = isAllEmpty({
    accountNumber,
    agency,
    bank,
  })
  const isBancaryInfoFilled = isAllFilled({
    accountNumber,
    agency,
    bank,
  })

  return isBancaryInfoFilled || isBancaryInfoEmpty
}, 'Preencha todos os dados bancários ou deixe todos em branco')

const pixInfoSchema = z
  .object({
    key_type: z
      .string(handleErrorMessage('tipo de chave'))
      .min(1, handleErrorMessage('tipo de chave', 'string').required_error)
      .nullish(),
    key: z
      .string(handleErrorMessage('chave'))
      .min(1, handleErrorMessage('chave', 'string').required_error)
      .nullish(),
  })
  .optional()

export const pixInfoRefined = pixInfoSchema
  .refine((data) => {
    const isPixEmpty = isAllEmpty(data)
    const isPixFilled = isAllFilled(data)
    return isPixEmpty || isPixFilled
  }, 'Preencha todos os dados de PIX ou deixe todos em branco')
  .superRefine((data, ctx) => {
    if (!data) return true
    let valid = true
    if (data?.key_type === 'EMAIL') {
      valid = z.string().email().safeParse(data.key).success
    }
    if (data?.key_type === 'CNPJ') {
      valid = isValidCNPJ(data.key ?? '')
    }
    if (data?.key_type === 'CPF') {
      valid = isValidCPF(data.key ?? '')
    }
    if (!valid) {
      ctx.addIssue({
        path: ['key'],
        code: z.ZodIssueCode.custom,
        message: `Chave PIX deve ser um ${data?.key_type} válido`,
      })
    }
    return valid
  })

export const editPaymentInfoSchema = z
  .object({
    bancaryInfo: bancaryInfoRefined.nullish(),
    pixInfo: pixInfoRefined.nullish(),
    updatedBy: z.number().optional(),
  })
  .superRefine((values, ctx) => {
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
  })
  .transform((data) => {
    if (isAllEmpty(data.bancaryInfo)) {
      return {
        pixInfo: data.pixInfo,
        bancaryInfo: { accountNumber: null, agency: null, bank: null, dv: null } as BancaryInfo,
      }
    }
    if (isAllEmpty(data.pixInfo)) {
      return { bancaryInfo: data.bancaryInfo, pixInfo: { key: null, key_type: null } as PixInfo }
    }
    return data
  })
