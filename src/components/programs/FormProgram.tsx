'use client'
import { useIsMounted } from '@/hooks/useIsMounted'
import { IProgram, createProgram, editProgram, toggleActiveProgram } from '@/services/programs'
import { zodResolver } from '@hookform/resolvers/zod'
import { Grid, TextField } from '@mui/material'
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
  program: IProgram | null
  edit: boolean
}

const userSchema = z.object({
  name: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  abbreviation: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  director: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
  description: z
    .string({ required_error: 'Campo Obrigatório' })
    .nonempty({ message: 'Campo Obrigatório' }),
})
// extracting the type
type Program = z.infer<typeof userSchema>

export default function FormProgram({ program, edit }: Props) {
  useIsMounted()
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalQuestionSubmit, setShowModalQuestionSubmit] = useState(false)
  const [showModalAlert, setShowModalAlert] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [file, setFile] = useState<File>()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<Program>({
    defaultValues: {
      name: program?.name,
      abbreviation: program?.abbreviation,
      director: program?.director,
      description: program?.description,
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<Program> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    let response
    try {
      program
        ? (response = await editProgram(program?.id, { ...data, file }))
        : (response = await createProgram({ ...data, file }))
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

      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.refetchQueries({ queryKey: ['programOptions'] })
      queryClient.invalidateQueries({ queryKey: ['program_id'] })
    }

    setShowModalQuestionSubmit(false)
    setShowModalConfirm(true)
  }

  const handleChangeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setFile(e.target.files[0])
  }

  const handleToggleActive = async () => {
    setIsDisabled(true)
    let response
    try {
      response = await toggleActiveProgram(program?.id)
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
      queryClient.invalidateQueries({ queryKey: ['programs'] })
      queryClient.refetchQueries({ queryKey: ['programOptions'] })
      queryClient.invalidateQueries({ queryKey: ['program_id'] })
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
                <InputFile
                  label="Logo do Programa"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChangeFile(e)}
                  acceptFile=".png, .jpeg, .jpg"
                  initialValue={program?.logo}
                  error={null}
                  disabled={!edit}
                />
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
                      label="Nome do Programa"
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
                  name="abbreviation"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="abbreviation"
                      className="mb-6"
                      label="Sigla"
                      error={!!errors.abbreviation}
                      size="small"
                      helperText={errors.abbreviation ? errors.abbreviation?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={3}>
                <Controller
                  name="director"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="director"
                      className="mb-6"
                      label="Diretor"
                      error={!!errors.director}
                      size="small"
                      helperText={errors.director ? errors.director?.message : ''}
                      fullWidth
                      disabled={!edit}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={6}>
                <Controller
                  name="description"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="description"
                      minRows={3}
                      maxRows={3}
                      multiline
                      inputProps={{ maxLength: 300 }}
                      placeholder="Digite aqui ..."
                      className="mb-6"
                      label="Características Gerais"
                      error={!!errors.description}
                      size="small"
                      helperText={errors.description ? errors.description?.message : ''}
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
              {edit && program && (
                <Button
                  data-test="active"
                  variant={program.active ? 'destructive' : 'erpPrimary'}
                  onClick={() => setShowModalAlert(true)}
                  type="button"
                  disabled={isDisabled}
                >
                  {program?.active ? 'Desativar' : 'Ativar'}
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
                  type="button"
                  disabled={isDisabled}
                  onClick={() => setShowModalQuestionSubmit(true)}
                >
                  {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {program ? 'Salvar' : 'Adicionar'}
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
                  onClick={() => router.push(`/programas/editar/${program?.id}`)}
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
          success ? `Programa ${program ? 'editado' : 'adicionado'}  com sucesso!` : errorMessage
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
      <ModalQuestion
        open={showModalQuestionSubmit}
        onConfirm={() => {
          setShowModalQuestionSubmit(false)
          handleSubmit(onSubmit)()
        }}
        onClose={() => {
          setShowModalQuestionSubmit(false)
        }}
        text={`Atenção! Você está prestes a ${
          program ? 'alterar esse' : 'adicionar um novo'
        } programa. Tem certeza que deseja continuar?`}
        textConfirm="Sim, desejo continuar"
        textCancel="Cancelar"
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
          program?.active ? 'desativando' : 'ativando'
        } este programa. Tem certeza que deseja continuar?`}
        textConfirm="Sim, tenho certeza"
        textCancel={program?.active ? 'Não desativar' : 'Não ativar'}
      />
    </div>
  )
}
