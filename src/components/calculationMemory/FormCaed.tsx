import { ICreateCaed, createCaed } from '@/services/CalculationMemory'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth, getMonths } from '@/utils/dates'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  TextField,
  Tooltip,
} from '@mui/material'
import { queryClient } from 'lib/react-query'
import { useEffect, useState } from 'react'
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
  programName: string
}

const caedSchema = z.object({
  baseValueInCents: z.number(),
  numberOfEnrollments: z.number(),
})
// extracting the type
type Caed = z.infer<typeof caedSchema>

export default function FormCaed({
  budgetId,
  subCategory,
  selectedMonth,
  changeEdit,
  status,
  changeDisabledsSave,
  programName,
}: Props) {
  const [listSelectedMonths, setListSelectedMonths] = useState<IMonth[]>([])
  const [showModalConfirmCalculation, setShowModalConfirmCalculation] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [showModalTootip, setShowModalTootip] = useState(false)
  const [showModalEmptyHistoric, setShowModalEmptyHistoric] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [errorMonth, setErrorMonth] = useState('')
  const [selectedAll, setSelectedAll] = useState(false)

  useEffect(() => {
    if (selectedMonth) {
      const findMonth = getMonths().find((month) => month?.id === selectedMonth?.month)
      if (findMonth) setListSelectedMonths([findMonth])
      selectedMonth?.baseValueInCents &&
        setValue('baseValueInCents', selectedMonth?.baseValueInCents / 100)
      selectedMonth?.numberOfEnrollments &&
        setValue('numberOfEnrollments', selectedMonth?.numberOfEnrollments)
    }
  }, [selectedMonth])

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<Caed>({
    defaultValues: {
      baseValueInCents: 0,
      numberOfEnrollments: 0,
    },
    resolver: zodResolver(caedSchema),
  })

  const onSubmit: SubmitHandler<Caed> = async (data, e) => {
    e?.preventDefault()
    changeDisabledsSave(true)

    const info = {
      budgetId,
      costCenterSubCategoryId: subCategory?.id,
      months: [],
    } as ICreateCaed

    if (listSelectedMonths.length === 0) {
      setErrorMonth('Selecionar no mínimo um mês')
      changeDisabledsSave(false)

      return
    } else {
      setErrorMonth('')
    }

    listSelectedMonths.forEach((month: IMonth) => {
      info.months.push({
        month: month?.id,
        baseValueInCents: data?.baseValueInCents * 100,
        numberOfEnrollments: data?.numberOfEnrollments,
      })
    })

    let response
    try {
      response = await createCaed(info)
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
    return (watch('baseValueInCents') * watch('numberOfEnrollments')).toLocaleString('pt-BR', {
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
        <div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Controller
              data-test="numberOfEnrollments"
              name="numberOfEnrollments"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value.replace(/\D/g, '')))}
                  label="Qtd. matrículas"
                  id="numberOfEnrollments"
                  error={!!errors.numberOfEnrollments}
                  size="small"
                  helperText={errors.numberOfEnrollments ? errors.numberOfEnrollments?.message : ''}
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
                  label={
                    programName === 'PARC'
                      ? 'Custo unitário da prova'
                      : 'Custo unitário da formação'
                  }
                  id="baseValueInCents"
                  error={!!errors.baseValueInCents}
                  size="small"
                  helperText={errors.baseValueInCents ? errors.baseValueInCents?.message : ''}
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
          <div className="text-xs mb-2">Prévia - Custo Total</div>
          <div className="w-full h-10 rounded-md bg-[#BFEDFC] font-semibold text-sm flex justify-center items-center">
            {getTotal()}
          </div>
        </div>
      </div>
      <div className="bg-[#EBF9FE] p-2">
        <div>APLICAR AOS MESES</div>
        <div></div>
        <FormGroup sx={{ display: 'flex', justifyContent: 'center', marginLeft: '8px' }}>
          <FormControlLabel
            key={'all'}
            control={
              <Checkbox onChange={() => handleChangeAllMonths()} disabled={status === 'APROVADO'} />
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
                  disabled={status === 'APROVADO'}
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
        value={(watch('baseValueInCents') * watch('numberOfEnrollments')).toLocaleString('pt-BR', {
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
        text={'Qtd matrículas X Custo unitário da formação'}
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
