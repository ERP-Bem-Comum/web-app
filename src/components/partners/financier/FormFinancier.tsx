'use client'
import {
  IFinancier,
  createFinancier,
  editFinancier,
  toggleActiveFinancier,
} from '@/services/financier'
import { maskCNPJ, maskPhone } from '@/utils/masks'
import { isValidCNPJ } from '@/utils/validateCnpj'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { ModalAlert } from '../../modals/ModalAlert'
import { ModalConfirm } from '../../modals/ModalConfirm'
import { ModalQuestion } from '../../modals/ModalQuestion'
import { Button } from '../../ui/button'
import { Card, CardContent, CardFooter } from '../../ui/card'

interface Props {
  financier: IFinancier | null
  edit: boolean
}

const financierSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  corporateName: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  cnpj: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(18, 'CNPJ com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' })
    .refine((val) => isValidCNPJ(val), 'CNPJ inválido')
    .transform((cnpj) => cnpj.replace(/\D/g, '')),
  telephone: z
    .string({ required_error: 'Campo Obrigatório' })
    .min(14, 'Telefone com formato inválido')
    .nonempty({ message: 'Campo Obrigatório' }),
  legalRepresentative: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  address: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Financier = z.infer<typeof financierSchema>

export default function FormFinancier({ financier, edit }: Props) {
  // useIsMounted()
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Financier>({
    defaultValues: {
      name: financier?.name,
      corporateName: financier?.corporateName,
      cnpj: financier?.cnpj ? maskCNPJ(financier?.cnpj) : '',
      telephone: financier?.telephone ? maskPhone(financier?.telephone) : '',
      legalRepresentative: financier?.legalRepresentative,
      address: financier?.address,
    },
    resolver: zodResolver(financierSchema),
  })

  const onSubmit: SubmitHandler<Financier> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      financier
        ? (response = await editFinancier(financier?.id, data))
        : (response = await createFinancier(data))
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

      queryClient.invalidateQueries({ queryKey: ['financiers'] })
      queryClient.invalidateQueries({ queryKey: ['financier_id'] })
    }

    setShowModalConfirm(true)
  }

  const handleToggleActive = async () => {
    setIsDisabled(true)
    let response
    try {
      response = await toggleActiveFinancier(financier?.id)
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
      queryClient.invalidateQueries({ queryKey: ['financiers'] })
      queryClient.invalidateQueries({ queryKey: ['financier_id'] })
      queryClient.invalidateQueries({ queryKey: ['financierOptions'] })
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
              <Grid item xs={3}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="name"
                      className="mb-6"
                      label="Nome do Financiador"
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
                <Controller
                  name="legalRepresentative"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="legalRepresentative"
                      className="mb-6"
                      label="Representante Legal"
                      inputProps={{ maxLength: 40 }}
                      error={!!errors.legalRepresentative}
                      size="small"
                      helperText={
                        errors.legalRepresentative ? errors.legalRepresentative?.message : ''
                      }
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={9}>
                <Controller
                  name="address"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="address"
                      className="mb-6"
                      label="Endereço"
                      inputProps={{ maxLength: 100 }}
                      error={!!errors.address}
                      size="small"
                      helperText={errors.address ? errors.address?.message : ''}
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
              {edit && financier && (
                <Button
                  data-test="active"
                  variant={financier.active ? 'destructive' : 'erpPrimary'}
                  onClick={() => setShowModalAlert(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  {financier?.active ? 'Desativar' : 'Ativar'}
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
                  {financier ? 'Salvar' : 'Adicionar'}
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
                  onClick={() => router.push(`/financiadores/editar/${financier?.id}`)}
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
            ? `Financiador ${financier ? 'editado' : 'adicionado'}  com sucesso!`
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
        text={`Você está prestes a ${
          financier?.active ? 'desativar' : 'ativar'
        } o financiador ${financier?.name}. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={financier?.active ? 'Não desativar' : 'Não ativar'}
      />
    </div>
  )
}
