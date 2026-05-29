import { deleteResults } from '@/services/CalculationMemory'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { IMonth, getMonths } from '@/utils/dates'
import { queryClient } from 'lib/react-query'
import { Fragment, useState } from 'react'
import { MdOutlineEdit } from 'react-icons/md'
import { PiCalculatorLight } from 'react-icons/pi'
import { TbTrashX } from 'react-icons/tb'
import { ModalAlert } from '../modals/ModalAlert'
import { ModalConfirm } from '../modals/ModalConfirm'
import { Button } from '../ui/button'
import FormCaed from './FormCaed'
import FormIpca from './FormIpca'
import FormLogistic from './FormLogistic'
import FormPersonal from './FormPersonal'

interface Props {
  budgetId: number
  subCategory: ICostCenterSubCategory
  isEditing: boolean
  changeEditing: any
  status: string
  changeDisabledsSave: any
  programName: string
  dataResult: any
}

export default function CalculationMemoryExpenses({
  budgetId,
  subCategory,
  isEditing,
  changeEditing,
  status,
  changeDisabledsSave,
  programName,
  dataResult,
}: Props) {
  const [selectedMonth, setSelectedMonth] = useState<any | null>(null)
  const [showModalQuestionDelete, setShowModalQuestionDelete] = useState<boolean>(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalConfirm, setShowModalConfirm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const getMonthValue = (month: number) => {
    const find = dataResult?.budgetResults?.find((data: any) => data?.month === month)

    return find?.valueInCents ? find?.valueInCents / 100 : 0
  }

  const handleDelete = async () => {
    let response;

    try {
      response = await deleteResults(selectedMonth?.id)
    } catch (err) {
      setIsDisabled(false)
    } finally {
      setIsDisabled(false)
    }

    if (response?.message) {
      setShowModalConfirm(true)
      setErrorMessage(response.message)
      setSuccess(false)
    } else {
      queryClient.invalidateQueries({ queryKey: ['budget_plans'] })
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      queryClient.invalidateQueries({ queryKey: ['budget_plan_id'] })
      queryClient.invalidateQueries({ queryKey: ['budget_id'] })
      queryClient.invalidateQueries({ queryKey: ['results_by_id'] })
      queryClient.invalidateQueries({ queryKey: ['logistic_expenses'] })

      setSuccess(true)

      setShowModalConfirm(true)
    }
  }

  const handleChanceSelectedMonth = (month: IMonth) => {
    const find = dataResult?.budgetResults?.find((data: any) => data?.month === month?.id)

    if (find) {
      setSelectedMonth(find)
    } else {
      setSelectedMonth({
        month: month?.id,
        valueInCents: 0,
        data: null,
        baseValueInCents: 0,
        numberOfEnrollments: 0,
        ipca: 0,
        justification: '',
      })
    }

    changeEditing(true);
  }

  return (
    <div>
      {isEditing ? (
        subCategory?.releaseType === 'CAED' ? (
          <FormCaed
            budgetId={budgetId}
            subCategory={subCategory}
            selectedMonth={selectedMonth}
            changeEdit={changeEditing}
            status={status}
            changeDisabledsSave={changeDisabledsSave}
            programName={programName}
          />
        ) : subCategory?.releaseType === 'DESPESAS_PESSOAIS' ? (
          <FormPersonal
            budgetId={budgetId}
            subCategory={subCategory}
            selectedMonth={selectedMonth}
            changeEdit={changeEditing}
            status={status}
            changeDisabledsSave={changeDisabledsSave}
          />
        ) : subCategory?.releaseType === 'DESPESAS_LOGISTICAS' ? (
          <FormLogistic
            budgetId={budgetId}
            subCategory={subCategory}
            selectedMonth={selectedMonth}
            changeEdit={changeEditing}
            status={status}
            changeDisabledSave={changeDisabledsSave}
          />
        ) : (
          <FormIpca
            budgetId={budgetId}
            subCategory={subCategory}
            selectedMonth={selectedMonth}
            changeEdit={changeEditing}
            status={status}
            changeDisabledsSave={changeDisabledsSave}
          />
        )
      ) : (
        <Fragment>
          <div className="bg-[#EBF9FE] p-2">
            <div>
              {getMonths().map((month) => (
                <div
                  key={`month ${month?.id}`}
                  className={`w-full h-8 mb-1 px-3 flex justify-between items-center text-sm font-bold ${
                    month?.id !== 12 ? 'border-b border-b-[#A1E5FA]' : ''
                  }  rounded-none`}
                >
                  <div>{month?.name}</div>
                  <div className="flex justify-center items-center">
                    {getMonthValue(month?.id).toLocaleString('pt-br', {
                      style: 'currency',
                      currency: 'BRL',
                    })}
                    {status !== 'APROVADO' && getMonthValue(month?.id) !== 0 ? (
                      <TbTrashX
                        color={'#155366'}
                        size={16}
                        className="ml-4 cursor-pointer"
                        onClick={() => {
                          setSelectedMonth(
                            dataResult?.budgetResults?.find(
                              (data: any) => data?.month === month?.id,
                            ),
                          )
                          setShowModalQuestionDelete(true)
                        }}
                      />
                    ) : null}
                    <MdOutlineEdit
                      color={'#155366'}
                      size={16}
                      className="ml-4 cursor-pointer"
                      onClick={() => {
                        handleChanceSelectedMonth(month)
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <Button
            data-test="calculate"
            variant="erpSecondary"
            className="mt-5 w-full"
            disabled={status === 'APROVADO'}
            onClick={() => {
              changeEditing(true)
              setSelectedMonth(null)
            }}
            type="button"
          >
            <PiCalculatorLight size={18} className="mr-2" />
            Calcular
          </Button>
          <ModalAlert
            open={showModalQuestionDelete}
            onConfirm={() => {
              handleDelete()
              setShowModalQuestionDelete(false)
            }}
            onClose={() => {
              setShowModalQuestionDelete(false)
            }}
            text={'Você tem certeza que deseja descartar as informações de gastos? '}
            textConfirm="Descartar informações"
            textCancel="Cancelar"
          />
          <ModalConfirm
            open={showModalConfirm}
            onClose={() => {
              setShowModalConfirm(false)
            }}
            text={success ? 'Informações descartadas com sucesso!' : errorMessage}
            success={success}
          />
        </Fragment>
      )}
    </div>
  )
}
