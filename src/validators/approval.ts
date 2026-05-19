import { z } from 'zod'

export const credentialsSchema = z.object({
  payableId: z.number(),
  password: z.string(),
})

export const approvalSchema = z
  .object({
    payableId: z.number(),
    approved: z.boolean(),
    obs: z.string(),
    password: z.string(),
  })
  .superRefine((data, ctx) => {
    if (!data.approved && (data.obs.length === 0 || !data.obs)) {
      ctx.addIssue({
        path: ['obs'],
        code: z.ZodIssueCode.custom,
        message: 'Observação é obrigatória para contas não aprovadas.',
      })
    }
  })
