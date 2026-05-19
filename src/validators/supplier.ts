import { isValidCNPJ } from '@/utils/validateCnpj'
import { z } from 'zod'
import { bancaryInfoRefined, pixInfoRefined } from './global'
import { isAllEmpty } from '@/utils/emptyFilled'
import { BancaryInfo, PixInfo } from '@/types/global'

export const supplierSchema = z
  .object({
    id: z.number().optional(),
    name: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
    email: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' })
      .email({ message: 'Email inválido' }),
    cnpj: z
      .string({ required_error: 'Campo Obrigatório' })
      .min(18, 'CNPJ com formato inválido')
      .nonempty({ message: 'Campo Obrigatório' })
      .refine((val) => isValidCNPJ(val), 'CNPJ inválido')
      .transform((cnpj) => cnpj.replace(/\D/g, '')),
    corporateName: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
    fantasyName: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
    serviceCategory: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
    serviceEvaluation: z.number().optional().nullable(),
    commentEvaluation: z.string().optional().nullable(),
    bancaryInfo: bancaryInfoRefined,
    pixInfo: pixInfoRefined,
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
    return data
  })
