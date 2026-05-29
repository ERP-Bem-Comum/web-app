import { DISPONIBLE_COLUMNS } from '@/enums/generalReport'
import { HeadCell } from '@/types/global'

export const headCellsGeneralReport: HeadCell[] = [
  {
    id: 'NUMERO_CONTRATO',
    align: 'left',
    label: 'NÚMERO DO CONTRATO',
  },
  {
    id: 'TIPO',
    align: 'left',
    label: 'CONTA A PAGAR/RECEBER',
  },
  {
    id: 'CODE',
    align: 'left',
    label: 'CÓDIGO IDENTIFICADOR',
  },
  {
    id: 'VENCIMENTO',
    align: 'left',
    label: 'DATA VENCIMENTO',
  },
  {
    id: 'PARCELA',
    align: 'left',
    label: 'PARCELA',
  },
  {
    id: 'APONTAMENTO',
    align: 'left',
    label: 'APONTAMENTO',
  },
  {
    id: 'FORNECEDOR',
    align: 'left',
    label: 'FORNECEDOR',
  },
  {
    id: 'FINANCIADOR',
    align: 'left',
    label: 'FINANCIADOR',
  },
  {
    id: 'COLABORADOR',
    align: 'left',
    label: 'COLABORADOR',
  },
  {
    id: 'CENTRO_CUSTO',
    align: 'left',
    label: 'CENTRO DE CUSTO',
  },
  {
    id: 'CATEGORIA',
    align: 'left',
    label: 'CATEGORIA',
  },
  {
    id: 'SUB_CATEGORIA',
    align: 'left',
    label: 'SUBCATEGORIA',
  },
  {
    id: 'PIX',
    align: 'left',
    label: 'DADOS PIX',
  },
  {
    id: 'BANCARY',
    align: 'left',
    label: 'DADOS BANCARIOS',
  },
]
