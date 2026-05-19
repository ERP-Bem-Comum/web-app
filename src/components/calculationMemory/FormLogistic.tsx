import { ICreateLogistic, createLogistic } from '@/services/CalculationMemory'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth, getMonths } from '@/utils/dates'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconButton, TextField, Tooltip } from '@mui/material'
import { queryClient } from 'lib/react-query'
import { Fragment, useEffect, useState } from 'react'
import { Controller, SubmitHandler, useForm } from 'react-hook-form'
import { MdOutlineInfo } from 'react-icons/md'
import { z } from 'zod'
import { ModalConfirm } from '../modals/ModalConfirm'
import { ModalConfirmCalculationMemory } from './ModalConfirmCalculationMemory'
import { ModalEmptyHistoric } from './ModalEmptyHistoric'
import { ModalTootipCalculation } from './ModalTootipCalculation'

interface Props {
  budgetId: number
  subCategory: ICostCenterSubCategory
  selectedMonth: any | null
  changeEdit: any
  status: string
  changeDisabledSave: any
}

const logisticSchema = z.object({
  accommodationInCents: z.number(),
  foodInCents: z.number(),
  transportInCents: z.number(),
  carAndFuelInCents: z.number(),
  airfareInCents: z.number(),
  numberOfPeople: z.number(),
  dailyAccommodation: z.number(),
  dailyFood: z.number(),
  dailyTransport: z.number(),
  dailyCarAndFuel: z.number(),
  totalTrips: z.array(z.number().optional()),
})
// extracting the type
type Logistic = z.infer<typeof logisticSchema>

