'use client'
import { useDisclosure } from '@/hooks/useDisclosure'
import { usePayableContext } from '@/hooks/usePayableContext'
import { ParamsPayables } from '@/types/Payables'
import { filterSchema } from '@/validators/payables'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Paper, Table, TableContainer } from '@mui/material'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Paginator } from '../layout/paginator'
import { ModalPostergation } from '../modals/financeiro/ModalPostergation'
import { ModalPreviewPayable } from '../modals/financeiro/ModalPreviewPayable'
import { LoadingTable } from '../table/loadingTable'
import { headCells } from './consts'
import { HeaderPayables } from './HeaderPayables'
import { EnhancedTableHead } from '../table/CustomTableHead'
import { Card, CardContent } from '../ui/card'
import { CustomTableBody } from '../table/CustomTableBody'
import { PayablesRow } from './PayablesTableComponents/PayablesRow'
import { useCNABExport } from '@/hooks/useCABExport'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalAwait } from '../modals/ModalAwait'
import { useGetAllFilteredPayables } from '@/services/payables'
import ModalApprovePayables from '../modals/financeiro/ModalApprovePayables'

export default function PayablesTable() {
  const [params, setParams] = useState({})
  const {
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ParamsPayables>({
    resolver: zodResolver(filterSchema),
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

  const {
    isOpen: isOpenApproveModal,
    onOpen: onOpenApproveModal,
    onClose: onCloseApproveModal,
  } = useDisclosure()

  const { payable, setCurrentPayableId } = usePayableContext()

  const { paginationParams, payableParams, search } = watch()

  const { data, isLoading } = useGetAllFilteredPayables({
    paginationParams,
    search,
    payableParams: params,
  })

  const { handleSelect, onSubmit, errorMessage, modal, selectedIds } = useCNABExport()

  const handleFilter = () => {
    setParams({ ...payableParams })
  }

  return (
    <Fragment>
      <Paginator setValue={setValue} meta={data ? data.meta : null}>
        <Card className="overflow-hidden">
          <HeaderPayables
            control={control}
            watch={watch}
            errors={errors}
            onExportCNAB={onSubmit}
            handleFilter={handleFilter}
            onOpenApproveModal={onOpenApproveModal}
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
                    <EnhancedTableHead headCells={headCells} />
                    <CustomTableBody items={data?.data}>
                      {(row, index) => (
                        <PayablesRow
                          key={'payableRow' + index}
                          index={index}
                          row={row}
                          onOpenPreviewModal={onOpenPreviewModal}
                          setCurrentPayableId={setCurrentPayableId}
                          onSelect={handleSelect}
                          isSelected={selectedIds.includes(row.id)}
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
      {payable && (
        <Fragment>
          <ModalPreviewPayable
            open={isOpenPreviewModal}
            handleOnClose={onClosePreviewModal}
            payable={payable}
            onOpenPostergationModal={onOpenPostergationModal}
            isApprovalModal={isOpenApproveModal}
          />
          <ModalPostergation
            isOpen={isOpenPostergationModal}
            onClose={onClosePostergationModal}
            defaultValues={payable?.installments}
            accountId={payable?.id}
            totalValue={payable.totalValue}
            type="payable"
          />
        </Fragment>
      )}
      <ModalConfirm
        textConfirm="Ok"
        success={!errorMessage}
        text={errorMessage || 'Arquivo gerado e enviado com sucesso.'}
        open={modal.isOpenConfirm}
        onClose={modal.onCloseConfirm}
      />
      <ModalAwait
        open={modal.isOpenModalAwait}
        text={
          isOpenApproveModal
            ? 'Aprovando contas. Aguarde...'
            : 'O arquivo está sendo gerado. Aguarde...'
        }
      />
      <ModalApprovePayables
        isOpen={isOpenApproveModal}
        onClose={onCloseApproveModal}
        onOpenPreviewModal={onOpenPreviewModal}
      />
    </Fragment>
  )
}
