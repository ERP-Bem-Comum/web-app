import { handleErrorMessage } from '@/utils/handleTypeErrorMessage'
import { z } from 'zod'
import { objectRequiredCategorizationSchema } from './categorization'

export const creditCardSchema = z.object({
  name: z.coerce.string().min(1, handleErrorMessage('Nome', 'string').required_error),
  lastDigits: z.coerce
    .string()
    .min(4, handleErrorMessage('Ultimos digitos', 'string').required_error)
    .max(4, 'Máximo de 4 digitos'),
  responsible: z.coerce.string().min(1, handleErrorMessage('Responsável', 'string').required_error),
  instituition: z.coerce
    .string()
    .min(1, handleErrorMessage('Instituição', 'string').required_error),
  accountId: z.coerce.number(handleErrorMessage('Conta', 'numero')),
  dueDay: z.coerce.number(handleErrorMessage('Dia de vencimento', 'numero')),
})

export const creditCardMovimentationSchema = z
  .object({
    description: z.coerce.string().min(1, handleErrorMessage('Descrição', 'string').required_error),
    purchaseDate: z.coerce.date(handleErrorMessage('Data de compra', 'data')),
    hasInstallments: z.coerce.boolean(handleErrorMessage('Parcelas', 'boleano')).default(false),
    numberOfInstallments: z.coerce
      .number(handleErrorMessage('Número de parcelas', 'número'))
      .default(1),
    value: z.coerce.number(handleErrorMessage('Valor', 'número')).default(0),
    cardId: z.coerce.number(handleErrorMessage('Id do cartão', 'número')),
  })
  .merge(objectRequiredCategorizationSchema)

export const creditCardMovParamsSchema = z.object({
  dueBetween: z.object({
    start: z.date(),
    end: z.date(),
  }),
  cardId: z.coerce.number(handleErrorMessage('Id do cartão', 'número')),
  userId: z.coerce.number(handleErrorMessage('Id do usuário', 'número')),
})
