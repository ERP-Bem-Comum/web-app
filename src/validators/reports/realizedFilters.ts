import { z } from 'zod'

export const realizedFilterSchema = z.object({
  programId: z.coerce.number().optional(),
  budgetPlanId: z.coerce.number().optional(),
  partnerStateId: z.coerce.number().optional(),
  partnerMunicipalityId: z.coerce.number().optional(),
  year: z.date(),
})
