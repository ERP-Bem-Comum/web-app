import { Button } from '@/components/ui/button'
import { Box, Modal, TextField } from '@mui/material'
import { MdOutlineClose } from 'react-icons/md'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Loader2 } from 'lucide-react'
import { shareBudgetPlanConsolidated } from '@/services/budgetPlan'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budgetPlans: any[]
}

const userSchema = z.object({
  emails: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type ShareConsolidated = z.infer<typeof userSchema>

export function ModalShareConsolidated({ open, onClose, budgetPlans }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ShareConsolidated>({
    defaultValues: {
      emails: '',
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<ShareConsolidated> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    const budgetPlanIds = budgetPlans?.map((budgetPlan) => budgetPlan?.id)
    const emailsArray = data?.emails.split(';').map(email => email.trim()).filter(email => email)

    let response
    try {
      response = await shareBudgetPlanConsolidated({
        emails: emailsArray,
        budgetPlanIds,
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
        <Card className="w-[555px] p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 px-0">
            <div className="text-xl">Compartilhar</div>
            <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="px-0 w-full">
              <div className="font-semibold text-sm mb-2">
                Informe os emails separados por “;” para enviar o link e senha:
              </div>
              <div className="w-full">
                <Controller
                  name="emails"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      multiline
                      minRows={3}
                      maxRows={4}
                      id="email"
                      sx={{ marginBottom: 2 }}
                      label="Email"
                      error={!!errors.emails}
                      size="small"
                      helperText={errors.emails ? errors.emails?.message : ''}
                      fullWidth
                    />
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex items-center justify-between py-4 px-0">
              <Button data-test="cancel" variant="erpSecondary" onClick={handleClose}>
                Fechar
              </Button>
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Compartilhar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirm}
          onClose={() => {
            setShowModalConfirm(false)
            success && handleClose()
          }}
          text={success ? 'Consolidado compartilhado com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
