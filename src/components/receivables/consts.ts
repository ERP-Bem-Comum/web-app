import { HeadCell } from '@/types/global'

export const headCellsReceivable: HeadCell[] = [
  {
    id: 'data',
    align: 'left',
    label: 'DATA',
  },
  {
    id: 'Financiador',
    align: 'left',
    label: 'FINANCIADOR',
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

export const defaultAccounts = {
  'Conta 1': { banco: 'Bradesco 1', agencia: '1111-1', conta: '123456-8' },
  'Conta 2': { banco: 'Bradesco 2', agencia: '1111-2', conta: '123456-7' },
  'Conta 3': { banco: 'Bradesco 3', agencia: '1111-3', conta: '123456-2' },
  'Conta 4': { banco: 'Bradesco 4', agencia: '1111-4', conta: '123456-3' },
  'Conta 5': { banco: 'Bradesco 5', agencia: '1111-5', conta: '123456-4' },
}
