'use client'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Fragment, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, SubmitHandler, Controller } from 'react-hook-form'
import { TextField, InputAdornment, IconButton } from '@mui/material'
import { MdCheckCircleOutline, MdHighlightOff } from 'react-icons/md'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { useRouter } from 'next/navigation'
import { useIsMounted } from '@/hooks/useIsMounted'
import { verifyPassword } from '@/utils/verifyPassword'
import { z } from 'zod'
import { newPasswordRequest } from '@/services/login'
import { ModalConfirm } from '@/components/modals/ModalConfirm'
import { Loader2 } from 'lucide-react'

type Props = {
  token?: string
}

const loginSchema = z
  .object({
    password: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' })
      .refine((val) => verifyPassword(val, null), 'Senha inválida'),
    confirmPassword: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
  })
  .refine((obj) => obj.password === obj.confirmPassword, {
    message: 'As senhas não estão iguais!',
    path: ['confirmPassword'],
  })
// extracting the type
type NewPassword = z.infer<typeof loginSchema>

export default function FormNewPassword({ token }: Props) {
  useIsMounted()

  const [showPassword, setShowPassword] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const router = useRouter()

  const [checkPassword, setCheckPassword] = useState([false, false, false, false, false])

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewPassword>({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(loginSchema),
  })

  const onSubmit: SubmitHandler<NewPassword> = async (data) => {
    setIsDisabled(true)

    let response = null
    try {
      response = await newPasswordRequest(token, data.password)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.data.message) {
      setSuccess(false)
      setErrorMessage(response?.data.message)
    } else {
      setSuccess(true)
    }

    setShowModalConfirm(true)
  }

  const handleChangePassword = (newValue: string) => {
    setValue('password', newValue, { shouldValidate: true })
    verifyPassword(newValue, setCheckPassword)
  }

  const handleChangeConfirmPassword = (newValue: string) => {
    setValue('confirmPassword', newValue, { shouldValidate: true })
  }

  return (
    <Fragment>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="p-0 pb-8">
          <Controller
            data-test="password"
            name="password"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  handleChangePassword(e.target.value)
                }}
                id="password"
                sx={{ marginBottom: '24px' }}
                label="Nova Senha"
                type={showPassword ? 'text' : 'password'}
                error={!!errors.password}
                size="small"
                helperText={errors.password ? errors.password?.message : ''}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment className="m-0" position="end">
                      <IconButton
                        data-test="visibility"
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible className="text-erp-secondary" />
                        ) : (
                          <AiOutlineEye className="text-erp-secondary" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            data-test="confirmPassword"
            name="confirmPassword"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => handleChangeConfirmPassword(e.target.value)}
                id="confirmPassword"
                label="Confirmar Nova Senha"
                type={showPassword ? 'text' : 'password'}
                error={!!errors.confirmPassword}
                size="small"
                helperText={errors.confirmPassword ? errors.confirmPassword?.message : ''}
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment className="m-0" position="end">
                      <IconButton
                        data-test="visibility2"
                        aria-label="toggle password visibility"
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? (
                          <AiOutlineEyeInvisible className="text-erp-secondary" />
                        ) : (
                          <AiOutlineEye className="text-erp-secondary" />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <div className="mt-6 mb-6">
            <div className="text-start text-sm">Sua senha precisa de:</div>
            <div className="text-start flex items-center mt-2 text-sm">
              {checkPassword[0] ? (
                <MdCheckCircleOutline color={'#64BC47'} size={18} className="mr-1" />
              ) : (
                <MdHighlightOff color={'#FF6868'} size={18} className="mr-1" />
              )}
              No mínimo 8 e no máximo 15 caracteres
            </div>
            <div className="text-start flex items-center mt-2 text-sm">
              {checkPassword[1] ? (
                <MdCheckCircleOutline color={'#64BC47'} size={18} className="mr-1" />
              ) : (
                <MdHighlightOff color={'#FF6868'} size={18} className="mr-1" />
              )}{' '}
              Uma letra maiúscula
            </div>
            <div className="text-start flex items-center mt-2 text-sm">
              {checkPassword[2] ? (
                <MdCheckCircleOutline color={'#64BC47'} size={18} className="mr-1" />
              ) : (
                <MdHighlightOff color={'#FF6868'} size={18} className="mr-1" />
              )}{' '}
              Uma letra minúscula
            </div>
            <div className="text-start flex items-center mt-2 text-sm">
              {checkPassword[3] ? (
                <MdCheckCircleOutline color={'#64BC47'} size={18} className="mr-1" />
              ) : (
                <MdHighlightOff color={'#FF6868'} size={18} className="mr-1" />
              )}{' '}
              Um número
            </div>
            <div className="text-start flex items-center mt-2 text-sm">
              {checkPassword[4] ? (
                <MdCheckCircleOutline color={'#64BC47'} size={18} className="mr-1" />
              ) : (
                <MdHighlightOff color={'#FF6868'} size={18} className="mr-1" />
              )}{' '}
              Um símbolo especial como @ ^ ~ #
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col pb-0">
          <Button
            data-test="submit"
            className="w-full"
            type="submit"
            variant="erpPrimary"
            disabled={isDisabled}
          >
            {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar
          </Button>
        </CardFooter>
      </form>
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          router.replace('/login')
        }}
        text={
          success ? 'Nova senha criada com sucesso! Agora você pode fazer o login.' : errorMessage
        }
        success={success}
      />
    </Fragment>
  )
}
