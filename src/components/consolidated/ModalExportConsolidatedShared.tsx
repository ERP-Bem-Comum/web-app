import { Button } from '@/components/ui/button'
import { Box, Modal, TextField } from '@mui/material'
import { MdOutlineClose } from 'react-icons/md'
import { useState } from 'react'
import { z } from 'zod'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { exportConsolidatedCSVShared } from '@/services/budgetPlanShared'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
}

const ExportCSVSchema = z.object({
  email: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type ExportCSV = z.infer<typeof ExportCSVSchema>

export function ModalExportConsolidatedShared({ open, onClose }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExportCSV>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(ExportCSVSchema),
  })

  const onSubmit: SubmitHandler<ExportCSV> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)
    let response = null

    try {
      response = await exportConsolidatedCSVShared(data)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }
    if (!response?.data?.message) {
      setShowModalConfirm(true)
      setSuccess(true)
    } else {
      setSuccess(false)
      setShowModalConfirm(true)
      setErrorMessage(response.data.message || 'Erro ao exportar dados')
    }
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
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 px-0">
            <div className="text-xl">Digite o email onde será encaminhado o CSV</div>
            <Button
              variant="ghost"
              size="none"
              data-test="close"
              onClick={handleClose}
              disabled={isDisabled}
            >
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex px-0 w-full">
              <div className="w-full">
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="email"
                      sx={{ marginBottom: 2 }}
                      label="Email"
                      error={!!errors.email}
                      size="small"
                      helperText={errors.email ? errors.email?.message : ''}
                      fullWidth
                    />
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch py-4 px-0">
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enviar
              </Button>
              <Button
                data-test="cancel"
                className="mt-4"
                variant="ghost"
                disabled={isDisabled}
                onClick={handleClose}
              >
                Cancelar
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
          text={success ? 'Um link será enviado para o seu e-mail para download' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
