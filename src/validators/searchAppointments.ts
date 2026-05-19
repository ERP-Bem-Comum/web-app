import { z } from 'zod'

const searchAppointmentsSchema = z.object({
  accountId: z.number({ required_error: 'Campo Obrigatório' }),
  typeOfTransaction: z.enum(['Receivable', 'Payable']).default('Payable'),
  orderValue: z.enum(['ASC', 'DESC']).default('DESC'),
  orderDueDate: z.enum(['ASC', 'DESC']).default('DESC'),
  identificationCodeSearch: z.string().optional(),
  CNPJorNameSearch: z.string().optional(),
  dueBetween: z.object({
    start: z.date().optional(),
    end: z.date().optional(),
  }),
})

export { searchAppointmentsSchema }
