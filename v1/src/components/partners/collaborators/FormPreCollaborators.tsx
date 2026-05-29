'use client'
import { useIsMounted } from '@/hooks/useIsMounted'
import {
  ICollaborator,
  createCollaborator,
  editCollaborator,
  toggleActiveCollaborator,
} from '@/services/collaborator'
import { programList, roleList } from '@/utils/enums'
import { maskCPF } from '@/utils/masks'
import { isValidCPF } from '@/utils/validateCpf'
import { handleDates } from '@/utils/dates'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, Grid, TextField } from '@mui/material'
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { ptBR as brLocale } from 'date-fns/locale'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod/v3'
import { ModalAlert } from '../../modals/ModalAlert'
import { ModalConfirm } from '../../modals/ModalConfirm'
import { ModalQuestion } from '../../modals/ModalQuestion'
import { Button } from '../../ui/button'
import { Card, CardContent, CardFooter } from '../../ui/card'

interface Props {
  collaborator: ICollaborator | null
  edit: boolean
}

const userSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  email: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .email({ message: 'Email inválido' }),
  occupationArea: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  role: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  startOfContract: z.date({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Data inválida',
  }),
  employmentRelationship: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .nullable(),
  cpf: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(14, 'CPF com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .refine((val) => isValidCPF(val), 'CPF inválido')
    .transform((cpf) => cpf.replace(/\D/g, '')),
})
// extracting the type
type Collaborator = z.infer<typeof userSchema>

export default function FormPreCollaborator({ collaborator, edit }: Props) {
  useIsMounted()
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [role, setRole] = useState<string | null>(collaborator?.role || null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Collaborator>({
    defaultValues: {
      name: collaborator?.name,
      email: collaborator?.email,
      occupationArea: collaborator?.occupationArea,
      role: collaborator?.role,
      startOfContract: collaborator?.startOfContract
        ? handleDates(collaborator?.startOfContract)
        : collaborator?.startOfContract,
      employmentRelationship: collaborator?.employmentRelationship,
      cpf: collaborator?.cpf ? maskCPF(collaborator?.cpf) : collaborator?.cpf,
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<Collaborator> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      collaborator
        ? (response = await editCollaborator(collaborator?.id, data))
        : (response = await createCollaborator(data))
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

      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      queryClient.refetchQueries({ queryKey: ['collaboratorsOptions'] })
      queryClient.invalidateQueries({ queryKey: ['collaborator_id'] })
    }

    setShowModalConfirm(true)
  }

  useEffect(() => {
    reset()
  }, [collaborator, reset])

  const handleToggleActive = async () => {
    setIsDisabled(true)
    let response
    try {
      response = await toggleActiveCollaborator(collaborator?.id)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.error || response?.message) {
      setSuccess(false)
      setErrorMessage(response.error || response.message)
    } else {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['collaborators'] })
      queryClient.invalidateQueries({ queryKey: ['collaboratorsOptions'] })
      queryClient.invalidateQueries({ queryKey: ['collaborator_id'] })
    }

    setShowModalAlert(false)
    setShowModalConfirm(true)
  }

  const getDisabledRole = () => {
    if (edit && watch('occupationArea')) {
      return false
    }
    return true
  }

  const handleChangeArea = () => {
    setValue('role', '')
    setRole('')
  }

  return (
    <div className="">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-8">
            <div className="mb-5">Pré-Cadastro de colaborador(a)</div>
            <Grid container spacing={2}>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="name"
                      className="mb-6"
                      label="Representante Legal"
                      error={!!errors.name}
                      size="small"
                      helperText={errors.name ? errors.name?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  data-test="email"
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
              <Grid size={{ xs: 3 }}>
                <Controller
                  data-test="occupationArea"
                  name="occupationArea"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="occupationArea"
                      size="small"
                      noOptionsText="Área de atuação"
                      value={field.value}
                      options={programList}
                      onChange={(_event, newValue) => {
                        handleChangeArea()
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Área de atuação"
                          error={!!errors.occupationArea}
                          helperText={errors.occupationArea ? errors.occupationArea?.message : ''}
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="role"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="role"
                      size="small"
                      noOptionsText="Função"
                      value={role}
                      options={
                        watch('occupationArea') ? roleList[watch('occupationArea') || ''] : []
                      }
                      isOptionEqualToValue={(option, value) => {
                        value = watch('role')
                        return watch('role') === option
                      }}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                        setRole(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Função"
                          error={!!errors.role}
                          helperText={errors.role ? errors.role?.message : ''}
                        />
                      )}
                      disabled={getDisabledRole()}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="startOfContract"
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                      <DatePicker
                        {...field}
                        label={'Início de Contrato'}
                        openTo="year"
                        views={['year', 'month', 'day']}
                        sx={{
                          backgroundColor: '#fff',
                          width: '100%',
                        }}
                        slotProps={{
                          textField: {
                            id: 'startOfContract',
                            size: 'small',
                            error: !!errors.startOfContract,
                            helperText: errors.startOfContract?.message
                              ? errors.startOfContract?.message === 'Invalid date'
                                ? 'Data inválida'
                                : errors.startOfContract.message
                              : '',
                          },
                        }}
                        disabled={!edit}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
                <Controller
                  name="employmentRelationship"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="employmentRelationship"
                      size="small"
                      noOptionsText="Vínculo Empregatício"
                      value={field.value}
                      options={['CLT', 'PJ']}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Vínculo Empregatício"
                          error={!!errors.employmentRelationship}
                          helperText={
                            errors.employmentRelationship
                              ? errors.employmentRelationship?.message
                              : ''
                          }
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 3 }}>
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
            </Grid>
          </CardContent>
          <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
            <div>
              {edit && collaborator && (
                <Button
                  data-test="active"
                  variant={collaborator.active ? 'destructive' : 'erpPrimary'}
                  onClick={() => setShowModalAlert(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  {collaborator?.active ? 'Desativar' : 'Ativar'}
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
                  {collaborator ? 'Salvar' : 'Adicionar'}
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
                  onClick={() => router.push(`/colaboradores/editar/${collaborator?.id}`)}
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
        text={
          success
            ? collaborator
              ? `Colaborador editado com sucesso!`
              : 'Colaborador(a) pré-cadastrado, enviaremos um link ao colaborador (a) para que o cadastro seja finalizado.'
            : errorMessage
        }
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
          collaborator?.active ? 'desativando' : 'ativando'
        } este colaborador. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={collaborator?.active ? 'Não desativar' : 'Não ativar'}
      />
    </div>
  )
}
