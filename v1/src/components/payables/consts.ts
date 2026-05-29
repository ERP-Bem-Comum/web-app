/* eslint-disable @typescript-eslint/no-unused-vars */
import { HeadCell } from '@/types/global'

export const headCells: HeadCell[] = [
  {
    id: 'selector',
    align: 'center',
    label: '',
  },
  {
    id: 'data',
    align: 'left',
    label: 'DATA',
  },
  {
    id: 'competencia',
    align: 'left',
    label: 'COMPETÊNCIA',
  },
  {
    id: 'fornecedor',
    align: 'left',
    label: 'FORNECEDOR',
  },
  {
    id: 'descricao',
    align: 'left',
    label: 'DESCRIÇÃO',
  },
  {
    id: 'centroCusto',
    align: 'left',
    label: 'CENTRO DE CUSTO',
  },
  {
    id: 'status',
    align: 'left',
    label: 'STATUS',
  },
  {
    id: 'valor',
    align: 'left',
    label: 'VALOR (R$)',
  },
]

const [first, ...headcellsForApprovals] = headCells
export const headCellsForApprovals = headcellsForApprovals
