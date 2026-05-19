import { reportsFilterSchema } from '@/validators/reports/filters'
import { z } from 'zod'
import { Control, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { PaginateParams } from '../paginateParams'
import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'

export type filterReportParams = {
  paginationParams: PaginateParams
  reportsParams: z.infer<typeof reportsFilterSchema>
}

export type filterReportParamsWithColumns = filterReportParams & {
  columns?: Array<keyof typeof DISPONIBLE_COLUMNS>
}

export type FormParamsReturn<T extends filterReportParams> = {
  control: Control<T>
  clearField: (field: keyof T['reportsParams']) => void
  handleFilter: () => void
  watch: UseFormWatch<T>
  errors: FieldErrors<T>
  setValue: UseFormSetValue<T>
  values: T
}

export type useReportFilterWithColumnsReturn = FormParamsReturn<filterReportParams> & {
  columns: DISPONIBLE_COLUMNS[]
}

export enum MergedStatusForReportFilter {
  APPROVING = 'EM APROVAÇÃO',
  REJECTED = 'REJEITADO',
  PAID = 'PAGO',
  PENDING = 'PENDENTE',
  APPROVED = 'APROVADO',
  RECEIVED = 'RECEBIDO',
  DUE = 'ATRASADO',
  CONCLUDED = 'CONCLUIDO',
}
