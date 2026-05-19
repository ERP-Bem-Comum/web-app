import { z } from 'zod'

export const bankAccountSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  initialBalance: z.number().optional(),
  bank: z.coerce
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .default('BRADESCO'),
  agency: z.coerce
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  accountNumber: z.coerce
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  dv: z.coerce
    .string({ required_error: 'Campo Obrigatório' })
    .length(1, { message: 'Maximo 1 caractere.' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
