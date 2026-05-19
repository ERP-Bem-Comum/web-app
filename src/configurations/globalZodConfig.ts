import { z } from 'zod'

z.setErrorMap((issue, ctx) => {
  if (issue.code === 'invalid_date') {
    return { message: 'Data inválida' }
  }
  return { message: ctx.defaultError }
})
