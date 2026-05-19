import { ICreatePersonal, createPersonal } from '@/services/CalculationMemory'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth, getMonths } from '@/utils/dates'
import { educationCalculationList } from '@/utils/enums'
import { zodResolver } from '@hookform/resolvers/zod'
import { Autocomplete, IconButton, InputAdornment, TextField, Tooltip } from '@mui/material'
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
  changeDisabledsSave: any
}

const personalSchema = z.object({
  education: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  employmentRelationship: z
    .string({
      required_error: 'Campo Obrigatório',
      invalid_type_error: 'Campo Obrigatório',
    })
    .nonempty({ message: 'Campo Obrigatório' }),
  numberOfFinancialDirectors: z.number().default(0),
  salaryInCents: z.number(),
  salaryAdjustment: z
    .string()
    .default('0')
    .transform((value) => Number(value)),
  inssEmployer: z.coerce.number().default(0.0),
  inss: z.coerce.number().default(0.0),
  fgtsCharges: z.coerce.number().default(0.0),
  pisCharges: z.coerce.number().default(0.0),
  transportationVouchersInCents: z.number().default(0.0),
  foodVoucherInCents: z.number().default(0.0),
  healthInsuranceInCents: z.number().default(0.0),
  lifeInsuranceInCents: z.number().default(0.0),
  holidaysAndChargesInCents: z.number().default(0.0),
  allowanceInCents: z.number().default(0.0),
  thirteenthInCents: z.number().default(0.0),
  fgtsInCents: z.number().default(0.0),
})
// extracting the type
type Personal = z.infer<typeof personalSchema>

