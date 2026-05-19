import { Button } from '@/components/ui/button'
import { changePassword } from '@/services/user'
import { Box, IconButton, InputAdornment, Modal, TextField } from '@mui/material'
import { MdCheckCircleOutline, MdHighlightOff, MdOutlineClose } from 'react-icons/md'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { useState } from 'react'
import { z } from 'zod'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Loader2 } from 'lucide-react'
import { AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai'
import { verifyPassword } from '@/utils/verifyPassword'
import { ModalQuestionNewPassword } from '../modals/ModalQuestionNewPassword'
import { signOut } from 'next-auth/react'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
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
    currentPassword: z
      .string({ required_error: 'Campo Obrigatório' })
      .nonempty({ message: 'Campo Obrigatório' }),
  })
  .refine((obj) => obj.password === obj.confirmPassword, {
    message: 'As senhas não estão iguais!',
    path: ['confirmPassword'],
  })
// extracting the type
type NewPassword = z.infer<typeof loginSchema>

export function ModalNewPassword({ open, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalConfirmError, setShowModalConfirmError] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const [checkPassword, setCheckPassword] = useState([false, false, false, false, false])

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<NewPassword>({
    defaultValues: {
      password: '',
      confirmPassword: '',
      currentPassword: '',
    },
    resolver: zodResolver(loginSchema),
  })

  const onSubmit: SubmitHandler<NewPassword> = async (data) => {
    setIsDisabled(true)

    const newData = {
      password: data.password,
      currentPassword: data.currentPassword,
    }

    let response = null
    try {
      response = await changePassword(newData)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setErrorMessage(response?.message)
      setShowModalConfirmError(true)
    } else {
      setShowModalConfirm(true)
    }

    reset()
    setCheckPassword([false, false, false, false, false])
  }

  const handleChangePassword = (newValue: string) => {
    setValue('password', newValue, { shouldValidate: true })
    verifyPassword(newValue, setCheckPassword)
  }

  const handleClose = () => {
    reset()
    setCheckPassword([false, false, false, false, false])
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
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 p-0">
            <div className="text-xl">Redefinir Senha</div>
            <Button
              variant="ghost"
              size="none"
              data-test="close"
              onClick={handleClose}
              className="!mt-0"
            >
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="p-0 pb-8">
              <Controller
                name="currentPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="currentPassword"
                    sx={{ marginBottom: '24px' }}
                    label="Senha Atual"
                    type={showCurrentPassword ? 'text' : 'password'}
                    error={!!errors.currentPassword}
                    size="small"
                    helperText={errors.currentPassword ? errors.currentPassword?.message : ''}
                    fullWidth
                    InputProps={{
                      endAdornment: (
                        <InputAdornment className="m-0" position="end">
                          <IconButton
                            data-test="visibility"
                            aria-label="toggle password visibility"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            edge="end"
                          >
                            {showCurrentPassword ? (
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
                name="password"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="password"
                    onChange={(e) => {
                      handleChangePassword(e.target.value)
                    }}
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
                name="confirmPassword"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    id="confirmPassword"
                    label="Confirmar Nova Senha"
                    type={showConfirmPassword ? 'text' : 'password'}
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
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            edge="end"
                          >
                            {showConfirmPassword ? (
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
                className="w-full mb-4"
                type="submit"
                variant="erpPrimary"
                disabled={isDisabled}
              >
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
              <Button
                data-test="cancel"
                className="w-full"
                type="button"
                variant="erpSecondary"
                disabled={isDisabled}
                onClick={handleClose}
              >
                Cancelar
              </Button>
            </CardFooter>
          </form>
          <ModalConfirm
            open={showModalConfirmError}
            onClose={() => {
              setShowModalConfirmError(false)
            }}
            text={errorMessage}
            success={false}
          />
          <ModalQuestionNewPassword
            open={showModalConfirm}
            onConfirm={() => signOut()}
            onClose={() => {
              setShowModalConfirm(false)
              onClose()
            }}
            text={'Nova senha redefinida com sucesso! \n Deseja sair e logar novamente no sistema?'}
            success={true}
            textConfirm="Sim"
            textCancel="Não"
          />
        </Card>
      </Box>
    </Modal>
  )
}
