import {
  objectCategorizationSchema,
  objectRequiredCategorizationSchema,
} from '@/validators/categorization'
import { z } from 'zod/v3'

export type Categorization = z.input<typeof objectCategorizationSchema>
export type RequiredCategorization = z.input<typeof objectRequiredCategorizationSchema>
