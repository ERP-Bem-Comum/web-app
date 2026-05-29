import { HeadCell } from '@/types/global'
import { SearchAppointmentParams } from '@/types/searchAppointments'
import { UseFormSetValue } from 'react-hook-form'

export const headCells = (
  setValue: UseFormSetValue<SearchAppointmentParams>,
  { searchAppointmentParams: { orderValue, orderDueDate } }: SearchAppointmentParams,
): HeadCell[] => {
  const onSortData = () => {
    setValue('searchAppointmentParams.orderDueDate', orderDueDate === 'ASC' ? 'DESC' : 'ASC')
  }

  const onSortValue = () => {
    setValue('searchAppointmentParams.orderValue', orderValue === 'ASC' ? 'DESC' : 'ASC')
  }

  return [
    {
      id: 'bank',
      align: 'left',
      label: 'BANCO',
    },
    {
      id: 'identification',
      align: 'left',
      label: 'IDENTIFICAÇÃO',
    },
    {
      id: 'aditionalDescription',
      align: 'left',
      label: 'DESCRIÇÃO ADICIONAL',
    },
    {
      id: 'cnpj/CPF',
      align: 'left',
      label: 'CNPJ',
    },
    {
      id: 'dueDate',
      align: 'left',
      label: 'DATA',
      sortable: true,
      onSort: onSortData,
    },
    {
      id: 'value',
      align: 'left',
      label: 'VALOR',
      sortable: true,
      onSort: onSortValue,
    },
  ]
}
