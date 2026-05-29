import { z } from 'zod/v3'
import { requiredCategorizationSchema } from './categorization'
import { omit } from 'lodash-es'

export const filterDateSchema = z.object({
  period: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .required(),
})

export const createBankRecordApischema = z
  .object({
    accountId: z.coerce.number({
      required_error: 'Conta Bancária é obrigatória',
    }),
    documentNumber: z.string().nonempty('Número do Documento é obrigatório'),
    transactionAmount: z.number({
      required_error: 'Valor da Transação é obrigatório',
    }),
    transactionDate: z.date({
      required_error: 'Data da Transação é obrigatória',
      invalid_type_error: 'Data da Transação é obrigatória',
    }),

    fullTransactionDescription: z
      .string()
      .nonempty('Descrição Completa da Transação é obrigatória'),
    categorization: requiredCategorizationSchema,
  })
  .superRefine((values, ctx) => {
    if (values.transactionDate === null) {
      ctx.addIssue({
        path: ['transactionDate'],
        code: z.ZodIssueCode.custom,
        message: 'Data da Transação é obrigatória.',
      })
    }
  })
  .transform((data) => {
    return omit(data, 'accountId')
  })
