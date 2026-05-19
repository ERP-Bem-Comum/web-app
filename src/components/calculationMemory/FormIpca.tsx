import { ICreateIpca, createIpca, useGetAllResultsLastYear } from '@/services/CalculationMemory'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth, getMonths } from '@/utils/dates'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputAdornment,
  Switch,
  TextField,
  Tooltip,
} from '@mui/material'
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

const ipcaSchema = z.object({
  baseValueInCents: z.number(),
  ipca: z.preprocess((val) => Number(val), z.number()),
  justification: z.string().optional(),
})
// extracting the type
type Ipca = z.infer<typeof ipcaSchema>

export default function FormIpca({
  budgetId,
  subCategory,
  selectedMonth,
  changeEdit,
  status,
  changeDisabledsSave,
}: Props) {
  const [yearBefore, setYearBefore] = useState(false)
  const [listSelectedMonths, setListSelectedMonths] = useState<IMonth[]>([])
  const [showModalConfirmCalculation, setShowModalConfirmCalculation] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalTootip, setShowModalTootip] = useState(false)
  const [showModalEmptyHistoric, setShowModalEmptyHistoric] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorMonth, setErrorMonth] = useState('')
  const [selectedAll, setSelectedAll] = useState(false)
  const [isMonthDisabled, setIsMonthDisabled] = useState(false)

  const { data: dataLast, isLoading: isLoadingLast } = useGetAllResultsLastYear({
    budgetId,
    subCategoryId: subCategory?.id,
    enabled: yearBefore,
  })

  useEffect(() => {
    if (yearBefore) {
      if (dataLast?.budgetResults?.length === 0 || dataLast?.message) {
        setShowModalEmptyHistoric(true)
        document.getElementById('lastYear')?.click()
        return
      }
      setValue(
        'baseValueInCents',
        dataLast?.budgetResults[0]?.baseValueInCents
          ? dataLast?.budgetResults[0]?.baseValueInCents / 100
          : 1,
        {
          shouldValidate: true,
        },
      )
      setValue(
        'ipca',
        dataLast?.budgetResults[0]?.ipca ? dataLast?.budgetResults[0]?.ipca.toString() : '1',
        {
          shouldValidate: true,
        },
      )
      const months = [] as IMonth[]
      listSelectedMonths?.forEach((month) => {
        const checkbox = document.getElementById(`month${month?.id}`) as HTMLInputElement
        checkbox.click()
      })

      dataLast?.budgetResults?.forEach((budget: any) => {
        document.getElementById(`month${budget.month}`)?.click()

        const findMonth = getMonths().find((month) => month?.id === budget?.month)
        findMonth && months.push(findMonth)
      })
      setListSelectedMonths(months)
      setIsMonthDisabled(true)
    }
  }, [dataLast])

  useEffect(() => {
    if (!yearBefore) {
      const findMonth = getMonths().find((month) => month?.id === selectedMonth?.month)
      if (findMonth) {
        listSelectedMonths.forEach((month) => {
          findMonth?.id !== month?.id && document.getElementById(`month${month.id}`)?.click()
        })
        setListSelectedMonths([findMonth])
      } else {
        listSelectedMonths.forEach((month) => {
          document.getElementById(`month${month.id}`)?.click()
        })
        setListSelectedMonths([])
      }
      selectedMonth?.baseValueInCents
        ? setValue('baseValueInCents', selectedMonth?.baseValueInCents / 100)
        : setValue('baseValueInCents', 0)

      selectedMonth?.ipca ? setValue('ipca', selectedMonth?.ipca.toString()) : setValue('ipca', 0)
      selectedMonth?.justification
        ? setValue('justification', selectedMonth?.justification)
        : setValue('justification', '')
    }
  }, [selectedMonth, yearBefore])
  const {
    control,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
    reset,
  } = useForm<Ipca>({
    defaultValues: {
      baseValueInCents: 0,
      ipca: 0,
      justification: '',
    },
    resolver: zodResolver(ipcaSchema),
  })

  const onSubmit: SubmitHandler<Ipca> = async (data, e) => {
    e?.preventDefault()
    changeDisabledsSave(true)

    // } else {
    //   setErrorMonth('')
    // }

    if (listSelectedMonths.length === 0) {
      changeDisabledsSave(false)

      setErrorMonth('Selecionar no mínimo um mês')
      return
    } else {
      setErrorMonth('')
    }

    const info = {
      budgetId,
      costCenterSubCategoryId: subCategory?.id,
      months: [],
    } as ICreateIpca

    if (yearBefore) {
      info.months = dataLast?.budgetResults
    } else {
      listSelectedMonths.forEach((month: IMonth) => {
        info.months.push({
          month: month?.id,
          baseValueInCents: Math.round(data?.baseValueInCents * 100),
          ipca: data?.ipca,
          justification: data?.justification,
        })
      })
    }

    let response
    try {
      response = await createIpca(info)
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

  const handleChangeMonth = (monthId: IMonth) => {
    if (listSelectedMonths.find((month) => month?.id === monthId?.id)) {
      setListSelectedMonths(listSelectedMonths.filter((month) => month?.id !== monthId?.id))
    } else listSelectedMonths.push(monthId)
  }

  const handleChangeAllMonths = () => {
    if (selectedAll) {
      listSelectedMonths.forEach((month) => {
        document.getElementById(`month${month.id}`)?.click()
      })
      setListSelectedMonths([])
    } else {
      const months = [] as IMonth[]
      getMonths().forEach((month) => {
        if (!listSelectedMonths.find((_month) => _month?.id === month?.id)) {
          document.getElementById(`month${month.id}`)?.click()
        }
        months.push(month)
      })
      setListSelectedMonths(months)
    }
    setSelectedAll(!selectedAll)
  }

  const getTotal = () => {
    return (
      (watch('baseValueInCents') * watch('ipca')) / 100 +
      watch('baseValueInCents')
    ).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
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
          <FormControlLabel
            id="lastYear"
            control={<Switch color="primary" defaultChecked={yearBefore} />}
            label="Utilizar ano anterior"
            labelPlacement="end"
            sx={{ marginBottom: '21px', fontSize: '14px' }}
            onChange={() => {
              setYearBefore(!yearBefore)
              setIsMonthDisabled(false)
            }}
            disabled={status === 'APROVADO'}
          />
          {!yearBefore && (
            <Fragment>
              <Controller
                data-test="baseValueInCents"
                name="baseValueInCents"
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
                    label="Total reajustado"
                    id="baseValueInCents"
                    error={!!errors.baseValueInCents}
                    size="small"
                    helperText={errors.baseValueInCents ? errors.baseValueInCents?.message : ''}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        background: '#fff',
                      },
                      marginBottom: '10px',
                    }}
                    disabled={status === 'APROVADO'}
                  />
                )}
              />
              <Controller
                data-test="justification"
                name="justification"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Justificativa"
                    id="justification"
                    inputProps={{ maxLength: 30 }}
                    error={!!errors.justification}
                    size="small"
                    helperText={errors.justification ? errors.justification?.message : ''}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        background: '#fff',
                      },
                      marginBottom: '10px',
                    }}
                    disabled={status === 'APROVADO'}
                  />
                )}
              />
              <Controller
                data-test="ipca"
                name="ipca"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="IPCA (%)"
                    onChange={(e) =>
                      field.onChange(e.target.value.replace(/,/g, '.').replace(/[^\d.]/g, ''))
                    }
                    id="ipca"
                    error={!!errors.ipca}
                    size="small"
                    helperText={errors.ipca ? errors.ipca?.message : ''}
                    fullWidth
                    sx={{
                      '& .MuiInputBase-root': {
                        background: '#fff',
                      },
                      marginBottom: '10px',
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
              <div className="text-xs mb-2">Custo Total</div>
              <div className="w-full h-10 rounded-md bg-[#BFEDFC] font-semibold text-sm flex justify-center items-center">
                {getTotal()}
              </div>
            </Fragment>
          )}
        </div>
      </div>
      <div className="bg-[#EBF9FE] p-2">
        <div>APLICAR AOS MESES</div>
        <div></div>
        <FormGroup sx={{ display: 'flex', justifyContent: 'center', marginLeft: '8px' }}>
          <FormControlLabel
            key={'all'}
            control={
              <Checkbox
                onChange={() => handleChangeAllMonths()}
                disabled={status === 'APROVADO' || isMonthDisabled}
                // checked={getChecked(month)}
              />
            }
            label={'Todos'}
            sx={{
              borderBottom: '1px solid #A1E5FA',
            }}
          />
          {getMonths().map((month) => (
            <FormControlLabel
              key={month?.id}
              id={`month${month.id}`}
              control={
                <Checkbox
                  onChange={() => handleChangeMonth(month)}
                  defaultChecked={selectedMonth?.month === month?.id}
                  disabled={status === 'APROVADO' || isMonthDisabled}
                  // checked={getChecked(month)}
                />
              }
              label={month?.name}
              sx={{
                borderBottom: '1px solid #A1E5FA',
              }}
            />
          ))}
        </FormGroup>
        <div className="text-erp-danger text-sm">{errorMonth}</div>
        <button type="submit" id="submitCalculation" className="hidden" />
      </div>
      <ModalConfirmCalculationMemory
        open={showModalConfirmCalculation}
        onClose={() => {
          setShowModalConfirmCalculation(false)
          changeEdit(false)
        }}
        months={listSelectedMonths}
        subCategory={subCategory}
        value={(
          (watch('baseValueInCents') * watch('ipca')) / 100 +
          watch('baseValueInCents')
        ).toLocaleString('pt-BR', {
          style: 'currency',
          currency: 'BRL',
        })}
        yearBefore={yearBefore}
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
        text={'Ajuste X % de IPCA sobre o TOTAL DO ANO ANTERIOR.'}
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
