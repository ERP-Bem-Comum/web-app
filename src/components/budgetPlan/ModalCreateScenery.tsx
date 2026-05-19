import { Button } from '@/components/ui/button'
import { createScenery } from '@/services/budgetPlan'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Modal, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { MdOutlineClose } from 'react-icons/md'
import { z } from 'zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budgetPlanId: number
}

const userSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type User = z.infer<typeof userSchema>

export function ModalCreateScenery({ open, onClose, budgetPlanId }: Props) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [newId, setNewId] = useState(null)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<User>({
    defaultValues: {
      name: '',
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<User> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      response = await createScenery({
        name: data.name,
        budgetPlanId,
      })
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
    reset()
    onClose()
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
            <div className="text-xl">Criar cenário</div>
            <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex px-0 w-full">
              <div className="w-full">
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="name"
                      label="Nome do cenário"
                      error={!!errors.name}
                      size="small"
                      helperText={errors.name ? errors.name?.message : ''}
                      fullWidth
                    />
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pb-4 px-0">
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar cenário
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
          text={success ? 'Cenário criado com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
