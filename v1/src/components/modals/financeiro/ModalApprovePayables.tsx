'use client'
import { usePayableContext } from '@/hooks/usePayableContext'
import { ParamsPayablesApproval } from '@/types/Payables'
import { Checkbox, Modal, Table, TableContainer, TextField } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useGetAllPayablesForApproval } from '@/services/payables'
import { Paginator } from '@/components/layout/paginator'
import { LoadingTable } from '@/components/table/loadingTable'
import { EnhancedTableHead } from '@/components/table/CustomTableHead'
import { headCellsForApprovals } from '@/components/payables/consts'
import { CustomTableBody } from '@/components/table/CustomTableBody'
import { PayablesRow } from '@/components/payables/PayablesTableComponents/PayablesRow'
import { ModalConfirm } from '../ModalConfirm'
import { ModalAwait } from '../ModalAwait'
import { useSession } from 'next-auth/react'
import { useMassApprovals } from '@/hooks/useApprovals'
import { GhostButton } from '@/components/layout/Buttons/GhostButton'
import { SubmitButton } from '@/components/layout/Buttons/SubmitButton'
import { OutlineButton } from '@/components/layout/Buttons/OutlineButton'
import { Button } from '@/components/ui/button'
import { MdOutlineClose } from 'react-icons/md'
import { useEffect } from 'react'

interface ApprovePayablesProps {
  onClose: () => void
  isOpen: boolean
  onOpenPreviewModal: () => void
}

export default function ModalApprovePayables({
  onClose,
  onOpenPreviewModal,
  isOpen,
}: ApprovePayablesProps) {
  const { data: session } = useSession()
  const { watch, setValue, reset } = useForm<ParamsPayablesApproval>({
    defaultValues: {
      userId: session?.user.id,
    },
  })

  useEffect(() => reset({ userId: session?.user.id }), [session?.user.id, reset])

  const {
    setSelectedIds,
    onSubmit,
    setObs,
    setIsAllChecked,
    isAllChecked,
    modal,
    selectedIds,
    isSubmitting,
    errorMessage,
    obs,
  } = useMassApprovals()

  const selectAll = () => {
    if (!data || !data.data) return
    const ids = data.data.map((payable) => payable.approvals[0].id) || []
    if (isAllChecked) {
      setSelectedIds([])
    } else {
      setSelectedIds(ids)
    }
    setIsAllChecked(!isAllChecked)
  }

  const handleSelect = (id: number, isSelected: boolean) => {
    if (isSelected) {
      setSelectedIds((prev) => [...prev, id])
      if (selectedIds.length + 1 === data?.data?.length) {
        setIsAllChecked(true)
      }
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id))
      setIsAllChecked(false)
    }
  }

  const clearSelected = () => {
    setSelectedIds([] as Array<number>)
    setIsAllChecked(false)
  }

  const { setCurrentPayableId } = usePayableContext()

  const { data, isLoading } = useGetAllPayablesForApproval(watch())

  // DEBUG: Log para verificar contas retornadas
  useEffect(() => {
    if (data?.data) {
      console.log('=== MODAL DE APROVAÇÃO EM MASSA ===')
      console.log('Usuário logado ID:', session?.user.id)
      console.log('Usuário logado Nome:', session?.user.name)
      console.log('Total de contas pendentes:', data.data.length)
      console.log('Contas retornadas:', data.data.map((p: any) => ({
        id: p.id,
        identifierCode: p.identifierCode,
        supplier: p.supplier?.name || p.collaborator?.name,
        totalValue: p.totalValue,
        approvals: p.approvals.map((a: any) => ({
          id: a.id,
          collaboratorId: a.collaborator?.id,
          collaboratorName: a.collaborator?.name,
          approved: a.approved,
          obs: a.obs
        }))
      })))
      console.log('===================================')
    }
  }, [data, session])

  return (
    <Modal
      open={isOpen}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <div
        className={`w-screen h-screen bg-erp-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 overflow-auto`}
      >
        <div className="flex items-center justify-between mb-20">
          <div className="text-xl font-bold">Aprovar contas a pagar</div>
          <Button
            variant="ghost"
            size="none"
            data-test="close"
            onClick={() => {
              onClose()
              clearSelected()
            }}
          >
            <MdOutlineClose size={32} color={'#155366'} />
          </Button>
        </div>
        <Paginator setValue={setValue} meta={data ? data.meta : null}>
          <section className="p-0 overflow-hidden bg-white w-full">
            {isLoading && <LoadingTable />}
            <TableContainer className="w-full overflow-auto">
              <Table sx={{ minWidth: 750 }} aria-labelledby="tableTitle" size={'medium'}>
                <EnhancedTableHead
                  headCells={headCellsForApprovals}
                  selectComponent={
                    <SelectorComponent onChange={selectAll} checked={isAllChecked} />
                  }
                />
                <CustomTableBody items={data?.data}>
                  {(row, index) => (
                    <PayablesRow
                      key={'modalPRow' + index}
                      index={index}
                      row={row}
                      onOpenPreviewModal={onOpenPreviewModal}
                      setCurrentPayableId={setCurrentPayableId}
                      onSelect={handleSelect}
                      isSelected={selectedIds.includes(row.approvals[0].id)}
                      isApprovalRow
                    />
                  )}
                </CustomTableBody>
              </Table>
            </TableContainer>
          </section>
        </Paginator>
        <div className="flex justify-end py-5 gap-5">
          <TextField
            fullWidth
            label="Observação"
            value={obs}
            onChange={(e) => setObs(e.target.value)}
            sx={{ backgroundColor: 'white' }}
            size="small"
          />
          <GhostButton
            disabled={isSubmitting}
            label="Limpar seleção"
            onClick={clearSelected}
            className="min-w-fit"
          />
          <OutlineButton
            disabled={isSubmitting}
            label="Reprovar"
            onClick={() => {
              onSubmit()
            }}
          />
          <SubmitButton
            createLabel="Aprovar"
            editLabel=""
            edit={false}
            disabled={isSubmitting}
            onClick={() => {
              onSubmit(true)
            }}
          />
        </div>
        <ModalConfirm
          textConfirm="Ok"
          success={!errorMessage}
          text={errorMessage || 'Contas atualizadas com sucesso.'}
          open={modal.isOpenConfirm}
          onClose={() => {
            modal.onCloseConfirm()
            !errorMessage && onClose()
          }}
        />
        <ModalAwait open={modal.isOpenModalAwait} text="Atualizando contas. Aguarde..." />
      </div>
    </Modal>
  )
}

const SelectorComponent = ({ onChange, checked }: { onChange: () => void; checked: boolean }) => {
  return <Checkbox onChange={() => onChange()} checked={checked} />
}
