import { Button } from '@/components/ui/button'
import { IUser, editUser } from '@/services/user'
import { getLetters } from '@/utils/getLetters'
import { maskCPF, maskPhone } from '@/utils/masks'
import { isValidCPF } from '@/utils/validateCpf'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Modal, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fragment, useRef, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { MdOutlineClose } from 'react-icons/md'
import { z } from 'zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  user: IUser
}

const userSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  cpf: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(14, 'CPF com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .refine((val) => isValidCPF(val), 'CPF inválido')
    .transform((cpf) => cpf.replace(/\D/g, '')),
  email: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .email({ message: 'Email inválido' }),
  telephone: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(14, 'Telefone com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .transform((telephone) => telephone.replace(/\D/g, '')),
})
// extracting the type
type User = z.infer<typeof userSchema>

export function ModalEdit({ open, onClose, user }: Props) {
  const [userAvatar, setUserAvatar] = useState<any>(null)
  const [createObjectURL, setCreateObjectURL] = useState('')
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const hiddenFileInput = useRef<any>()
  const { data: session, update } = useSession()
  const router = useRouter()

  const updateSession = async (newData: User, image: string) => {
    await update({
      ...session,
      user: {
        ...session?.user,
        name: newData?.name,
        cpf: newData?.cpf,
        email: newData?.email,
        telephone: newData?.telephone,
        imageUrl: image,
      },
    })

    router.refresh()
  }

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<User>({
    defaultValues: {
      name: user?.name,
      cpf: user?.cpf ? maskCPF(user?.cpf) : '',
      email: user?.email,
      telephone: user?.telephone ? maskPhone(user?.telephone) : '',
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<User> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      response = await editUser(user?.id, { ...data, file: userAvatar })
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

      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user_id'] })

      updateSession(data, response.imageUrl)
    }

    setShowModalConfirm(true)
  }

  const uploadAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const i = event.target.files[0]
      setUserAvatar(i)
      setCreateObjectURL(URL.createObjectURL(i))
    }
  }

  const handleClickImage = () => {
    if (hiddenFileInput.current) hiddenFileInput?.current.click()
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
        <Card className="w-[724px] p-4">
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 px-0">
            <div className="text-xl">Editar Perfil</div>
            <Button variant="ghost" size="none" data-test="close" onClick={onClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex px-0">
              <div className="flex flex-col justify-center pr-4">
                {createObjectURL ? (
                  <Image
                    src={createObjectURL}
                    className="rounded-circle"
                    width={144}
                    height={152}
                    alt="avatar"
                  />
                ) : (
                  <Fragment>
                    {user.imageUrl ? (
                      <Image
                        className="rounded-xl mr-6"
                        src={`${process.env.NEXT_PUBLIC_API_URL}/users/files/${user.imageUrl}`}
                        alt="Avatar"
                        width={144}
                        height={160}
                      />
                    ) : (
                      <div className="rounded-xl h-40 w-36 bg-muted mr-6 flex items-center justify-center">
                        {getLetters(user.name)}
                      </div>
                    )}
                  </Fragment>
                )}
                <input
                  type="file"
                  ref={hiddenFileInput}
                  onChange={uploadAvatar}
                  style={{ display: 'none' }}
                  accept="image/*"
                />
                <Button
                  data-test="change-image"
                  variant="erpSecondary"
                  type="button"
                  className="mt-4 w-36"
                  onClick={handleClickImage}
                >
                  Alterar Imagem
                </Button>
              </div>
              <div>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="name"
                      sx={{ marginBottom: 2 }}
                      label="Nome"
                      error={!!errors.name}
                      size="small"
                      helperText={errors.name ? errors.name?.message : ''}
                      fullWidth
                    />
                  )}
                />
                <Controller
                  name="cpf"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="cpf"
                      value={field.value}
                      onChange={(event) => field.onChange(maskCPF(event.target.value))}
                      inputProps={{ maxLength: 14 }}
                      sx={{ marginBottom: 2 }}
                      label="CPF"
                      error={!!errors.cpf}
                      size="small"
                      helperText={errors.cpf ? errors.cpf?.message : ''}
                      fullWidth
                    />
                  )}
                />
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
                <Controller
                  name="telephone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="telephone"
                      value={maskPhone(field.value)}
                      inputProps={{ maxLength: 14 }}
                      label="Telefone"
                      error={!!errors.telephone}
                      size="small"
                      helperText={errors.telephone ? errors.telephone?.message : ''}
                      fullWidth
                    />
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="flex justify-end py-4 px-0">
              <Button data-test="cancel" className="mr-4" variant="erpSecondary" onClick={onClose}>
                Cancelar
              </Button>
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirm}
          onClose={() => {
            setShowModalConfirm(false)
            success && onClose()
          }}
          text={success ? 'Alterações realizadas com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
