import { searchAppointmentsSchema } from '@/validators/searchAppointments'
import { z } from 'zod'
import { PaginateParams } from './paginateParams'
import { Control, FieldErrors, UseFormReset, UseFormSetValue } from 'react-hook-form'
import { Response } from '@/types/global'
import { Dispatch, SetStateAction } from 'react'

export type SearchAppointmentParams = {
  searchAppointmentParams: z.input<typeof searchAppointmentsSchema>
  paginationParams: PaginateParams
}

export type AppointmentRow = {
  id: number
  bank: string
  identification: string
  aditionalDescription: string
  cnpj: string
  dueDate: string
  signal: string
  value: number
}

export interface useGetAppointmentsProps {
  form: {
    control: Control<SearchAppointmentParams>
    setValue: UseFormSetValue<SearchAppointmentParams>
    errors: FieldErrors<SearchAppointmentParams>
  }
  handleOnFilter: () => void
  handleCallBack: () => void
  reset: UseFormReset<SearchAppointmentParams>
  setSelectedItem: Dispatch<SetStateAction<AppointmentRow | undefined>>
  data: Response<AppointmentRow[]> | undefined
  isLoadingAppointments: boolean
  values: SearchAppointmentParams
  selectedItem: AppointmentRow | undefined
}
