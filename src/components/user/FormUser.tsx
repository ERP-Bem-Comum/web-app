'use client'

import { IUser, createUser, editUser, toggleActiveUser } from '@/services/user'
import { maskCPF, maskPhone } from '@/utils/masks'
import { isValidCPF } from '@/utils/validateCpf'
import { zodResolver } from '@hookform/resolvers/zod'
import { Checkbox, FormControlLabel, Grid, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import InputFile from '../InputFile'
import { ModalAlert } from '../modals/ModalAlert'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from '../ui/card'

interface Props {
  user: IUser | null
  edit: boolean
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
  massApprovalPermission: z.boolean().optional(),
})
// extracting the type
type User = z.infer<typeof userSchema>

export default function FormUser({ user, edit }: Props) {
  // useIsMounted()
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [file, setFile] = useState<File>()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<User>({
    defaultValues: {
      name: user?.name,
      cpf: user?.cpf ? maskCPF(user?.cpf) : '',
      email: user?.email,
      telephone: user?.telephone ? maskPhone(user?.telephone) : '',
      massApprovalPermission: user?.massApprovalPermission || false,
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<User> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    const submitData = {
      ...data,
      file,
      massApprovalPermission: Boolean(data.massApprovalPermission),
    }

    let response
    try {
      user
        ? (response = await editUser(user?.id, submitData))
        : (response = await createUser(submitData))
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
    }

    setShowModalConfirm(true)
  }

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0])
  }

  const handleToggleActive = async () => {
    setIsDisabled(true)
    let response
    try {
      response = await toggleActiveUser(user?.id)
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
      setShowModalAlert(false)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user_id'] })
    }

    setShowModalConfirm(true)
  }

  return (
    <div className="">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-8">
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="name"
                      className="mb-6"
                      label="Nome"
                      error={!!errors.name}
                      size="small"
                      helperText={errors.name ? errors.name?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
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
                      className="mb-6"
                      label="CPF"
                      error={!!errors.cpf}
                      size="small"
                      helperText={errors.cpf ? errors.cpf?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="email"
                      className="mb-6"
                      label="Email"
                      error={!!errors.email}
                      size="small"
                      helperText={errors.email ? errors.email?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="telephone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="telephone"
                      value={maskPhone(field.value)}
                      inputProps={{ maxLength: 14 }}
                      className="mb-6"
                      label="Telefone"
                      error={!!errors.telephone}
                      size="small"
                      helperText={errors.telephone ? errors.telephone?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <InputFile
                  label="Foto de Perfil"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeFile(e)}
                  acceptFile=".png, .jpeg, .jpg"
                  initialValue={user?.imageUrl}
                  error={null}
                  disabled={!edit}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="massApprovalPermission"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Checkbox
                          {...field}
                          checked={field.value || false}
                          onChange={(e) => field.onChange(e.target.checked)}
                          disabled={!edit}
                        />
                      }
                      label="Aprovador em Massa"
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
          <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
            <div>
              {edit && user && (
                <Button
                  data-test="active"
                  variant={user.active ? 'destructive' : 'erpPrimary'}
                  onClick={() => setShowModalAlert(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  {user?.active ? 'Desativar' : 'Ativar'}
                </Button>
              )}
            </div>
            {edit ? (
              <div>
                <Button
                  data-test="cancel"
                  variant="erpSecondary"
                  className="mr-4"
                  onClick={() => setShowModalQuestion(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  Cancelar
                </Button>
                <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {user ? 'Salvar' : 'Adicionar'}
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  data-test="cancel"
                  variant="erpSecondary"
                  className="mr-4"
                  onClick={() => router.back()}
                  type="button"
                  disabled={isDisabled}
                >
                  Voltar
                </Button>
                <Button
                  data-test="edit"
                  variant="erpPrimary"
                  type="button"
                  disabled={isDisabled}
                  onClick={() => router.push(`/usuarios/editar/${user?.id}`)}
                >
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Editar
                </Button>
              </div>
            )}
          </CardFooter>
        </form>
      </Card>
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          success && router.back()
        }}
        text={success ? `Usuário ${user ? 'editado' : 'adicionado'}  com sucesso!` : errorMessage}
        success={success}
      />
      <ModalQuestion
        open={showModalQuestion}
        onConfirm={() => {
          router.back()
        }}
        onClose={() => {
          setShowModalQuestion(false)
        }}
        text={'Ao confirmar essa opção todas as suas alterações serão perdidas.'}
        textConfirm="Sim, Descartar alterações"
        textCancel="Não Descartar alterações"
      />
      <ModalAlert
        open={showModalAlert}
        onConfirm={() => {
          handleToggleActive()
        }}
        onClose={() => {
          setShowModalAlert(false)
        }}
        text={`Você está ${
          user?.active ? 'desativando' : 'ativando'
        } este usuário. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={user?.active ? 'Não desativar' : 'Não ativar'}
      />
    </div>
  )
}
