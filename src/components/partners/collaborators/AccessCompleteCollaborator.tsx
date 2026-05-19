'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { TextField } from '@mui/material'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { Loader2 } from 'lucide-react'
import { checkCpfCollaborator } from '@/services/collaborator'
import { useRouter } from 'next/navigation'

interface Props {
  id: string
  changeCollaborator: any
}

const accessCollaboratorSchema = z.object({
  cpf: z.string({ required_error: 'Campo Obrigatório' }).nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Login = z.infer<typeof accessCollaboratorSchema>

export default function AccessCompleteCollaborator({ id, changeCollaborator }: Props) {
  const [isDisabled, setIsDisabled] = useState(false)
  const [modalShowConfirm, setModalShowConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    defaultValues: {
      cpf: '',
    },
    resolver: zodResolver(accessCollaboratorSchema),
  })

  const onSubmit: SubmitHandler<Login> = async (data) => {
    setIsDisabled(true)

    const info = {
      id,
      cpf: data.cpf,
    }

    let response = null
    try {
      response = await checkCpfCollaborator(info)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setSuccess(false)
      setErrorMessage(response.message)
      setModalShowConfirm(true)
    } else {
      setSuccess(true)
      changeCollaborator(response?.collaborator)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <CardContent className="p-0 pb-8">
        <Controller
          name="cpf"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              id="cpf"
              label="Informe os três primeiros digitos do seu CPF"
              error={!!errors.cpf}
              size="small"
              helperText={errors.cpf ? errors.cpf?.message : ''}
              fullWidth
              sx={{ backgroundColor: '#fff', marginBottom: '24px' }}
            />
          )}
        />
      </CardContent>
      <CardFooter className="flex flex-col pb-0">
        <Button
          data-test="submit"
          className="mb-4 w-full"
          type="submit"
          variant="erpPrimary"
          disabled={isDisabled}
        >
          {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Acessar
        </Button>
      </CardFooter>
      <ModalConfirm
        open={modalShowConfirm}
        onClose={() => {
          setModalShowConfirm(false)
        }}
        success={false}
        text={errorMessage}
      />
    </form>
  )
}
