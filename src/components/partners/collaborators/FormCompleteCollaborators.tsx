'use client'
import { ModalDisabledCollaborator } from '@/components/modals/ModalDisableCollaborator'
import { useIsMounted } from '@/hooks/useIsMounted'
import {
  ICollaborator,
  createCompleteCollaborator,
  editCollaborator,
  toggleActiveCollaborator,
} from '@/services/collaborator'
import {
  educationList,
  foodCategory,
  genderList,
  programList,
  raceList,
  roleList,
} from '@/utils/enums'
import { maskCPF, maskPhone } from '@/utils/masks'
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
import { Fragment, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalAlert } from '../../modals/ModalAlert'
import { ModalConfirm } from '../../modals/ModalConfirm'
import { ModalQuestion } from '../../modals/ModalQuestion'
import { Button } from '../../ui/button'
import { Card, CardContent, CardFooter } from '../../ui/card'

interface Props {
  collaborator: ICollaborator | null
  first: boolean
  edit: boolean
}

const collaboratorSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  email: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .email({ message: 'Email inválido' }),
  occupationArea: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' })
    .nullable(),
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
  rg: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  completeAddress: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  dateOfBirth: z.date({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Data inválida',
  }),
  telephone: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .min(14, 'Telefone com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .transform((telephone) => telephone.replace(/\D/g, '')),
  emergencyContactName: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  emergencyContactTelephone: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .min(14, 'Telefone com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .transform((emergencyContactTelephone) => emergencyContactTelephone.replace(/\D/g, '')),
  genderIdentity: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  race: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  allergies: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  foodCategory: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  education: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  experienceInThePublicSector: z.boolean({
    required_error: 'Campo Obrigatório',
    invalid_type_error: 'Campo Obrigatório',
  }),
  biography: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Collaborator = z.infer<typeof collaboratorSchema>

export default function FormCompleteCollaborators({ collaborator, first, edit }: Props) {
  useIsMounted()
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [showModalAlertDisable, setShowModalAlertDisable] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [disableBy, setDisableBy] = useState(null)
  const [role, setRole] = useState<string | null>(collaborator?.role || null)
  const [haveAllergies, setHaveAllergies] = useState(
    collaborator?.allergies !== 'Não' ? 'Sim' : 'Não',
  )
  const [selectedPublicSector, setSelectedPublicSector] = useState<string>(
    collaborator?.experienceInThePublicSector ? 'Sim' : 'Não',
  )

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
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
      rg: collaborator?.rg,
      completeAddress: collaborator?.completeAddress,
      dateOfBirth: collaborator?.dateOfBirth
        ? handleDates(collaborator?.dateOfBirth)
        : collaborator?.dateOfBirth,
      telephone: collaborator?.telephone
        ? maskPhone(collaborator?.telephone)
        : collaborator?.telephone,
      emergencyContactName: collaborator?.emergencyContactName,
      emergencyContactTelephone: collaborator?.emergencyContactTelephone
        ? maskPhone(collaborator?.emergencyContactTelephone)
        : collaborator?.emergencyContactTelephone,
      genderIdentity: collaborator?.genderIdentity,
      race: collaborator?.race,
      allergies: collaborator?.allergies,
      foodCategory: collaborator?.foodCategory,
      education: collaborator?.education,
      experienceInThePublicSector: collaborator?.experienceInThePublicSector || false,
      biography: collaborator?.biography,
    },
    resolver: zodResolver(collaboratorSchema),
  })

  const onSubmit: SubmitHandler<Collaborator> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      first
        ? (response = await createCompleteCollaborator(collaborator?.id, data))
        : collaborator && (response = await editCollaborator(collaborator?.id, data))
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

  const handleToggleActive = async () => {
    setIsDisabled(true)

    const data = {
      disableBy,
    }
    let response
    try {
      response = await toggleActiveCollaborator(collaborator?.id, data)
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
      queryClient.refetchQueries({ queryKey: ['collaboratorsOptions'] })
      queryClient.invalidateQueries({ queryKey: ['collaborator_id'] })
    }
    setShowModalAlert(false)
    setShowModalConfirm(true)
  }

  const getDisabledRole = () => {
    if (first) return true
    if (edit && watch('occupationArea')) {
      return false
    }
    return true
  }

  const getDisabledAllergie = () => {
    if (edit && haveAllergies === 'Sim') {
      return false
    }
    return true
  }

  return (
    <div className="">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-8">
            <div className="mb-5">Dados pré-preenchidos pela ABC:</div>
            <Grid container spacing={2} className="mb-8 pb-4 border-b border-[#C4DADF]">
              <Grid item xs={3}>
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
                      sx={{
                        '& .MuiInputBase-input.Mui-disabled': {
                          WebkitTextFillColor: '#9C9C9C',
                        },
                      }}
                      disabled={first ? true : !edit}
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
                      disabled={first ? true : !edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
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
                        field.onChange(newValue)
                        setValue('role', '')
                        setRole('')
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
                      disabled={first ? true : !edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
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
                          // size="small"
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
              <Grid item xs={3}>
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
                        disabled={first ? true : !edit}
                      />
                    </LocalizationProvider>
                  )}
                />
              </Grid>
              <Grid item xs={3}>
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
                      disabled={first ? true : !edit}
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
                      disabled={first ? true : !edit}
                    />
                  )}
                />
              </Grid>
            </Grid>
            <div className="mt-8 mb-5">Complete seu cadastro:</div>
            <Grid container spacing={2}>
              <Grid item xs={3}>
                <Controller
                  name="rg"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="rg"
                      className="mb-6"
                      label="RG"
                      error={!!errors.rg}
                      size="small"
                      helperText={errors.rg ? errors.rg?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="completeAddress"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="completeAddress"
                      className="mb-6"
                      label="Endereço completo"
                      inputProps={{ maxLength: 100 }}
                      error={!!errors.completeAddress}
                      size="small"
                      helperText={errors.completeAddress ? errors.completeAddress?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={brLocale}>
                      <DatePicker
                        {...field}
                        label={'Data de nascimento'}
                        openTo="year"
                        views={['year', 'month', 'day']}
                        sx={{
                          backgroundColor: '#fff',
                          width: '100%',
                        }}
                        slotProps={{
                          textField: {
                            id: 'dateOfBirth',
                            size: 'small',
                            error: !!errors.dateOfBirth,
                            helperText: errors.dateOfBirth?.message
                              ? errors.dateOfBirth?.message === 'Invalid date'
                                ? 'Data inválida'
                                : errors.dateOfBirth.message
                              : '',
                          },
                        }}
                        disabled={!edit}
                      />
                    </LocalizationProvider>
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
                      label="Celular"
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
                <Controller
                  name="emergencyContactName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="emergencyContactName"
                      className="mb-6"
                      label="Nome contato de emergência"
                      inputProps={{ maxLength: 40 }}
                      error={!!errors.emergencyContactName}
                      size="small"
                      helperText={
                        errors.emergencyContactName ? errors.emergencyContactName?.message : ''
                      }
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="emergencyContactTelephone"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="emergencyContactTelephone"
                      value={maskPhone(field.value)}
                      inputProps={{ maxLength: 14 }}
                      className="mb-6"
                      label="Número contato de emergência"
                      error={!!errors.emergencyContactTelephone}
                      size="small"
                      helperText={
                        errors.emergencyContactTelephone
                          ? errors.emergencyContactTelephone?.message
                          : ''
                      }
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="genderIdentity"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="genderIdentity"
                      size="small"
                      noOptionsText="Identidade de gênero"
                      value={field.value}
                      options={Object.keys(genderList)}
                      getOptionLabel={(options) => genderList[options]}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Identidade de gênero"
                          error={!!errors.genderIdentity}
                          helperText={errors.genderIdentity ? errors.genderIdentity?.message : ''}
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="race"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="race"
                      size="small"
                      noOptionsText="Raça/Cor"
                      value={field.value}
                      options={Object.keys(raceList)}
                      getOptionLabel={(options) => raceList[options]}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Raça/Cor"
                          error={!!errors.race}
                          helperText={errors.race ? errors.race?.message : ''}
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Autocomplete
                  id="haveAllergies"
                  size="small"
                  noOptionsText="Possui Alergia"
                  value={haveAllergies}
                  disableClearable
                  options={['Sim', 'Não']}
                  onChange={(_event, newValue) => {
                    setHaveAllergies(newValue)
                    if (newValue === 'Não') {
                      setValue('allergies', 'Não', { shouldValidate: true })
                    } else {
                      setValue('allergies', '')
                    }
                  }}
                  renderInput={(params) => (
                    <TextField
                      // size="small"
                      {...params}
                      label="Possui Alergia"
                      InputLabelProps={{
                        shrink: !!haveAllergies,
                      }}
                    />
                  )}
                  disabled={!edit}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="allergies"
                      className="mb-6"
                      label="Alergias"
                      inputProps={{ maxLength: 150 }}
                      InputLabelProps={{
                        shrink: !!field.value,
                      }}
                      error={!!errors.allergies}
                      size="small"
                      helperText={errors.allergies ? errors.allergies?.message : ''}
                      fullWidth
                      disabled={getDisabledAllergie()}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="foodCategory"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="foodCategory"
                      size="small"
                      noOptionsText="Categoria alimentar"
                      value={field.value}
                      options={Object.keys(foodCategory)}
                      getOptionLabel={(option) => foodCategory[option]}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Categoria alimentar"
                          error={!!errors.foodCategory}
                          helperText={errors.foodCategory ? errors.foodCategory?.message : ''}
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="education"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="education"
                      size="small"
                      noOptionsText="Escolaridade"
                      value={field.value}
                      options={Object.keys(educationList)}
                      getOptionLabel={(options) => educationList[options]}
                      onChange={(_event, newValue) => {
                        field.onChange(newValue)
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Escolaridade"
                          error={!!errors.education}
                          helperText={errors.education ? errors.education?.message : ''}
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="experienceInThePublicSector"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      id="experienceInThePublicSector"
                      size="small"
                      noOptionsText="Experiência no setor público"
                      value={selectedPublicSector}
                      options={['Sim', 'Não']}
                      disableClearable
                      onChange={(_event, newValue) => {
                        setSelectedPublicSector(newValue)
                        field.onChange(newValue === 'Sim')
                      }}
                      renderInput={(params) => (
                        <TextField
                          // size="small"
                          {...params}
                          label="Experiência no setor público"
                          error={!!errors.experienceInThePublicSector}
                          helperText={
                            errors.experienceInThePublicSector
                              ? errors.experienceInThePublicSector?.message
                              : ''
                          }
                        />
                      )}
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <Controller
                  name="biography"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="biography"
                      minRows={5}
                      maxRows={5}
                      multiline
                      inputProps={{ maxLength: 500 }}
                      placeholder="Digite aqui ..."
                      className="mb-6 mt-6"
                      label="Mini biografia (máx. 500 caracteres)"
                      error={!!errors.biography}
                      size="small"
                      helperText={errors.biography ? errors.biography?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
          <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
            {first ? (
              <div className="flex justify-between items-center w-full">
                <div></div>
                <div>
                  <Button
                    data-test="submit"
                    variant="erpPrimary"
                    type="submit"
                    disabled={isDisabled}
                  >
                    {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <Fragment>
                <div>
                  {edit && collaborator && (
                    <Button
                      data-test="active"
                      variant={collaborator.active ? 'destructive' : 'erpPrimary'}
                      onClick={() =>
                        collaborator.active
                          ? setShowModalAlertDisable(true)
                          : setShowModalAlert(true)
                      }
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
                    <Button
                      data-test="submit"
                      variant="erpPrimary"
                      type="submit"
                      disabled={isDisabled}
                    >
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
              </Fragment>
            )}
          </CardFooter>
        </form>
      </Card>
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
          success && first ? router.push('/colaboradores/finalizado') : router.back()
        }}
        text={
          first && success
            ? 'Obrigado por completar seu cadastro!'
            : success
              ? `Colaborador editado com sucesso!`
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
      <ModalDisabledCollaborator
        open={showModalAlertDisable}
        onConfirm={() => {
          handleToggleActive()
        }}
        onClose={() => {
          setShowModalAlertDisable(false)
        }}
        disableBy={disableBy}
        setDisableBy={setDisableBy}
        textConfirm="Desativar Colaborador(a)"
        textCancel={'Cancelar'}
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
