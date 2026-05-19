'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { TextField, InputAdornment } from '@mui/material'
import { MdMailOutline } from 'react-icons/md'
import { useRouter } from 'next/navigation'
import { useIsMounted } from '@/hooks/useIsMounted'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { RecoveryPassword } from '@/services/login'
import { Loader2 } from 'lucide-react'

const recoverySchema = z.object({
  email: z
    .string({ required_error: 'Campo Obrigatório' })
    .email({ message: 'Email inválido' })
    .min(1, { message: 'Campo Obrigatório' }),
})
// extracting the type
type Login = z.infer<typeof recoverySchema>

export default function FormRecovery() {
  useIsMounted()

  const [isDisabled, setIsDisabled] = useState(false)
  const [modalShowConfirm, setModalShowConfirm] = useState(false)
  const router = useRouter()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Login>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(recoverySchema),
  })

  const onSubmit: SubmitHandler<Login> = async (data) => {
    setIsDisabled(true)

    let response = null
    try {
      response = await RecoveryPassword(data.email)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }
    setModalShowConfirm(true)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      <CardContent className="p-0 pb-8">
        <Controller
          data-test="email"
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email"
              id="email"
              error={!!errors.email}
              size="small"
              helperText={errors.email ? errors.email?.message : ''}
              fullWidth
              sx={{ backgroundColor: '#fff', marginBottom: '24px' }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <MdMailOutline />
                  </InputAdornment>
                ),
              }}
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
          Enviar link para meu e-mail
        </Button>
        <Button
          data-test="cancel"
          className="w-full"
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancelar
        </Button>
      </CardFooter>
      <ModalConfirm
        open={modalShowConfirm}
        onClose={() => {
          setModalShowConfirm(false)
          router.push('/login')
        }}
        text={
          'Se esse email estiver cadastrado no sistema, enviaremos um link para a redefinição de senha.'
        }
      />
    </form>
  )
}
