import { HeadCell } from '@/types/global'

export const headCellsForReceivables: HeadCell[] = [
  {
    id: 'devedor',
    align: 'left',
    label: 'DEVEDOR',
  },
  {
    id: 'atraso',
    align: 'left',
    label: 'EM ATRASO',
  },
  {
    id: 'recebido',
    align: 'left',
    label: 'RECEBIDO',
  },
  {
    id: 'receber',
    align: 'left',
    label: 'A RECEBER',
  },
]

export const headCellsForPayables: HeadCell[] = [
  {
    id: 'fornecedor',
    align: 'left',
    label: 'FORNECEDOR',
  },
  {
    id: 'atraso',
    align: 'left',
    label: 'EM ATRASO',
  },
  {
    id: 'pago',
    align: 'left',
    label: 'PAGO',
  },
  {
    id: 'pagar',
    align: 'left',
    label: 'A PAGAR',
  },
]
