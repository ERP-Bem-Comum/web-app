'use client'
import { useDisclosure } from '@/hooks/useDisclosure'
import { useReceivableContext } from '@/hooks/useReceivableContext'
import { ParamsReceivables } from '@/types/receivables'
import { filterReceivableSchema } from '@/validators/receivables'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Paper, Table, TableContainer } from '@mui/material'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Paginator } from '../layout/paginator'
import { ModalPostergation } from '../modals/financeiro/ModalPostergation'
import { ModalPreviewReceivable } from '../modals/financeiro/ModalPreviewReceivable'
import { LoadingTable } from '../table/loadingTable'
import { Card, CardContent } from '../ui/card'
import { HeaderReceivables } from './HeaderReceivables'
import { EnhancedTableHead } from '../table/CustomTableHead'
import { headCellsReceivable } from './consts'
import { CustomTableBody } from '../table/CustomTableBody'
import ReceivablesCustomRow from './ReceivablesTableComponents/ReceivablesRow'
import { useGetAllFilteredReceivables } from '@/services/receivable'

export default function ReceivablesTable() {
  const [params, setParams] = useState({})

  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParamsReceivables>({
    resolver: zodResolver(filterReceivableSchema),
  })

  const {
    isOpen: isOpenPreviewModal,
    onOpen: onOpenPreviewModal,
    onClose: onClosePreviewModal,
  } = useDisclosure()

  const {
    isOpen: isOpenPostergationModal,
    onOpen: onOpenPostergationModal,
    onClose: onClosePostergationModal,
  } = useDisclosure()

  const { receivable, setCurrentReceivableId } = useReceivableContext()

  const { paginationParams, search, receivableParams } = watch()

  const { data, isLoading } = useGetAllFilteredReceivables({
    paginationParams,
    search,
    receivableParams: params,
  })

  const handleFilter = () => {
    setParams({ ...receivableParams })
  }

  return (
    <Fragment>
      <Paginator setValue={setValue} meta={data ? data.meta : null}>
        <Card className="overflow-hidden">
          <HeaderReceivables
            control={control}
            watch={watch}
            errors={errors}
            handleFilter={handleFilter}
          />
          <CardContent className="p-0">
            <Box sx={{ width: '100%' }}>
              <Paper
                sx={{
                  width: '100%',
                }}
              >
                {isLoading && <LoadingTable />}
                <TableContainer className="w-full overflow-auto">
                  <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                    <EnhancedTableHead headCells={headCellsReceivable} />
                    <CustomTableBody items={data?.data}>
                      {(row, index) => (
                        <ReceivablesCustomRow
                          key={'receivableRow' + index}
                          index={index}
                          row={row}
                          onOpenPreviewModal={onOpenPreviewModal}
                          setCurrentReceivableId={setCurrentReceivableId}
                        />
                      )}
                    </CustomTableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Box>
          </CardContent>
        </Card>
      </Paginator>
      <ModalPreviewReceivable
        open={isOpenPreviewModal}
        handleOnClose={onClosePreviewModal}
        receivable={receivable}
        onOpenPostergationModal={onOpenPostergationModal}
      />
      {receivable && (
        <ModalPostergation
          isOpen={isOpenPostergationModal}
          onClose={onClosePostergationModal}
          defaultValues={receivable?.installments}
          accountId={receivable?.id}
          totalValue={receivable?.totalValue}
          type="receivable"
        />
      )}
    </Fragment>
  )
}