export default function FormLogistic({
  budgetId,
  subCategory,
  selectedMonth,
  changeEdit,
  status,
  changeDisabledSave,
}: Props) {
  console.log('selectedMonth :', selectedMonth)
  const [showModalConfirmCalculation, setShowModalConfirmCalculation] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalTootip, setShowModalTootip] = useState(false)
  const [showModalEmptyHistoric, setShowModalEmptyHistoric] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorMonth, setErrorMonth] = useState('')
  const [monthTravels, setMonthTravels] = useState<number[]>([])

  useEffect(() => {
    if (selectedMonth) {
      const aux = []
      aux[selectedMonth.month - 1] = selectedMonth?.totalTrips || 0
      setMonthTravels(aux)
      setValue('totalTrips', aux, { shouldValidate: true })
    }
  }, [selectedMonth])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Logistic>({
    defaultValues: {
      accommodationInCents: selectedMonth?.accommodationInCents
        ? selectedMonth?.accommodationInCents / 100
        : 0,
      foodInCents: selectedMonth?.foodInCents ? selectedMonth?.foodInCents / 100 : 0,
      transportInCents: selectedMonth?.transportInCents ? selectedMonth?.transportInCents / 100 : 0,
      carAndFuelInCents: selectedMonth?.carAndFuelInCents
        ? selectedMonth?.carAndFuelInCents / 100
        : 0,
      airfareInCents: selectedMonth?.airfareInCents ? selectedMonth?.airfareInCents / 100 : 0,
      numberOfPeople: selectedMonth?.numberOfPeople || 0,
      dailyAccommodation: selectedMonth?.dailyAccommodation || 0,
      dailyFood: selectedMonth?.dailyFood || 0,
      dailyTransport: selectedMonth?.dailyTransport || 0,
      dailyCarAndFuel: selectedMonth?.dailyCarAndFuel || 0,
      totalTrips: selectedMonth?.totalTrips || 0,
    },
    resolver: zodResolver(logisticSchema),
  })

  const onSubmit: SubmitHandler<Logistic> = async (data, e) => {
    e?.preventDefault()
    changeDisabledSave(true)

    const info = {
      budgetId,
      costCenterSubCategoryId: subCategory?.id,
      months: [],
    } as ICreateLogistic

    monthTravels.forEach((month: number, index) => {
      info.months.push({
        month: index + 1,
        accommodationInCents: data?.accommodationInCents * 100,
        foodInCents: data?.foodInCents * 100,
        transportInCents: data?.transportInCents * 100,
        carAndFuelInCents: data?.carAndFuelInCents * 100,
        airfareInCents: data?.airfareInCents * 100,
        numberOfPeople: data?.numberOfPeople,
        dailyAccommodation: data?.dailyAccommodation,
        dailyFood: data?.dailyFood,
        dailyTransport: data?.dailyTransport,
        dailyCarAndFuel: data?.dailyCarAndFuel,
        totalTrips: month,
      })
    })

    let response
    try {
      response = await createLogistic(info)
    } catch (err) {
      changeDisabledSave(false)
    } finally {
      changeDisabledSave(false)
    }

    if (response?.message) {
      setShowModalConfirm(true)
      setErrorMessage(response.message)
    } else {
      queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
      queryClient.invalidateQueries({ queryKey: ['budget_id'] })
      queryClient.invalidateQueries({ queryKey: ['results_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['logistic_expenses'] })
      setShowModalConfirmCalculation(true)
    }
  }

  const handleChangeMonthTravels = (e: any, index: number) => {
    const aux = monthTravels

    aux[index] = Number(e.target.value.replace(/\D/g, ''))
    setMonthTravels(aux)
    setValue('totalTrips', aux, { shouldValidate: true })
  }

  const getTotal = () => {
    return getTotalAirplane() + getTotalAccommodation() + getTotalExpenses()
  }

  const getTotalAirplane = () => {
    let totalFlights = 0
    monthTravels.forEach((month) => {
      totalFlights += month
    })
    console.log('monthTravels :', monthTravels)
    console.log('monthTravels[0] :', monthTravels[0] != null)

    return totalFlights ? watch('airfareInCents') * totalFlights * watch('numberOfPeople') : 0
  }

  const getTotalAccommodation = () => {
    let totalAccommodation = 0
    monthTravels.forEach((month) => {
      totalAccommodation += month
    })

    return totalAccommodation
      ? watch('accommodationInCents') *
          totalAccommodation *
          watch('numberOfPeople') *
          watch('dailyAccommodation')
      : 0
  }

  const getTotalExpenses = () => {
    let totalDays = 0
    monthTravels.forEach((month) => {
      totalDays += month
    })

    return totalDays
      ? watch('foodInCents') * totalDays * watch('numberOfPeople') * watch('dailyFood') +
          watch('transportInCents') *
            totalDays *
            watch('numberOfPeople') *
            watch('dailyTransport') +
          watch('carAndFuelInCents') *
            totalDays *
            watch('numberOfPeople') *
            watch('dailyCarAndFuel')
      : 0
  }

  const getMonthsConfirm = () => {
    const months = getMonths()
    const changedMonth = [] as IMonth[]

    monthTravels.forEach((month, index) => {
      month > 0 && changedMonth.push(months[index])
    })

    return changedMonth
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex justify-end -mt-[40px]">
        <Tooltip title="Detalhes memória de cálculo" placement="top-start" arrow>
          <IconButton onClick={() => setShowModalTootip(true)}>
            <MdOutlineInfo size={24} color={'#323232'} />
          </IconButton>
        </Tooltip>
      </div>
      <div className="bg-[#EBF9FE] p-2 mb-3">
        <div className="text-sm mb-5">CONFIGURAÇÃO</div>
        <div>
          <div className="text-xs mb-5">Valores dos produtos</div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Controller
              data-test="accommodationInCents"
              name="accommodationInCents"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  label="Hospedagem"
                  id="accommodationInCents"
                  error={!!errors.accommodationInCents}
                  size="small"
                  helperText={
                    errors.accommodationInCents ? errors.accommodationInCents?.message : ''
                  }
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#fff',
                    },
                  }}
                  disabled={status === 'APROVADO'}
                />
              )}
            />
            <Controller
              data-test="foodInCents"
              name="foodInCents"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  label="Alimentação"
                  id="foodInCents"
                  error={!!errors.foodInCents}
                  size="small"
                  helperText={errors.foodInCents ? errors.foodInCents?.message : ''}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#fff',
                    },
                  }}
                  disabled={status === 'APROVADO'}
                />
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Controller
              data-test="transportInCents"
              name="transportInCents"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  label="Transporte"
                  id="transportInCents"
                  error={!!errors.transportInCents}
                  size="small"
                  helperText={errors.transportInCents ? errors.transportInCents?.message : ''}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#fff',
                    },
                  }}
                  disabled={status === 'APROVADO'}
                />
              )}
            />
            <Controller
              data-test="carAndFuelInCents"
              name="carAndFuelInCents"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  label="Aluguel carro + combustível"
                  id="carAndFuelInCents"
                  error={!!errors.carAndFuelInCents}
                  size="small"
                  helperText={errors.carAndFuelInCents ? errors.carAndFuelInCents?.message : ''}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#fff',
                    },
                  }}
                  disabled={status === 'APROVADO'}
                />
              )}
            />
          </div>
          <div className="mb-3">
            <Controller
              data-test="airfareInCents"
              name="airfareInCents"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  value={field.value?.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                  onChange={(e) => {
                    field.onChange(Number(e.target.value.replace(/\D/g, '')) / 100)
                  }}
                  label="Passagem aérea"
                  id="airfareInCents"
                  error={!!errors.airfareInCents}
                  size="small"
                  helperText={errors.airfareInCents ? errors.airfareInCents?.message : ''}
                  fullWidth
                  sx={{
                    '& .MuiInputBase-root': {
                      background: '#fff',
                    },
                  }}
                  disabled={status === 'APROVADO'}
                />
              )}
            />
          </div>
        </div>
      </div>
      <div className="bg-[#EBF9FE] p-2">
        <div className="text-sm mb-5">Coordenadores estaduais e assistentes</div>
        <div className="mb-3">
          <Controller
            data-test="numberOfPeople"
            name="numberOfPeople"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')))}
                label="Qtd Pessoas"
                id="numberOfPeople"
                error={!!errors.numberOfPeople}
                size="small"
                helperText={errors.numberOfPeople ? errors.numberOfPeople?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
              />
            )}
          />
        </div>
        <div className="text-sm mb-5">Diárias (Multiplicador)</div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Controller
            data-test="dailyAccommodation"
            name="dailyAccommodation"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')))}
                label="Hospedagem"
                id="dailyAccommodation"
                error={!!errors.dailyAccommodation}
                size="small"
                helperText={errors.dailyAccommodation ? errors.dailyAccommodation?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
              />
            )}
          />
          <Controller
            data-test="dailyFood"
            name="dailyFood"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  field.onChange(Number(e.target.value.replace(/\D/g, '')))
                }}
                label="Alimentação"
                id="dailyFood"
                error={!!errors.dailyFood}
                size="small"
                helperText={errors.dailyFood ? errors.dailyFood?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Controller
            data-test="dailyTransport"
            name="dailyTransport"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')))}
                label="Transporte"
                id="dailyTransport"
                error={!!errors.dailyTransport}
                size="small"
                helperText={errors.dailyTransport ? errors.dailyTransport?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
              />
            )}
          />
          <Controller
            data-test="dailyCarAndFuel"
            name="dailyCarAndFuel"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  field.onChange(Number(e.target.value.replace(/\D/g, '')))
                }}
                label="Aluguel carro + combustível"
                id="dailyCarAndFuel"
                error={!!errors.dailyCarAndFuel}
                size="small"
                helperText={errors.dailyCarAndFuel ? errors.dailyCarAndFuel?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
              />
            )}
          />
        </div>
        <div className="text-sm mb-5">Qtd de viagens por mês (passagens aéreas)</div>
        <div className="grid grid-cols-6 gap-2 mb-3">
          {getMonths().map((month, index) => (
            <TextField
              key={month?.id}
              value={monthTravels[index]}
              onChange={(e) => {
                handleChangeMonthTravels(e, index)
              }}
              label={month?.name.slice(0, 3)}
              id={month?.name}
              size="small"
              fullWidth
              InputLabelProps={{
                shrink: !!monthTravels[index],
              }}
              sx={{
                '& .MuiInputBase-root': {
                  background: '#fff',
                },
              }}
              disabled={status === 'APROVADO'}
            />
          ))}
        </div>
        <div className="text-erp-danger text-sm mb-2">
          {errors.totalTrips ? 'Selecionar no mínimo um mês' : ''}
        </div>
        <div className="text-erp-danger text-sm mb-2">{errorMonth || ''}</div>
        <div className="grid grid-cols-3 gap-2 ">
          <div className="w-full h-10 rounded-md bg-[#BFEDFC]  text-xs flex flex-col justify-center items-center">
            <div>Passagens Aéreas</div>
            <div className="font-semibold">
              {getTotalAirplane().toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
          <div className="w-full h-10 rounded-md bg-[#BFEDFC]  text-xs flex flex-col justify-center items-center">
            <div>Hospedagem</div>
            <div className="font-semibold">
              {getTotalAccommodation().toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
          <div className="w-full h-10 rounded-md bg-[#BFEDFC]  text-xs flex flex-col justify-center items-center">
            <div>Despesas</div>
            <div className="font-semibold">
              {getTotalExpenses().toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </div>
          </div>
        </div>
        <button type="submit" id="submitCalculation" className="hidden" />
      </div>
      <ModalConfirmCalculationMemory
        open={showModalConfirmCalculation}
        onClose={() => {
          setShowModalConfirmCalculation(false)
          changeEdit(false)
        }}
        months={getMonthsConfirm()}
        subCategory={subCategory}
        value={getTotal().toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
      />
      <ModalConfirm
        open={showModalConfirm}
        onClose={() => {
          setShowModalConfirm(false)
        }}
        text={errorMessage}
        success={false}
      />
      <ModalTootipCalculation
        open={showModalTootip}
        onClose={() => {
          setShowModalTootip(false)
        }}
        title={subCategory?.name}
        text={
          <Fragment>
            <p>
              <strong>Passagens Aéreas =</strong> Qtd De Pessoas * Qtd de viagens em cada mês *
              Custo Da Passagem Aérea.
            </p>
            <br />
            <p>
              <strong>Hospedagem =</strong> Qtd. De Pessoas * Qtd De Viagens em cada mês *
              Multiplicador * Custo médio de hospedagem <br />
              <br />
              <strong>Despesas = SOMA [ i; ii; iii;]</strong>
              <br />
              <strong> i. </strong> Qtd De Pessoas * Qtd de viagens em cada mês * Multiplicador
              (alimentação) * Custo médio de alimentação. <br />
              <strong> ii. </strong> Qtd De Pessoas * Qtd de viagens em cada mês * Multiplicador
              (Transporte) * Custo médio de Transporte.
              <br />
              <strong> iii. </strong> Qtd De Pessoas * Qtd de viagens em cada mês * Multiplicador
              (Aluguel carro + Combust) * Custo médio de Aluguel Carro + Combust.
            </p>
          </Fragment>
        }
      />
      <ModalEmptyHistoric
        open={showModalEmptyHistoric}
        onClose={() => {
          setShowModalEmptyHistoric(false)
        }}
      />
    </form>
  )
}
