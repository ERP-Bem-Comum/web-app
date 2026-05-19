'use client'

import SearchModalComponents from './modalComponents/index'
import { Paginator } from '../../layout/paginator'
import { useAppointments } from '@/hooks/useGetAppointments'
import { AppointmentRow } from '@/types/searchAppointments'
import { useEffect } from 'react'

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  rowCallBack: (row: AppointmentRow) => void
  dueBetween: { start: Date; end: Date }
  accountId: number
}

const SearchModal = ({ isOpen, onClose, rowCallBack, dueBetween, accountId }: SearchModalProps) => {
  const {
    form,
    data,
    isLoadingAppointments,
    values,
    selectedItem,
    handleCallBack,
    handleOnFilter,
    setSelectedItem,
    reset,
  } = useAppointments(onClose, rowCallBack, accountId, dueBetween)

  useEffect(() => {
    form.setValue('searchAppointmentParams.dueBetween', {
      start: new Date(dueBetween.start.toISOString()),
      end: new Date(dueBetween.end.toISOString()),
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dueBetween])

  return (
    <SearchModalComponents.Root open={isOpen} onClose={onClose} title="Buscar apontamento">
      <SearchModalComponents.Container>
        <SearchModalComponents.Header
          values={values}
          control={form.control}
          errors={form.errors}
          reset={reset}
          onFilter={handleOnFilter}
          accountId={accountId}
        />
        <Paginator setValue={form.setValue} meta={data ? data.meta : null}>
          <SearchModalComponents.Body
            data={data?.data ?? []}
            isLoading={isLoadingAppointments}
            rowCallBack={setSelectedItem}
            maxHeight={400}
            setValue={form.setValue}
            values={values}
            currentSelectedId={selectedItem?.id}
          />
        </Paginator>
      </SearchModalComponents.Container>
      <SearchModalComponents.Buttons onClose={onClose} onSubmit={handleCallBack} />
    </SearchModalComponents.Root>
  )
}

export default SearchModal