export default function FormPersonal({
  budgetId,
  subCategory,
  selectedMonth,
  changeEdit,
  status,
  changeDisabledsSave,
}: Props) {
  const [listSelectedMonths, setListSelectedMonths] = useState<IMonth[]>([])
  const [showModalConfirmCalculation, setShowModalConfirmCalculation] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalTootip, setShowModalTootip] = useState(false)
  const [showModalEmptyHistoric, setShowModalEmptyHistoric] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorMonth, setErrorMonth] = useState('')
  const [salaryTotal, setSalaryTotal] = useState(0)
  const [employmentRelationship, setEmploymentRelationship] = useState(null)
  const [totalCharges, setTotalCharges] = useState(0)
  const [totalBenefits, setTotalBenefits] = useState(0)
  const [totalProvisions, setTotalProvisions] = useState(0)

  useEffect(() => {
    if (selectedMonth) {
      const findMonth = getMonths().find((month) => month?.id === selectedMonth?.month)
      if (findMonth) setListSelectedMonths([findMonth])
    }
  }, [selectedMonth])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Personal>({
    defaultValues: {
      education: selectedMonth?.education,
      employmentRelationship: selectedMonth?.employmentRelationship,
      numberOfFinancialDirectors: selectedMonth?.numberOfFinancialDirectors
        ? selectedMonth?.numberOfFinancialDirectors
        : 0,
      salaryInCents: selectedMonth?.salaryInCents ? selectedMonth?.salaryInCents / 100 : 0,
      salaryAdjustment: selectedMonth?.salaryAdjustment
        ? selectedMonth?.salaryAdjustment.toString()
        : '0',
      inssEmployer: selectedMonth?.inssEmployer ? selectedMonth?.inssEmployer.toString() : 0,
      inss: selectedMonth?.inss ? selectedMonth?.inss.toString() : 0,
      fgtsCharges: selectedMonth?.fgtsCharges ? selectedMonth?.fgtsCharges.toString() : 0,
      pisCharges: selectedMonth?.pisCharges ? selectedMonth?.pisCharges.toString() : 0,
      transportationVouchersInCents: selectedMonth?.transportationVouchersInCents
        ? selectedMonth?.transportationVouchersInCents / 100
        : 0,
      foodVoucherInCents: selectedMonth?.foodVoucherInCents
        ? selectedMonth?.foodVoucherInCents / 100
        : 0,
      healthInsuranceInCents: selectedMonth?.healthInsuranceInCents
        ? selectedMonth?.healthInsuranceInCents / 100
        : 0,
      lifeInsuranceInCents: selectedMonth?.lifeInsuranceInCents
        ? selectedMonth?.lifeInsuranceInCents / 100
        : 0,
      holidaysAndChargesInCents: selectedMonth?.holidaysAndChargesInCents
        ? selectedMonth?.holidaysAndChargesInCents / 100
        : 0,
      allowanceInCents: selectedMonth?.allowanceInCents ? selectedMonth?.allowanceInCents / 100 : 0,
      thirteenthInCents: selectedMonth?.thirteenthInCents
        ? selectedMonth?.thirteenthInCents / 100
        : 0,
      fgtsInCents: selectedMonth?.fgtsInCents ? selectedMonth?.fgtsInCents / 100 : 0,
    },
    resolver: zodResolver(personalSchema),
  })

  const onSubmit: SubmitHandler<Personal> = async (data, e) => {
    e?.preventDefault()
    changeDisabledsSave(true)

    const info = {
      budgetId,
      costCenterSubCategoryId: subCategory?.id,
      months: [],
    } as ICreatePersonal

    if (listSelectedMonths.length === 0) {
      changeDisabledsSave(false)

      setErrorMonth('Selecionar no mínimo um mês')
      return
    } else {
      setErrorMonth('')
    }

    listSelectedMonths.forEach((month: IMonth) => {
      info.months.push({
        month: month?.id,
        education: data?.education,
        employmentRelationship: data?.employmentRelationship,
        numberOfFinancialDirectors: data?.numberOfFinancialDirectors,
        salaryInCents: data?.salaryInCents * 100,
        salaryAdjustment: data?.salaryAdjustment,
        inssEmployer: data?.inssEmployer,
        inss: data?.inss,
        fgtsCharges: data?.fgtsCharges,
        pisCharges: data?.pisCharges,
        transportationVouchersInCents: data?.transportationVouchersInCents * 100,
        foodVoucherInCents: data?.foodVoucherInCents * 100,
        healthInsuranceInCents: data?.healthInsuranceInCents * 100,
        lifeInsuranceInCents: data?.lifeInsuranceInCents * 100,
        holidaysAndChargesInCents: data?.holidaysAndChargesInCents * 100,
        allowanceInCents: data?.allowanceInCents * 100,
        thirteenthInCents: data?.thirteenthInCents * 100,
        fgtsInCents: data?.fgtsInCents * 100,
      })
    })

    let response
    try {
      response = await createPersonal(info)
    } catch (err) {
      changeDisabledsSave(false)
    } finally {
      changeDisabledsSave(false)
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
      setShowModalConfirmCalculation(true)
    }
  }

  function removeDuplicates(array: IMonth[]) {
    for (let i = 0; i < array.length; i++) {
      for (let j = i + 1; j < array.length; j++) {
        if (array[i]?.id === array[j]?.id) {
          // Dois valores iguais encontrados, remova ambos
          array.splice(i, 1)
          array.splice(j - 1, 1)
          // Atualize os índices após a remoção
          i--
          j--
        }
      }
    }
    return array
  }

  const handleChangeMonth = (months: IMonth[]) => {
    const arrayWithoutDuplicates = removeDuplicates(months)
    setListSelectedMonths(arrayWithoutDuplicates)
  }

  const getTotal = (months: number) => {
    return ((salaryTotal + totalBenefits + totalCharges + totalProvisions) * months).toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL',
      },
    )
  }

  useEffect(() => {
    setSalaryTotal(
      (watch('salaryInCents') * watch('salaryAdjustment')) / 100 + watch('salaryInCents'),
    )
    if (employmentRelationship === 'CLT') {
      setValue('thirteenthInCents', (totalCharges + salaryTotal) / 12)
    } else {
      setValue('thirteenthInCents', 0)
    }
  }, [
    watch('salaryInCents'),
    watch('salaryAdjustment'),
    totalCharges,
    salaryTotal,
    employmentRelationship,
  ])

  useEffect(() => {
    setTotalCharges(
      (watch('inssEmployer') * salaryTotal) / 100 +
        (watch('inss') * salaryTotal) / 100 +
        (watch('fgtsCharges') * salaryTotal) / 100 +
        (watch('pisCharges') * salaryTotal) / 100,
    )

    if (employmentRelationship === 'CLT') {
      setValue('thirteenthInCents', (totalCharges + salaryTotal) / 12)
    } else {
      setValue('thirteenthInCents', 0)
    }
  }, [
    salaryTotal,
    watch('inssEmployer'),
    watch('inss'),
    watch('fgtsCharges'),
    watch('pisCharges'),
    employmentRelationship,
  ])

  useEffect(() => {
    setTotalBenefits(
      watch('transportationVouchersInCents') +
        watch('foodVoucherInCents') +
        watch('healthInsuranceInCents') +
        watch('lifeInsuranceInCents'),
    )
  }, [
    salaryTotal,
    watch('transportationVouchersInCents'),
    watch('foodVoucherInCents'),
    watch('healthInsuranceInCents'),
    watch('lifeInsuranceInCents'),
  ])

  useEffect(() => {
    setTotalProvisions(
      watch('holidaysAndChargesInCents') +
        watch('allowanceInCents') +
        watch('thirteenthInCents') +
        watch('fgtsInCents'),
    )
  }, [
    watch('holidaysAndChargesInCents'),
    watch('allowanceInCents'),
    watch('thirteenthInCents'),
    watch('fgtsInCents'),
  ])

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
        <div className="text-sm mb-5">Tipo</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Controller
            name="education"
            control={control}
            render={({ field }) => (
              <Autocomplete
                fullWidth
                id="education"
                size="small"
                noOptionsText="Nível"
                value={field.value}
                options={Object.keys(educationCalculationList)}
                getOptionLabel={(option) => educationCalculationList[option]}
                onChange={(_event, newValue) => {
                  field.onChange(newValue)
                }}
                disabled={status === 'APROVADO'}
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Nível"
                    error={!!errors.education}
                    helperText={errors.education ? errors.education?.message : ''}
                  />
                )}
              />
            )}
          />
          <Controller
            name="employmentRelationship"
            control={control}
            render={({ field }) => (
              <Autocomplete
                fullWidth
                id="employmentRelationship"
                size="small"
                noOptionsText="Vínculo"
                value={field.value}
                options={['CLT', 'PJ']}
                onChange={(_event, newValue) => {
                  field.onChange(newValue)
                  setEmploymentRelationship(newValue)
                }}
                disabled={status === 'APROVADO'}
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Vínculo"
                    error={!!errors.employmentRelationship}
                    helperText={
                      errors.employmentRelationship ? errors.employmentRelationship?.message : ''
                    }
                  />
                )}
              />
            )}
          />
        </div>
        <div className="text-sm mb-5">Remuneração Bruta Mensal</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Controller
            data-test="numberOfFinancialDirectors"
            name="numberOfFinancialDirectors"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')))}
                label={`Qtd de ${subCategory?.name}`}
                id="numberOfFinancialDirectors"
                error={!!errors.numberOfFinancialDirectors}
                size="small"
                helperText={
                  errors.numberOfFinancialDirectors
                    ? errors.numberOfFinancialDirectors?.message
                    : ''
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
          <Autocomplete
            fullWidth
            id="months"
            size="small"
            multiple
            noOptionsText="Meses"
            value={listSelectedMonths}
            options={getMonths()}
            onChange={(_event, newValue) => {
              handleChangeMonth(newValue)
            }}
            disabled={status === 'APROVADO'}
            getOptionLabel={(option) => option.name}
            sx={{
              '& .MuiInputBase-root': {
                background: '#fff',
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Meses"
                error={!!errorMonth}
                helperText={errorMonth || ''}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Controller
            data-test="salaryInCents"
            name="salaryInCents"
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
                label="Salário"
                id="salaryInCents"
                error={!!errors.salaryInCents}
                size="small"
                helperText={errors.salaryInCents ? errors.salaryInCents?.message : ''}
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
            data-test="salaryAdjustment"
            name="salaryAdjustment"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                }
                label="Reajuste (%)"
                id="salaryAdjustment"
                error={!!errors.salaryAdjustment}
                size="small"
                helperText={errors.salaryAdjustment ? errors.salaryAdjustment?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <div className="font-black">%</div>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Salário Total"
            id="salaryTotal"
            value={salaryTotal.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            size="small"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                background: '#fff',
              },
            }}
            disabled={true}
          />
        </div>
        <div className="text-sm mb-5">Encargos Mensais (%)</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Controller
            data-test="inssEmployer"
            name="inssEmployer"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                }
                label="INSS Patronal"
                id="inssEmployer"
                error={!!errors.inssEmployer}
                size="small"
                helperText={errors.inssEmployer ? errors.inssEmployer?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <div className="font-black">%</div>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            data-test="inss"
            name="inss"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                }
                label="INSS"
                id="inss"
                error={!!errors.inss}
                size="small"
                helperText={errors.inss ? errors.inss?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <div className="font-black">%</div>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <Controller
            data-test="fgtsCharges"
            name="fgtsCharges"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                }
                label="FGTS"
                id="fgtsCharges"
                error={!!errors.fgtsCharges}
                size="small"
                helperText={errors.fgtsCharges ? errors.fgtsCharges?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <div className="font-black">%</div>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Controller
            data-test="pisCharges"
            name="pisCharges"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                }
                label="PIS"
                id="pisCharges"
                error={!!errors.pisCharges}
                size="small"
                helperText={errors.pisCharges ? errors.pisCharges?.message : ''}
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={status === 'APROVADO'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="start">
                      <div className="font-black">%</div>
                    </InputAdornment>
                  ),
                }}
              />
            )}
          />
          <TextField
            label="Total Encargos"
            id="totalCharges"
            value={totalCharges.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            size="small"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                background: '#fff',
              },
            }}
            disabled={true}
          />
        </div>
        <div className="text-sm mb-5">Benefícios Mensais</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Controller
            data-test="transportationVouchersInCents"
            name="transportationVouchersInCents"
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
                label="Vale Transporte"
                id="transportationVouchersInCents"
                error={!!errors.transportationVouchersInCents}
                size="small"
                helperText={
                  errors.transportationVouchersInCents
                    ? errors.transportationVouchersInCents?.message
                    : ''
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
            data-test="foodVoucherInCents"
            name="foodVoucherInCents"
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
                id="foodVoucherInCents"
                error={!!errors.foodVoucherInCents}
                size="small"
                helperText={errors.foodVoucherInCents ? errors.foodVoucherInCents?.message : ''}
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
            data-test="healthInsuranceInCents"
            name="healthInsuranceInCents"
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
                label="Plano de Saúde"
                id="healthInsuranceInCents"
                error={!!errors.healthInsuranceInCents}
                size="small"
                helperText={
                  errors.healthInsuranceInCents ? errors.healthInsuranceInCents?.message : ''
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
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Controller
            data-test="lifeInsuranceInCents"
            name="lifeInsuranceInCents"
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
                label="Seguro de Vida"
                id="lifeInsuranceInCents"
                error={!!errors.lifeInsuranceInCents}
                size="small"
                helperText={errors.lifeInsuranceInCents ? errors.lifeInsuranceInCents?.message : ''}
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
          <TextField
            value={totalBenefits.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            label="Total Benefícios"
            id="totalBenefits"
            size="small"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                background: '#fff',
              },
            }}
            disabled={true}
          />
        </div>
        <div className="text-sm mb-5">Provisões Mensais</div>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Controller
            data-test="holidaysAndChargesInCents"
            name="holidaysAndChargesInCents"
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
                label="Férias + Encargos"
                id="holidaysAndChargesInCents"
                error={!!errors.holidaysAndChargesInCents}
                size="small"
                helperText={
                  errors.holidaysAndChargesInCents ? errors.holidaysAndChargesInCents?.message : ''
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
            data-test="allowanceInCents"
            name="allowanceInCents"
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
                label="Abono"
                id="allowanceInCents"
                error={!!errors.allowanceInCents}
                size="small"
                helperText={errors.allowanceInCents ? errors.allowanceInCents?.message : ''}
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
            data-test="thirteenthInCents"
            name="thirteenthInCents"
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
                label="13º + Encargos"
                id="thirteenthInCents"
                size="small"
                fullWidth
                sx={{
                  '& .MuiInputBase-root': {
                    background: '#fff',
                  },
                }}
                disabled={true}
              />
            )}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Controller
            data-test="fgtsInCents"
            name="fgtsInCents"
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
                label="FGTS (Multa + Adicional)"
                id="fgtsInCents"
                error={!!errors.fgtsInCents}
                size="small"
                helperText={errors.fgtsInCents ? errors.fgtsInCents?.message : ''}
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
          <TextField
            value={totalProvisions.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
            label="Total Provisões"
            id="totalProvisions"
            size="small"
            fullWidth
            sx={{
              '& .MuiInputBase-root': {
                background: '#fff',
              },
            }}
            disabled={true}
          />
        </div>
        <div className="text-xs mb-2">Custo Total</div>
        <div className="grid grid-cols-2 gap-2 ">
          <div className="w-full h-10 rounded-md bg-[#BFEDFC]  text-xs flex flex-col justify-center items-center">
            <div>Mensal</div>
            <div className="font-semibold">{getTotal(1)}</div>
          </div>
          <div className="w-full h-10 rounded-md bg-[#BFEDFC]  text-xs flex flex-col justify-center items-center">
            <div>Anual</div>
            <div className="font-semibold">{getTotal(listSelectedMonths?.length)}</div>
          </div>
        </div>
      </div>
      <button type="submit" id="submitCalculation" className="hidden" />
      <ModalConfirmCalculationMemory
        open={showModalConfirmCalculation}
        onClose={() => {
          setShowModalConfirmCalculation(false)
          changeEdit(false)
        }}
        months={listSelectedMonths}
        subCategory={subCategory}
        value={getTotal(1)}
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
              <strong>Salário Total</strong> <br />
              (Reajuste (%) * Salário) + Salário
            </p>
            <br />
            <p>
              <strong>Total Encargos</strong> <br />
              (INSS Patronal * Salário Total) + (INSS * Salário Total) (FGTS * Salário Total) + (PIS
              * Salário Total)
            </p>

            <br />
            <p>
              <strong>Total de Benefícios</strong>
              <br />
              VT + Alimentação + Plano de Saúde + Seguro de vida
            </p>
            <br />
            <p>
              <strong>13 + Encargos</strong> <br />
              Salário Total + Total Encargos / 12
            </p>
            <br />
            <p>
              <strong>Total Provisões</strong> <br />
              &apos;Férias + Encargos&apos; + Abono + &apos;13 + Encargos&apos; + FGTS
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
