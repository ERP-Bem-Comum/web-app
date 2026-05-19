import { Button } from '@/components/ui/button'
import { createBudget } from '@/services/budget'
import { ICity, useGetCities } from '@/services/city'
import { IState, useGetStates } from '@/services/state'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, Box, Modal, TextField } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { MdOutlineClose } from 'react-icons/md'
import { z } from 'zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Card, CardContent, CardFooter, CardHeader } from '../ui/card'
import { useOptions } from '@/hooks/useOptions'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budgetPlan: any
  program: string
  partners: any
}

const userSchema = z.object({
  budgetPlanId: z.number().nullable(),
  partnerStateId: z.number({ required_error: 'Campo Obrigatório' }).nullable(),
  partnerMunicipalityId: z.number({ required_error: 'Campo Obrigatório' }).nullable(),
})
// extracting the type
type User = z.infer<typeof userSchema>

export function ModalAddBudget({ open, onClose, budgetPlan, program, partners }: Props) {
  const router = useRouter()
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [selectedPartnerCity, setSelectedPartnerCity] = useState<ICity>()
  const [selectedPartnerState, setSelectedPartnerState] = useState<IState>()
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [newId, setNewId] = useState(null)
  // const [filterPartners, setFilterPartners] = useState<
  //   ICity[] | IState[] | any
  // >([])

  const { data: dataCities, isLoading: isLoadingCity } = useGetCities({
    page: 1,
    limit: 99999999,
  })

  const { data: dataStates, isLoading: isLoadingStates } = useGetStates()

  const { refetch } = useOptions()

  // useEffect(() => {
  //   console.log('partners :', partners)
  //   console.log('dataCities?.items :', dataCities?.items)
  //   let list = [] as any[]
  //   if (program === 'EPV') {
  //     list = dataCities?.items
  //     partners?.forEach((partner: any) => {
  //       list = list?.filter(
  //         (city: ICity) => city.name !== partner?.partnerMunicipality?.name,
  //       )
  //     })
  //   } else {
  //     list = dataStates?.items
  //     partners?.forEach((partner: any) => {
  //       list = list?.filter(
  //         (state: IState) => state.name !== partner?.partnerState?.name,
  //       )
  //     })
  //   }

  //   console.log('list :', list)
  //   setFilterPartners(list)
  // }, [partners, dataCities?.items, dataStates?.items, program])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<User>({
    defaultValues: {
      budgetPlanId: budgetPlan?.id,
      partnerMunicipalityId: null,
      partnerStateId: null,
    },
    resolver: zodResolver(userSchema),
  })

  useEffect(() => {
    budgetPlan && setValue('budgetPlanId', budgetPlan?.id)
  }, [budgetPlan, setValue])

  const onSubmit: SubmitHandler<User> = async (data, e) => {
    e?.preventDefault()
    setIsDisabled(true)

    if (!data?.partnerMunicipalityId && !data?.partnerStateId) {
      setError('partnerMunicipalityId', {
        type: 'custom',
        message: 'Campo obrigatório',
      })
      setError('partnerStateId', {
        type: 'custom',
        message: 'Campo obrigatório',
      })
      setIsDisabled(false)
      return
    }

    let response
    try {
      response = await createBudget(data)
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
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      refetch.refetchBudgetPlanAndNested()
    }

    setShowModalConfirm(true)
  }

  const handleClose = () => {
    setSelectedPartnerCity(undefined)
    setSelectedPartnerState(undefined)
    reset()
    onClose()
    success && router.push(`/planejamento/detalhes/${budgetPlan?.id}/orcamento/${newId}`)
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
          <CardHeader className="h-16 flex flex-row items-center justify-between border-b border-erp-neutrals mb-5 px-0">
            <div className="text-xl">Adicionar Orçamento</div>
            <Button variant="ghost" size="none" data-test="close" onClick={handleClose}>
              <MdOutlineClose size={32} color={'#155366'} />
            </Button>
          </CardHeader>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CardContent className="flex px-0 w-full">
              <div className="w-full">
                {program === 'EPV' ? (
                  <Controller
                    data-test="partnerMunicipality"
                    name="partnerMunicipalityId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        id="partnerMunicipality"
                        size="small"
                        noOptionsText="Municipio"
                        value={selectedPartnerCity}
                        options={dataCities?.items as ICity[]}
                        onChange={(_event, newValue) => {
                          setSelectedPartnerCity(newValue ?? undefined)
                          field.onChange(newValue?.id)
                        }}
                        getOptionLabel={(option) => option?.name}
                        renderInput={(params) => (
                          <TextField
                            // size="small"
                            {...params}
                            label="Municipio"
                            error={!!errors.partnerMunicipalityId}
                            helperText={
                              errors.partnerMunicipalityId
                                ? errors.partnerMunicipalityId?.message
                                : ''
                            }
                          />
                        )}
                      />
                    )}
                  />
                ) : (
                  <Controller
                    data-test="partnerStateId"
                    name="partnerStateId"
                    control={control}
                    render={({ field }) => (
                      <Autocomplete
                        id="partnerStateId"
                        size="small"
                        noOptionsText="Estado"
                        value={selectedPartnerState}
                        options={dataStates?.data as IState[]}
                        onChange={(_event, newValue) => {
                          setSelectedPartnerState(newValue ?? undefined)
                          field.onChange(newValue?.id)
                        }}
                        getOptionLabel={(option) => option?.name}
                        renderInput={(params) => (
                          <TextField
                            // size="small"
                            {...params}
                            label="Estado"
                            error={!!errors.partnerStateId}
                            helperText={errors.partnerStateId ? errors.partnerStateId?.message : ''}
                          />
                        )}
                      />
                    )}
                  />
                )}
              </div>
            </CardContent>
            <CardFooter className="flex flex-col items-stretch pb-4 px-0">
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
            success && handleClose()
          }}
          text={success ? 'Orçamento adicionado com sucesso!' : errorMessage}
          success={success}
        />
      </Box>
    </Modal>
  )
}
