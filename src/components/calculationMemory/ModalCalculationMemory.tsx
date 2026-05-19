import { Button } from '@/components/ui/button'
import { useGetAllResultsByBudget, useGetLogisticExpenses } from '@/services/CalculationMemory'
import { ICostCenterCategory } from '@/types/category'
import { ICostCenter } from '@/types/costCenter'
import { ICostCenterSubCategory } from '@/types/subCategory'
import { Box, Modal } from '@mui/material'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdOutlineClose } from 'react-icons/md'
import { ModalAlert } from '../modals/ModalAlert'
import CalculationMemoryExpenses from './CalculationMemoryExpenses'

interface Props {
  open: boolean
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onClose: any
  budget: any
  budgetPlanName: string
  costCenter: ICostCenter[]
  startCostCenter: ICostCenter
  startCategory: ICostCenterCategory | null
  startSubCategory: ICostCenterSubCategory | null
  status: string
  programName: string
}

export function ModalCalculationMemory({
  open,
  onClose,
  budget,
  budgetPlanName,
  costCenter,
  startCostCenter,
  startCategory,
  startSubCategory,
  status,
  programName,
}: Props) {
  const [selectedCostCenter, setSelectedCostCenter] = useState<ICostCenter | null>(
    costCenter ? costCenter[0] : null,
  )
  const [selectedCategory, setSelectedCategory] = useState<ICostCenterCategory | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<ICostCenterSubCategory | null>(
    null,
  )
  const [auxCostCenter, setAuxCostCenter] = useState<ICostCenter | null>(null)
  const [auxCategory, setAuxCategory] = useState<ICostCenterCategory | null>(null)
  const [auxSubCategory, setAuxSubCategory] = useState<ICostCenterSubCategory | null>(null)
  const [isDisabled, setIsDisabled] = useState(false)
  const [showModalQuestion, setShowModalQuestion] = useState(false)
  const [showModalQuestionChange, setShowModalQuestionChange] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [indexCostCenter, setIndexCostCenter] = useState(0)

  const { data: dataResult, isLoading: isLoadingResult } = useGetAllResultsByBudget({
    budgetId: budget?.id,
    subCategoryId: selectedSubCategory?.id,
  })

  const { data: dataLogistic, isLoading: isLoadingLogistic } = useGetLogisticExpenses({
    budgetId: budget?.id,
    categoryId: selectedCategory?.id,
    enabled: selectedCostCenter?.name === 'Logística' ? !!selectedCategory : false,
  })

  useEffect(() => {
    if (costCenter) setSelectedCostCenter(costCenter[0])

    if (startCostCenter) {
      setSelectedCostCenter(startCostCenter)
      setIndexCostCenter(costCenter?.indexOf(startCostCenter))
    }
    if (startCategory) {
      setSelectedCategory(startCategory)
    }
    if (startSubCategory) {
      setSelectedSubCategory(startSubCategory)
    }
  }, [costCenter, startCostCenter, startCategory, startSubCategory])

  const handleClose = () => {
    setIsEditing(false)
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    onClose()
    setShowModalQuestion(false)
  }

  const getTotalSubcategory = () => {
    let total = 0

    dataResult?.budgetResults.forEach((result: any) => (total += Number(result.valueInCents)))

    return (total / 100)?.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    })
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="modal-modal-title"
      aria-describedby="modal-modal-description"
      className=""
    >
      <Box
        className={`w-screen h-screen bg-erp-background absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-6 overflow-y-auto`}
      >
        <div className="flex items-center justify-between">
          <div className="text-xl font-bold">Calculando Gastos - {budgetPlanName}</div>
          <Button
            variant="ghost"
            size="none"
            data-test="close"
            onClick={() => (isEditing ? setShowModalQuestion(true) : handleClose())}
          >
            <MdOutlineClose size={32} color={'#155366'} />
          </Button>
        </div>
        <div className="bg-white w-full mt-2">
          <div className="flex items-center justify-stretch">
            <Button
              variant="ghost"
              size="none"
              data-test="previous"
              onClick={() => {
                setIndexCostCenter(indexCostCenter - 1)
                setSelectedCostCenter(costCenter[indexCostCenter - 1])
                setSelectedCategory(null)
                setSelectedSubCategory(null)
                setIsEditing(false)
              }}
              disabled={indexCostCenter === 0}
              className="h-12 w-12"
            >
              <MdKeyboardArrowLeft size={24} />
            </Button>
            {costCenter?.map((center) => (
              <Button
                key={center?.id}
                variant="ghost"
                size="none"
                className={`rounded-none flex-grow text-sm font-bold h-12 text-[#155366] ${
                  selectedCostCenter?.id === center?.id ? 'bg-erp-primary' : 'bg-white'
                }`}
                data-test={center?.id}
                onClick={() => {
                  if (!isEditing || status === 'APROVADO') {
                    setSelectedCostCenter(center)
                    setSelectedCategory(null)
                    setSelectedSubCategory(null)
                    setIsEditing(false)
                  } else {
                    setAuxCostCenter(center)
                    setAuxCategory(null)
                    setAuxSubCategory(null)
                    setShowModalQuestionChange(true)
                  }
                }}
              >
                {center?.name}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="none"
              data-test="next"
              onClick={() => {
                setIndexCostCenter(indexCostCenter + 1)
                setSelectedCostCenter(costCenter[indexCostCenter + 1])
                setSelectedCategory(null)
                setSelectedSubCategory(null)
                setIsEditing(false)
              }}
              disabled={costCenter?.length === indexCostCenter + 1}
              className="h-12 w-12"
            >
              <MdKeyboardArrowRight size={24} />
            </Button>
          </div>
          <div className="bg-erp-primary w-full h-[6px]"></div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div className="bg-white h-full px-3 py-5">
            <div className="mb-5 text-center">Categoria</div>
            {selectedCostCenter?.categories?.map((category) => (
              <Button
                key={category?.id}
                variant="ghost"
                size="none"
                className={`w-full px-3 mb-1 flex justify-between text-sm font-bold h-12 text-[#155366] ${
                  selectedCategory?.id === category?.id ? 'bg-erp-primary' : 'bg-[#EBF9FE]'
                }`}
                data-test={`category ${category?.id}`}
                onClick={() => {
                  if (!isEditing || status === 'APROVADO') {
                    setSelectedCategory(category)
                    setSelectedSubCategory(null)
                    setIsEditing(false)
                  } else {
                    setAuxCostCenter(selectedCostCenter)
                    setAuxCategory(category)
                    setAuxSubCategory(null)
                    setShowModalQuestionChange(true)
                  }
                }}
              >
                {category?.name}
                <MdKeyboardArrowRight size={24} />
              </Button>
            ))}
            {selectedCostCenter?.name === 'Logística' && !!selectedCategory && (
              <div>
                <div className="py-5 text-center">Gastos consolidando todos os tipos de viagem</div>
                <div className="flex justify-between items-center text-sm font-bold px-3 h-12 text-[#155366] bg-[#EBF9FE] rounded-md mb-1">
                  <div>Passagens Aéreas</div>
                  <div>
                    {dataLogistic?.data?.totalAirfareInCents
                      ? (dataLogistic?.data?.totalAirfareInCents / 100)?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : 'R$0,00'}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-bold px-3 h-12 text-[#155366] bg-[#EBF9FE] rounded-md mb-1">
                  <div>Hospedagem</div>
                  <div>
                    {dataLogistic?.data?.totalAccommodationInCents
                      ? (dataLogistic?.data?.totalAccommodationInCents / 100)?.toLocaleString(
                          'pt-BR',
                          {
                            style: 'currency',
                            currency: 'BRL',
                          },
                        )
                      : 'R$0,00'}
                  </div>
                </div>
                <div className="flex justify-between items-center text-sm font-bold px-3 h-12 text-[#155366] bg-[#EBF9FE] rounded-md">
                  <div>Despesas de viagem</div>
                  <div>
                    {dataLogistic?.data?.totalExpensesInCents
                      ? (dataLogistic?.data?.totalExpensesInCents / 100)?.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : 'R$0,00'}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="bg-white h-full px-3 py-5">
            <div className="mb-5 text-center">Subcategoria</div>
            {selectedCategory &&
              selectedCategory?.subCategories?.map((subCategory) => (
                <Button
                  key={subCategory?.id}
                  variant="ghost"
                  size="none"
                  className={`w-full mb-1 px-3 flex justify-between text-sm font-bold h-12 text-[#155366] ${
                    selectedSubCategory?.id === subCategory?.id ? 'bg-erp-primary' : 'bg-[#EBF9FE]'
                  }`}
                  data-test={`subcategory ${subCategory?.id}`}
                  onClick={() => {
                    if (!isEditing || status === 'APROVADO') {
                      setSelectedSubCategory(subCategory)
                      setIsEditing(false)
                    } else {
                      setAuxCostCenter(selectedCostCenter)
                      setAuxCategory(selectedCategory)
                      setAuxSubCategory(subCategory)
                      setShowModalQuestionChange(true)
                    }
                  }}
                >
                  {subCategory?.name}
                  <MdKeyboardArrowRight size={24} />
                </Button>
              ))}
            {programName === 'PARC' &&
              selectedCostCenter?.name === 'Avaliação Externa' &&
              !!selectedSubCategory && (
                <div>
                  <div className="py-5 text-center">Gastos consolidados</div>
                  <div className="flex justify-between items-center text-sm font-bold px-3 h-12 text-[#155366] bg-[#EBF9FE] rounded-md">
                    <div>Custos relacionados à aplicações de avaliações</div>
                    <div>{getTotalSubcategory()}</div>
                  </div>
                </div>
              )}
          </div>
          <div className="bg-white h-full px-3 py-5">
            <div className="mb-5 text-center">Despesas</div>
            {selectedSubCategory?.id && (
              <CalculationMemoryExpenses
                budgetId={budget?.id}
                subCategory={selectedSubCategory}
                isEditing={isEditing}
                changeEditing={setIsEditing}
                status={status}
                changeDisabledsSave={setIsDisabled}
                programName={programName}
                dataResult={dataResult}
              />
            )}
          </div>
        </div>
        {isEditing && (
          <div className="mt-5 flex justify-end">
            <Button
              data-test="cancel"
              variant="erpSecondary"
              className="mr-4"
              onClick={() => {
                setAuxCostCenter(selectedCostCenter)
                setAuxCategory(selectedCategory)
                setAuxSubCategory(selectedSubCategory)
                setShowModalQuestionChange(true)
              }}
              type="button"
              disabled={status === 'APROVADO' ? true : isDisabled}
            >
              Descartar
            </Button>
            <Button
              data-test="submit"
              variant="erpPrimary"
              type="submit"
              disabled={status === 'APROVADO' ? true : isDisabled}
              onClick={
                () => document.getElementById('submitCalculation')?.click()
                // setSave(!save)
              }
            >
              {isDisabled && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        )}
        <ModalAlert
          open={showModalQuestion}
          onConfirm={handleClose}
          onClose={() => {
            setShowModalQuestion(false)
          }}
          text={'Você tem certeza que deseja descartar as alterações de gastos? '}
          textConfirm="Descartar alterações"
          textCancel="Cancelar"
        />
        <ModalAlert
          open={showModalQuestionChange}
          onConfirm={() => {
            setSelectedCostCenter(auxCostCenter)
            setSelectedCategory(auxCategory)
            setSelectedSubCategory(auxSubCategory)
            setIsEditing(false)
            setShowModalQuestionChange(false)
          }}
          onClose={() => {
            setShowModalQuestionChange(false)
          }}
          text={'Você tem certeza que deseja descartar as alterações de gastos? '}
          textConfirm="Descartar alterações"
          textCancel="Cancelar"
        />
      </Box>
    </Modal>
  )
}
