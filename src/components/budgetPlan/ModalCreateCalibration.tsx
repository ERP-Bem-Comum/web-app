import { Button } from '@/components/ui/button'
import { startCalibration } from '@/services/budgetPlan'
import { Box, Modal } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useState } from 'react'
import { MdOutlineClose } from 'react-icons/md'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budget: any
}

export function ModalCreateCalibration({ open, onClose, budget }: Props) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [newId, setNewId] = useState()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      response = await startCalibration(budget?.id)
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
      setNewId(response?.id)

      queryClient.invalidateQueries({
        queryKey: ['budget_plans'],
        refetchType: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: ['budget_plan_id'],
        refetchType: 'active'
      })
      queryClient.invalidateQueries({
        queryKey: ['budgetPlanOptions'],
        refetchType: 'active'
      })
    }

    setShowModalConfirm(true)
  }

  const handleClose = () => {
    onClose()
  }

  const getVersion = () => {
    let last = 0

    if (!budget?.children?.length) return 2

    budget?.children?.forEach((element: any) => {
      if (element.version > last) last = element.version
    })

    last = Math.floor(last)

    return last + 1
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 `}>
        <Card className="w-96 p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-5 px-0">
            <div className="text-xl">Iniciar Calibração</div>
            <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={onSubmit}>
            <CardContent className=" px-0 w-full">
              <div className="w-full text-sm font-semibold">
                Iremos duplicar esse plano orçamentário com o nome de:
              </div>
              <div className="w-full h-12 flex justify-center items-center bg-[#F5F5F5] rounded-md mt-3">
                {budget?.year + ' ' + budget?.program?.name + ' ' + getVersion().toFixed(1)}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pb-4 px-0">
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Duplicar e Iniciar Calibração
              </Button>
              <Button data-test="cancel" className="mt-4" variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirm}
          onClose={() => {
            setShowModalConfirm(false)
            success && router.push(`/planejamento/detalhes/${newId}`)
          }}
          text={success ? 'Calibração criada com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
