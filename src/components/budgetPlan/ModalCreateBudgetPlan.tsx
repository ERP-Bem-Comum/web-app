import { Button } from '@/components/ui/button'
import { createBudgetPlan } from '@/services/budgetPlan'
import { IProgram, useGetPrograms } from '@/services/programs'
import { getYears } from '@/utils/dates'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, Box, FormControlLabel, Modal, Switch, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { MdOutlineClose } from 'react-icons/md'
import { z } from 'zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { useOptions } from '@/hooks/useOptions'
import { AutoComplete } from '../layout/AutoComplete'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
}

const userSchema = z.object({
  year: z.number({ required_error: 'Campo Obrigatório' }),
  programId: z
    .number({ required_error: 'Campo Obrigatório' })
    .nullable()
    .refine((programId) => programId != null, {
      message: 'Campo Obrigatório',
    }),
  yearForImport: z.number({ required_error: 'Campo Obrigatório' }).nullable().optional(),
})
// extracting the type
type User = z.infer<typeof userSchema>

export function ModalCreateBudgetPlan({ open, onClose }: Props) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [isImport, setIsImport] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [selectedProgram, setSelectedProgram] = useState<IProgram | null>(null)
  const [newId, setNewId] = useState(null)

  const {
    refetch,
    options: { Program },
  } = useOptions()

  const { data: dataPrograms, isLoading: isLoadingPrograms } = useGetPrograms({
    page: 1,
    limit: 99999999,
    search: '',
    active: 1,
  })

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<User>({
    defaultValues: {
      year: new Date().getFullYear(),
      programId: undefined,
      yearForImport: null,
    },
    resolver: zodResolver(userSchema),
  })

  const onSubmit: SubmitHandler<User> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    if (isImport && !data.yearForImport) {
      setError('yearForImport', {
        type: 'custom',
        message: 'Campo obrigatório',
      })
      setIsDisabled(false)
      return
    }

    let response
    try {
      response = await createBudgetPlan(data)
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
      setNewId(response?.id)

      queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
      queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
      refetch.refetchBudgetPlanAndNested()
    }

    setShowModalConfirm(true)
  }

  const handleClose = () => {
    setSelectedProgram(null)
    setIsImport(false)
    reset()
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
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-8 px-0">
            <div className="text-xl">Adicionar Plano Orçamentário</div>
            <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex px-0 w-full">
              <div className="w-full">
                <Controller
                  name="year"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      id="year"
                      sx={{ marginBottom: 2 }}
                      label="Ano"
                      error={!!errors.year}
                      size="small"
                      helperText={errors.year ? errors.year?.message : ''}
                      fullWidth
                      disabled
                    />
                  )}
                />
                <AutoComplete
                  control={control}
                  editable
                  label="Programa"
                  name="programId"
                  options={Program()}
                />
                <FormControlLabel
                  control={<Switch color="primary" defaultChecked={isImport} />}
                  label={isImport ? 'Importar dados' : 'Criar em branco'}
                  labelPlacement="end"
                  sx={{ marginBottom: '21px' }}
                  onChange={() => {
                    setIsImport(!isImport)
                    setValue('yearForImport', null)
                  }}
                />
                {isImport && (
                  <Controller
                    name="yearForImport"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        fullWidth
                        id="yearForImport"
                        size="small"
                        noOptionsText="Criar a partir do ano de"
                        value={field.value}
                        options={getYears(false)}
                        onChange={(_event, newValue) => {
                          field.onChange(newValue)
                        }}
                        sx={{ marginBottom: '21px' }}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Criar a partir do ano de"
                            error={!!errors.yearForImport}
                            helperText={errors.yearForImport ? errors.yearForImport?.message : ''}
                          />
                        )}
                      />
                    )}
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch py-4 px-0">
              <Button data-test="submit" variant="erpPrimary" type="submit" disabled={isDisabled}>
                {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Adicionar
              </Button>
              <Button data-test="cancel" className="mt-4" variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
            </CardFooter>
          </form>
        </Card>
        <ModalConfirm
          open={showModalConfirm}
          onClose={() => {
            setShowModalConfirm(false)
            success && router.push(`/planejamento/detalhes/${newId}`)
          }}
          text={success ? 'Plano Orçamentário criado com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
