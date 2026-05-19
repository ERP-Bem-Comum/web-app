'use client'
import { createSupplier, editSupplier, toggleActiveSupplier } from '@/services/supplier'
import { ISupplier, Supplier } from '@/types/supplier'
import { servicesList } from '@/utils/enums'
import { maskCNPJ } from '@/utils/masks'
import { supplierSchema } from '@/validators/supplier'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid, TextField } from '@mui/material'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { ModalAlert } from '../modals/ModalAlert'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalQuestion } from '../modals/ModalQuestion'
import { Button } from '../ui/button'
import { Card, CardContent, CardFooter } from '../ui/card'
import { useOptions } from '@/hooks/useOptions'
import { AutoComplete } from '../layout/AutoComplete'
import { AgencyComponent } from '../layout/AgencyComponent'
import { HttpStatusCode } from 'axios'
import { Response } from '@/types/global'
import useLoadLocalOptions from '@/hooks/useLoadLocalOptions'
import { PixData } from '../layout/pixData'

interface Props {
  supplier: ISupplier | null
  edit: boolean
}

export default function FormSupplier({ supplier, edit }: Props) {
  const router = useRouter()
  const {
    options: { bankOptions },
  } = useOptions()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    watch,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<Supplier>({
    defaultValues: {
      name: supplier?.name,
      email: supplier?.email,
      cnpj: supplier?.cnpj ? maskCNPJ(supplier?.cnpj) : '',
      corporateName: supplier?.corporateName,
      fantasyName: supplier?.fantasyName,
      serviceCategory: supplier?.serviceCategory,
      serviceEvaluation: supplier?.serviceEvaluation,
      commentEvaluation: supplier?.commentEvaluation,
      bancaryInfo: supplier?.bancaryInfo,
      pixInfo: supplier?.pixInfo,
    },
    resolver: zodResolver(supplierSchema),
  })

  const onSubmit: SubmitHandler<Supplier> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response: Response<null>
    try {
      supplier
        ? (response = await editSupplier(supplier?.id, data))
        : (response = await createSupplier(data))
      if (![HttpStatusCode.Ok, HttpStatusCode.Created].includes(response?.status ?? 500)) {
        setSuccess(false)
        setErrorMessage(response.error)
      } else {
        setSuccess(true)
      }
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    setShowModalConfirm(true)
  }

  const handleToggleActive = async () => {
    setIsDisabled(true)
    let response
    try {
      response = await toggleActiveSupplier(supplier?.id)
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
    setShowModalAlert(false)
    setShowModalConfirm(true)
  }

  return (
    <div className="">
      <Card>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="pt-8">
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <div className="text-md ml-1">Dados cadastrais do fornecedor:</div>
              </Grid>
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
                      inputProps={{ maxLength: 40 }}
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
                  name="email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="email"
                      className="mb-6"
                      label="E-mail"
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
                  name="cnpj"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="cnpj"
                      value={field.value}
                      onChange={(event) => field.onChange(maskCNPJ(event.target.value))}
                      inputProps={{ maxLength: 18 }}
                      className="mb-6"
                      label="CNPJ"
                      error={!!errors.cnpj}
                      size="small"
                      helperText={errors.cnpj ? errors.cnpj?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="corporateName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="corporateName"
                      className="mb-6"
                      label="Razão Social"
                      inputProps={{ maxLength: 40 }}
                      error={!!errors.corporateName}
                      size="small"
                      helperText={errors.corporateName ? errors.corporateName?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="fantasyName"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="fantasyName"
                      className="mb-6"
                      label="Nome Fantasia"
                      inputProps={{ maxLength: 40 }}
                      error={!!errors.fantasyName}
                      size="small"
                      helperText={errors.fantasyName ? errors.fantasyName?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <AutoComplete
                  control={control}
                  editable={edit}
                  label="Categoria de Serviço"
                  name="serviceCategory"
                  options={useLoadLocalOptions(servicesList, 'k')}
                  error={errors.serviceCategory?.message}
                />
              </Grid>
              <Grid item xs={3}>
                <AutoComplete
                  control={control}
                  editable={edit}
                  label="Avaliação De Serviço"
                  name="serviceEvaluation"
                  options={[
                    { id: 1, name: '1' },
                    { id: 2, name: '2' },
                    { id: 3, name: '3' },
                    { id: 4, name: '4' },
                    { id: 5, name: '5' },
                  ]}
                  error={errors.serviceEvaluation?.message}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="commentEvaluation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="commentEvaluation"
                      className="mb-6"
                      label="Comentário da Avaliação"
                      inputProps={{ maxLength: 200 }}
                      error={!!errors.commentEvaluation}
                      size="small"
                      helperText={errors.commentEvaluation ? errors.commentEvaluation?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <div className="text-md ml-1">Dados Bancários:</div>
              </Grid>
              <Grid item xs={3}>
                <AutoComplete
                  control={control}
                  editable={edit}
                  label="Banco"
                  name="bancaryInfo.bank"
                  options={bankOptions}
                  error={errors.bancaryInfo?.root?.message || errors?.bancaryInfo?.bank?.message}
                />
              </Grid>
              <Grid item xs={3}>
                <AgencyComponent
                  control={control}
                  editable={edit}
                  error={errors.bancaryInfo?.root?.message || errors?.bancaryInfo?.agency?.message}
                  name="bancaryInfo.agency"
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="bancaryInfo.accountNumber"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="accountNumber"
                      onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                      className="mb-6"
                      label="Número da Conta"
                      inputProps={{ maxLength: 10 }}
                      error={
                        !!errors.bancaryInfo?.root || !!errors?.bancaryInfo?.accountNumber?.message
                      }
                      size="small"
                      helperText={
                        errors.bancaryInfo?.root?.message ||
                        errors?.bancaryInfo?.accountNumber?.message
                      }
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="bancaryInfo.dv"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="dv"
                      onChange={(event) => field.onChange(event.target.value.replace(/\D/g, ''))}
                      className="mb-6"
                      label="DV"
                      inputProps={{ maxLength: 1 }}
                      error={undefined}
                      size="small"
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <div className="text-md ml-1">Dados PIX:</div>
              </Grid>
              <PixData
                control={control}
                editable={edit}
                errors={errors}
                setValue={setValue}
                values={watch('pixInfo')}
              />
            </Grid>
          </CardContent>
          <CardFooter className="border-t border-[#C4DADF] mx-4 flex justify-between py-8 px-0">
            <div>
              {edit && supplier && (
                <Button
                  data-test="active"
                  variant={supplier.active ? 'destructive' : 'erpPrimary'}
                  onClick={() => setShowModalAlert(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  {supplier?.active ? 'Desativar' : 'Ativar'}
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
                  {supplier ? 'Salvar' : 'Adicionar'}
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
                  onClick={() => router.push(`/fornecedores/editar/${supplier?.id}`)}
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
          success ? `Fornecedor ${supplier ? 'editado' : 'adicionado'}  com sucesso!` : errorMessage
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
        text={`Você está prestes a ${
          supplier?.active ? 'desativar' : 'ativar'
        } o fornecedor ${supplier?.name}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={supplier?.active ? 'Não desativar' : 'Não ativar'}
      />
    </div>
  )
}
