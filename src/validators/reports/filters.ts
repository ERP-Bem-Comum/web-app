import { MergedStatusForReportFilter } from '@/types/reports/filters'
import { ReportType } from '@/types/reports/generalReport'
import { z } from 'zod'

export const reportsFilterSchema = z.object({
  budgetPlanId: z.coerce.number().optional(),
  dueBetween: z
    .object({
      start: z.date(),
      end: z.date(),
    })
    .optional(),
  accountId: z.coerce.number().optional(),
  costCenterId: z.coerce.number().optional(),
  categoryId: z.coerce.number().optional(),
  subCategoryId: z.coerce.number().optional(),
  status: z.nativeEnum(MergedStatusForReportFilter).nullish(),
  entityId: z.coerce.number().optional(),
  programId: z.coerce.number().optional(),
  reportType: z.nativeEnum(ReportType).nullish(),
})
