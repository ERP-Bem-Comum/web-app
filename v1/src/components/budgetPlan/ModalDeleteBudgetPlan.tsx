import { Button } from '@/components/ui/button'
import { deleteBudgetPlan } from '@/services/budgetPlan'
import { Box, Modal } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { useOptions } from '@/hooks/useOptions'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budgetId: number
  budgetName: string
  haveChildren: boolean
  redirect?: boolean
}

export function ModalDeleteBudgetPlan({
  open,
  onClose,
  budgetId,
  budgetName,
  haveChildren,
  redirect = false,
}: Props) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirmDelete, setShowModalConfirmDelete] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const { refetch } = useOptions()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      response = await deleteBudgetPlan(budgetId)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setSuccess(false)
      setErrorMessage(response.message)
    } else {
      setSuccess(true)
    }

    setShowModalConfirmDelete(true)
  }

  const handleCloseSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
    queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
    refetch.refetchBudgetPlanAndNested()

    redirect ? router.push('/planejamento') : onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 `}>
        <Card className="w-96 p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-5 px-0">
            <div className="text-xl">Excluir Plano Orçamentário</div>
            <Button variant="ghost" size="none" data-test="close" onClick={onClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className="flex px-0 w-full">
              <div className="w-full text-sm font-semibold mb-2">
                Atenção, você está prestes a excluir o plano “{budgetName}”
                {haveChildren && ' e seus itens filhos'}, isso não pode ser desfeito. Tem certeza?
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pb-4 px-0">
              <Button data-test="submit" variant="destructive" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Excluir plano
              </Button>
              <Button data-test="cancel" className="mt-4" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirmDelete}
          onClose={() => {
            setShowModalConfirmDelete(false)
            success && handleCloseSuccess()
          }}
          text={success ? 'Plano excluído com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
