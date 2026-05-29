import { Response } from '../global'
import { filterReportParamsWithColumns, FormParamsReturn } from './filters'

export type GeneralReportData = {
  numero_contrato: string | null
  tipo: string | null
  code: string | null
  vencimento: string | null
  parcela: string | null
  apontamento: string | null
  fornecedor: string | null
  financiador: string | null
  colaborador: string | null
  centro_custo: string | null
  categoria: string | null
  sub_categoria: string | null
  pix: string | null
  bancary: string | null
  ID: string
  E_ID: string
  data: string
}

export interface useGeneralReportReturn {
  data?: Array<GeneralReportData>
  meta?: Response<unknown>['meta']
  isLoading: boolean
  form: FormParamsReturn<filterReportParamsWithColumns>
}

export enum ReportType {
  r = 'RECEIVABLE',
  p = 'PAYABLE',
}
