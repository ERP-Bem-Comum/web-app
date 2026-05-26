import { z } from 'zod/v3'

z.setErrorMap((issue, ctx) => {
  if (issue.code === 'invalid_date') {
    return { message: 'Data inválida' }
  }
  return { message: ctx.defaultError }
})
